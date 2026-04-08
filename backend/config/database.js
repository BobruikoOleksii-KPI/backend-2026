const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'web_backend_lab',
    'root',
    'PzKpfwB2740(f)',
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

module.exports = sequelize;

console.log('Sequelize connected to MySQL');