const express = require('express');
const sequelize = require('./config/database');
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
app.use(express.json());

const PORT = 3000;

// Sync models
sequelize.sync({ force: false })
    .then(() => console.log('Database tables synced successfully'))
    .catch(err => console.error('Error syncing tables:', err));

app.get('/', (req, res) => {
    res.json({ message: 'FilmHub Backend is running with Sequelize!' });
});

// ====================== TEST ROUTE ======================
app.get('/test', async (req, res) => {
    try {
        const user = await User.create({
            name: "Іван Петренко",
            email: `ivan_${Date.now()}@example.com`
        });

        const post = await Post.create({
            title: "Мій перший пост",
            content: "Це тестовий пост створений через Sequelize",
            userId: user.id
        });

        res.json({ 
            message: "Test user and post created successfully",
            user,
            post
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================== CRUD for Posts ======================

app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.findAll({
            include: User,
            order: [['createdAt', 'DESC']]
        });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id, { include: User });
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/posts', async (req, res) => {
    try {
        const post = await Post.create(req.body);
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        await post.update(req.body);
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        await post.destroy();
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});