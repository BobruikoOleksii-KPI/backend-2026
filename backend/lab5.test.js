const request = require('supertest');
const app = require('./lab5-app');

describe('FilmHub API Tests', () => {
  test('GET / should return server status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Lab 5 server is running');
  });

  test('GET /films should return list of films', async () => {
    const res = await request(app).get('/films');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  test('POST /films should create a new film', async () => {
    const newFilm = {
      title: "Oppenheimer",
      director: "Christopher Nolan",
      year: 2023,
      rating: 8.5
    };

    const res = await request(app)
      .post('/films')
      .send(newFilm);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Oppenheimer');
  });
});