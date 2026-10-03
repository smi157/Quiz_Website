Use the front end and worker code to open the cloudflare website. 

db-proxy folder can be uploaded the github as a private repository.

connect the database to railway and use the github repo to host the nodejs server in railway.

The nodejs server will interact with cloudflare worker.

The changes that made in the frontend will go to cloudflare worker, and cloudflare worker will interact with the nodejs server to process the query and fetch the questions from the database. 
