// index.js - Database Proxy for Railway
// Works with YOUR EXACT database structure
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Get database credentials from Railway environment variables
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Security: Simple API key authentication
const API_KEY = process.env.API_KEY || ''; // insert your own api key from railway.

// Middleware to check API key
const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.replace('Bearer ', '');
  
  if (token !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Health check (no auth required)
app.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'ok', message: 'Database connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get random questions endpoint
app.get('/api/questions/random', authenticateAPI, async (req, res) => {
  try {
    let { difficulty, sources, topics, num_questions } = req.query;

    // Validate and set defaults
    const numQuestions = parseInt(num_questions) || 5;
    if (numQuestions < 1 || numQuestions > 50) {
      return res.status(400).json({ error: 'Invalid number of questions (1-50)' });
    }

    // My database uses difficulty IDs (1, 2, 3)
    difficulty = difficulty || '1,2,3';
    sources = sources || 'College Board';
    topics = topics || '1.1,1.3';  // subtopic codes

    const connection = await pool.getConnection();
    
    try {
      const [results] = await connection.query(
        'CALL GetRandomQuestions(?, ?, ?, ?)',
        [difficulty, sources, topics, numQuestions]
      );
      
      const data = results[0] || [];
      
      if (data.length === 0) {
        return res.json({
          message: 'No questions found with the selected criteria',
          questions: []
        });
      }
      
      res.json(data);
      
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quiz endpoint
app.get('/quiz', authenticateAPI, async (req, res) => {
  try {
    let { difficulty, sources, topics, num_questions } = req.query;

    // Validate
    const numQuestions = parseInt(num_questions) || 5;
    if (numQuestions < 1 || numQuestions > 50) {
      return res.status(400).json({ error: 'Invalid number of questions (1-50)' });
    }


    difficulty = difficulty || '1,2,3';
    sources = sources || 'College Board';
    topics = topics || '1.1,1.3';

    const connection = await pool.getConnection();
    
    try {
      const [results] = await connection.query(
        'CALL GetRandomQuestions(?, ?, ?, ?)',
        [difficulty, sources, topics, numQuestions]
      );
      
      const data = results[0] || [];
      
      console.log('=== DEBUG INFO ===');
      console.log('Number of questions returned:', data.length);
      if (data.length > 0) {
        console.log('First question:', JSON.stringify(data[0], null, 2));
        console.log('Column names:', Object.keys(data[0]));
      }
      
      if (data.length === 0) {
        return res.json({
          message: 'No questions found with the selected criteria',
          questions: [],
          correct_answers: {},
          question_id_to_number: {}
        });
      }
      
      // Build response in the format frontend expects
      const correctAnswers = {};
      const questionIdToNumber = {};
      const questions = [];
      
      data.forEach((row, index) => {
        const questionId = row.id;
        const questionNumber = index + 1;
        
        // Store correct answer
        if (row.correct_answer) {
          correctAnswers[questionId] = row.correct_answer.toLowerCase();
        } else {
          console.warn(`Question ${questionId} missing correct_answer`);
          correctAnswers[questionId] = 'a'; // default
        }
        
        questionIdToNumber[questionId] = questionNumber;
        
        // Build question object
        questions.push({
          id: row.id,
          question_text: row.question_text,
          option_a: row.option_a,
          option_b: row.option_b,
          option_c: row.option_c,
          option_d: row.option_d,
          difficulty: row.difficulty,  // This is difficulty_id (1, 2, or 3)
          source: row.source,          // This is source_name
          topic: row.topic             // This is subtopic_code(s)
        });
      });
      
      res.json({
        difficulty,
        sources,
        topics,
        num_questions: data.length,
        questions,
        correct_answers: correctAnswers,
        question_id_to_number: questionIdToNumber
      });
      
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Answer key endpoint
app.get('/answer-key', authenticateAPI, async (req, res) => {
  try {
    let { difficulty, sources, topics, num_questions } = req.query;

    const numQuestions = parseInt(num_questions) || 5;
    if (numQuestions < 1 || numQuestions > 50) {
      return res.status(400).json({ error: 'Invalid number of questions (1-50)' });
    }

    difficulty = difficulty || '1,2,3';
    sources = sources || 'College Board';
    topics = topics || '1.1,1.3';

    const connection = await pool.getConnection();
    
    try {
      const [results] = await connection.query(
        'CALL GetRandomQuestions(?, ?, ?, ?)',
        [difficulty, sources, topics, numQuestions]
      );
      
      const data = results[0] || [];
      
      if (data.length === 0) {
        return res.json({
          message: 'No questions found with the selected criteria',
          answer_key: []
        });
      }
      
      const answerKey = data.map((row, index) => ({
        question_number: index + 1,
        question_id: row.id,
        question_text: row.question_text,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        correct_answer: row.correct_answer,
        difficulty: row.difficulty,
        source: row.source,
        topic: row.topic
      }));
      
      res.json({
        difficulty,
        sources,
        topics,
        num_questions: data.length,
        answer_key: answerKey
      });
      
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generic query endpoint
app.post('/api/query', authenticateAPI, async (req, res) => {
  try {
    const { query, params } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const connection = await pool.getConnection();
    
    try {
      const [results] = await connection.query(query, params || []);
      res.json(results);
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Database Proxy API running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.MYSQLDATABASE || 'Not configured'}`);
  console.log(`\n📚 Available Endpoints:`);
  console.log(`   GET  /health               - Health check (no auth)`);
  console.log(`   GET  /api/questions/random - Random questions`);
  console.log(`   GET  /quiz                 - Quiz format`);
  console.log(`   GET  /answer-key           - Answer key`);
  console.log(`   POST /api/query            - Custom queries`);
  console.log(`\n💡 Parameter Info:`);
  console.log(`   difficulty: 1 (Easy), 2 (Medium), 3 (Hard) - comma-separated`);
  console.log(`   sources: 'College Board', 'Textbook', etc.`);
  console.log(`   topics: subtopic codes like '1.1,1.3,2.5'`);
});

// shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await pool.end();
  process.exit(0);
});