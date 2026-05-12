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

const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 10 });
app.use(limiter);

const cache = new NodeCache({ stdTTL: 60 });

let films = [
  { id: 1, title: "Inception", director: "Christopher Nolan", year: 2010, rating: 8.8 },
  { id: 2, title: "The Matrix", director: "Wachowski Sisters", year: 1999, rating: 8.7 },
  { id: 3, title: "Interstellar", director: "Christopher Nolan", year: 2014, rating: 8.6 }
];

// GET all films with pagination + cache
app.get('/films', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const cacheKey = `films-page-${page}-limit-${limit}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ source: 'cache', page, limit, data: cached });
  }

  const startIndex = (page - 1) * limit;
  const paginated = films.slice(startIndex, startIndex + limit);

  cache.set(cacheKey, paginated);

  res.json({ source: 'database', page, limit, total: films.length, data: paginated });
});

// POST new film
app.post('/films', 
  body('title').trim().isLength({ min: 2 }),
  body('director').trim().isLength({ min: 2 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const newFilm = {
      id: films.length + 1,
      ...req.body
    };
    films.push(newFilm);
    cache.flushAll();   // invalidate cache
    res.status(201).json(newFilm);
  }
);

// ====================== Performance analysis ======================
app.get('/performance-test', (req, res) => {
  const iterations = 1000;
  const results = { withoutCache: [], withCache: [] };

  // WITHOUT CACHE
  cache.flushAll();
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    
    // Heavy simulation of database query + data processing
    let processed = films.map(film => {
      let copy = { ...film };
      for (let j = 0; j < 100; j++) {
        copy.computed = (copy.rating * 1.1).toFixed(2);
      }
      return copy;
    });
    
    const end = process.hrtime.bigint();
    results.withoutCache.push(Number(end - start) / 1_000_000);
  }

  // WITH CACHE
  cache.set('films-performance', films);
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    const cached = cache.get('films-performance');
    const end = process.hrtime.bigint();
    results.withCache.push(Number(end - start) / 1_000_000);
  }

  const avgWithout = results.withoutCache.reduce((a, b) => a + b, 0) / iterations;
  const avgWith = results.withCache.reduce((a, b) => a + b, 0) / iterations;

  res.json({
    message: `Performance comparison (${iterations} iterations each)`,
    averageTimeWithoutCache: `${avgWithout.toFixed(3)} ms`,
    averageTimeWithCache: `${avgWith.toFixed(3)} ms`,
    improvement: `${((avgWithout - avgWith) / avgWithout * 100).toFixed(1)}% faster with cache`
  });
});

app.get('/', (req, res) => {
  res.send('Lab 5 server is running on port 5000 - FilmHub API');
});

app.listen(PORT, () => {
  console.log(`Lab 5 server started on http://localhost:${PORT}`);
});

module.exports = app;