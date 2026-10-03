Use the front end and worker code to open the cloudflare website. 

db-proxy folder can be uploaded to github as a private repository.

open a mysql database in railway and use the github repo to host the nodejs server in railway.

Connect the nodejs server with mysql database.

you can connect the mysql database hosted in railway to your mysql workbench application but public networking needs to be opened for the database.

The nodejs server will interact with cloudflare worker.

The changes that made in the frontend will go to cloudflare worker, and cloudflare worker will interact with the nodejs server to process the query and fetch the questions from the database. 
