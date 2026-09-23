// db.js
// This file creates ONE connection pool to MySQL that every route file re-uses.

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',          // change this to your MySQL username
    password: '',           // change this to your MySQL password
    database: 'krishimart',
    waitForConnections: true,
    connectionLimit: 10
});

// .promise() lets us use async/await instead of callbacks - simpler to read
module.exports = pool.promise();
