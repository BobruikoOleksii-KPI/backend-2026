const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'PzKpfwB2740(f)',
    database: 'web_backend_lab',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;

console.log('MySQL connection pool created successfully');