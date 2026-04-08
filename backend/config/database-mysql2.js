const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'PzKpfwB2740(f)',
    database: 'web_backend_lab'
});

module.exports = pool;