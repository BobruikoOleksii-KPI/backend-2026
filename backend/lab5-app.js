const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const NodeCache = require('node-cache');
const compression = require('compression');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(helmet());
app.use(compression({ threshold: 0 }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10
});
app.use(limiter);

// Caching
const cache = new NodeCache({ stdTTL: 60 });

// Sample films data
let films = [
  { id: 1, title: "Inception", director: "Christopher Nolan", year: 2010, rating: 8.8 },
  { id: 2, title: "The Matrix", director: "Wachowski Sisters", year: 1999, rating: 8.7 },
  { id: 3, title: "Interstellar", director: "Christopher Nolan", year: 2014, rating: 8.6 }
];

// ====================== Optimized GET /films with pagination & cache ======================
app.get('/films', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Create cache key based on query params
  const cacheKey = `films-page-${page}-limit-${limit}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ source: 'cache', page, limit, data: cached });
  }

  const paginatedFilms = films.slice(startIndex, endIndex);

  cache.set(cacheKey, paginatedFilms);

  res.json({
    source: 'database',
    page,
    limit,
    total: films.length,
    data: paginatedFilms
  });
});

// POST new film with validation
app.post('/films',
  body('title').trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('director').trim().isLength({ min: 2 }).withMessage('Director must be at least 2 characters'),
  body('year').optional().isInt({ min: 1888, max: new Date().getFullYear() }),
  body('rating').optional().isFloat({ min: 0, max: 10 }),

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, director, year, rating } = req.body;

    const newFilm = {
      id: films.length + 1,
      title,
      director,
      year: year || new Date().getFullYear(),
      rating: rating || 0
    };

    films.push(newFilm);
    cache.flushAll();   // Invalidate all cache on new film

    res.status(201).json(newFilm);
  }
);

app.get('/', (req, res) => {
  res.send('Lab 5 server is running on port 5000');
});

app.listen(PORT, () => {
  console.log(`Lab 5 server started on http://localhost:${PORT}`);
});