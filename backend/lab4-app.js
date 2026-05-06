const express = require('express');
const morgan = require('morgan');
const winston = require('winston');

// Ініціалізація Express
const app = express();
const PORT = 4000;   // Використовуємо 4000, щоб не конфліктувати з основним сервером

// ====================== TASK 2: Логування HTTP-запитів (Morgan) ======================
app.use(morgan('combined'));   // "combined" — детальний формат (метод, шлях, статус, час)

// ====================== Winston logger (будемо використовувати далі) ======================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'app.log' }),
    new winston.transports.Console()
  ]
});

logger.info('Lab 4 server started');

// Базовий маршрут
app.get('/', (req, res) => {
  res.send('Lab 4 server is running on port 4000');
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Lab 4 server started on http://localhost:${PORT}`);
});