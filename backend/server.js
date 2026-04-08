const express = require('express');
const db = require('./config/database');

const app = express();
app.use(express.json());

const PORT = 3000;

app.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT 1 as test');
        res.json({ message: 'Connection successful', dbTest: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/posts', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM posts');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/posts', async (req, res) => {
    const { title, content } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO posts (title, content) VALUES (?, ?)',
            [title, content]
        );
        res.status(201).json({ id: result.insertId, title, content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});