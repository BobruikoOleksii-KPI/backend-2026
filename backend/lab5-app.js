const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10
});
app.use(limiter);

// Sample films data
let films = [
  { id: 1, title: "Inception", director: "Christopher Nolan", year: 2010, rating: 8.8 },
  { id: 2, title: "The Matrix", director: "Wachowski Sisters", year: 1999, rating: 8.7 },
  { id: 3, title: "Interstellar", director: "Christopher Nolan", year: 2014, rating: 8.6 }
];

// ====================== Basic routes ======================
app.get('/', (req, res) => {
  res.send('Lab 5 server is running on port 5000');
});

// GET all films
app.get('/films', (req, res) => {
  res.json(films);
});

// POST new film
app.post('/films', (req, res) => {
  const { title, director, year, rating } = req.body;
  
  if (!title || !director) {
    return res.status(400).json({ message: 'Title and director are required' });
  }

  const newFilm = {
    id: films.length + 1,
    title,
    director,
    year: year || new Date().getFullYear(),
    rating: rating || 0
  };

  films.push(newFilm);
  res.status(201).json(newFilm);
});

app.listen(PORT, () => {
  console.log(`Lab 5 server started on http://localhost:${PORT}`);
});