const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const NodeCache = require('node-cache');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 5000;
const SECRET_KEY = '!@#xK9pL2mQ7vR8tY3wZ';

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

let users = [];

// ====================== Swagger Configuration ======================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FilmHub Lab 5 API',
      version: '1.0.0',
      description: 'FilmHub API with security, caching, validation and performance features',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./lab5-app.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ====================== JWT Middleware ======================
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Access token required' });

  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, SECRET_KEY);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// ====================== REGISTER ======================
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: "test@example.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation error or user already exists }
 */
app.post('/register', 
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: users.length + 1, email, password: hashedPassword };
    users.push(user);

    res.status(201).json({ message: 'User registered successfully' });
  }
);

// ====================== LOGIN ======================
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: "test@example.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Returns JWT token }
 *       401: { description: Invalid credentials }
 */
app.post('/login', 
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  }
);

// ====================== Protected routes ======================
/**
 * @swagger
 * /films:
 *   get:
 *     summary: Get list of films (paginated)
 *     tags: [Films]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *     responses:
 *       200: { description: List of films }
 *       401: { description: Unauthorized }
 */
app.get('/films', authenticateJWT, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const cacheKey = `films-page-${page}-limit-${limit}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json({ source: 'cache', page, limit, data: cached });

  const startIndex = (page - 1) * limit;
  const paginated = films.slice(startIndex, startIndex + limit);

  cache.set(cacheKey, paginated);

  res.json({ source: 'database', page, limit, total: films.length, data: paginated });
});

/**
 * @swagger
 * /films:
 *   post:
 *     summary: Create a new film (protected)
 *     tags: [Films]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: "Dune: Part Two" }
 *               director: { type: string, example: "Denis Villeneuve" }
 *               year: { type: integer, example: 2024 }
 *               rating: { type: number, example: 8.9 }
 *     responses:
 *       201: { description: Film created }
 *       401: { description: Unauthorized }
 */
app.post('/films', authenticateJWT,
  body('title').trim().isLength({ min: 2 }),
  body('director').trim().isLength({ min: 2 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const newFilm = { id: films.length + 1, ...req.body };
    films.push(newFilm);
    cache.flushAll();
    res.status(201).json(newFilm);
  }
);

/**
 * @swagger
 * /performance-test:
 *   get:
 *     summary: Performance comparison (with and without cache)
 *     tags: [Performance]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Performance metrics }
 *       401: { description: Unauthorized }
 */
app.get('/performance-test', authenticateJWT, (req, res) => {
  const iterations = 1000;
  const results = { withoutCache: [], withCache: [] };

  cache.flushAll();
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    let processed = films.map(film => {
      let copy = { ...film };
      for (let j = 0; j < 100; j++) copy.computed = (copy.rating * 1.1).toFixed(2);
      return copy;
    });
    const end = process.hrtime.bigint();
    results.withoutCache.push(Number(end - start) / 1_000_000);
  }

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
  res.send('Lab 5 server is running on port 5000');
});

app.listen(PORT, () => {
  console.log(`Lab 5 server started on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});

module.exports = app;