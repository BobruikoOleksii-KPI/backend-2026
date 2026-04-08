const express = require('express');
const sequelize = require('./config/database');
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
app.use(express.json());

const PORT = 3000;

sequelize.sync({ force: false })
    .then(() => console.log('Database tables synced successfully'))
    .catch(err => console.error('Sync error:', err));

app.get('/', (req, res) => {
    res.json({ message: 'FilmHub Backend is running with Sequelize + One-to-Many relationship!' });
});

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

        res.json({ message: "Test user and post created successfully", user, post });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});