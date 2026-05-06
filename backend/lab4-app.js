const express = require('express');
const morgan = require('morgan');
const winston = require('winston');
const multer = require('multer');
const path = require('path');

// ====================== Ініціалізація ======================
const app = express();
const PORT = 4000;

app.use(morgan('combined'));

// ====================== Winston logger ======================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

logger.info('Lab 4 server started successfully');

// ====================== Multer file upload ======================
// Кастомне налаштування збереження
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// Завантаження ОДНОГО файлу
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Файл не завантажено' });
  }
  
  logger.info(`File uploaded: ${req.file.filename}`);
  
  res.json({
    message: 'Файл успішно завантажено',
    file: req.file
  });
});

// Завантаження КІЛЬКОХ файлів
app.post('/upload-multiple', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Файли не завантажено' });
  }
  
  logger.info(`Uploaded ${req.files.length} files`);
  
  res.json({
    message: `Успішно завантажено ${req.files.length} файлів`,
    files: req.files
  });
});

// ====================== Error handling ======================
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message} | Path: ${req.path}`);
  res.status(500).json({ success: false, message: 'Внутрішня помилка сервера' });
});

app.get('/', (req, res) => {
  res.send('Lab 4 server is running on port 4000<br>Try /upload and /upload-multiple');
});

app.get('/error', (req, res, next) => {
  next(new Error('Test error'));
});

app.listen(PORT, () => {
  console.log(`Lab 4 server started on http://localhost:${PORT}`);
});