const express = require('express');
const morgan = require('morgan');
const winston = require('winston');

// ====================== Ініціалізація ======================
const app = express();
const PORT = 4000;

// ====================== Morgan (HTTP logging) ======================
app.use(morgan('combined'));

// ====================== Winston — файлове логування ======================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    // Логи в файл
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
    // Логи в консоль (для розробки)
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

logger.info('Lab 4 server started successfully');

// ====================== Error handling middleware ======================
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message} | Path: ${req.path} | Method: ${req.method}`);
  
  res.status(500).json({
    success: false,
    message: 'Внутрішня помилка сервера',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Базовий маршрут
app.get('/', (req, res) => {
  res.send('Lab 4 server is running on port 4000<br>Check app.log, error.log and combined.log');
});

// Приклад маршруту з помилкою (для тестування Task 4)
app.get('/error', (req, res, next) => {
  const error = new Error('Тестова помилка для перевірки логування');
  next(error);
});

app.listen(PORT, () => {
  console.log(`Lab 4 server started on http://localhost:${PORT}`);
});