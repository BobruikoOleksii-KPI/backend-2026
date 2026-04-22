const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'web_backend_lab',
    'root',
    '',
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

module.exports = sequelize;

console.log('Sequelize connected to MySQL');