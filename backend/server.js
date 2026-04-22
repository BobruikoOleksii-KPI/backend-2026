const express = require('express');
const sequelize = require('./config/database');
const mysqlPool = require('./config/database-mysql2');

const User = require('./models/User');
const Post = require('./models/Post');

// ====================== LAB 3 AUTH ======================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// =======================================================

const app = express();
app.use(express.json());

// ====================== LAB 3: REGISTRATION & AUTHORIZATION ======================

const SECRET_KEY = "secret123";        // In production → process.env.JWT_SECRET

// Реєстрація користувача (Task 11 — Sequelize)
app.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Всі поля обов'язкові" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Пароль мінімум 6 символів" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Паролі не співпадають" });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "Користувач вже існує" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ 
      email, 
      password: hashedPassword,
      role: "user" 
    });

    res.status(201).json({ message: "Користувача створено" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ 
      message: "Помилка сервера", 
      error: error.message 
    });
  }
});

// Авторизація (логін)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Користувача не знайдено" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Невірний пароль" });
    }

    const token = jwt.sign({ 
      email: user.email, 
      role: user.role 
    }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// Захищений маршрут (профіль)
app.get("/profile", (req, res) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Немає токена" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ 
      message: "Доступ дозволено", 
      user: decoded 
    });
  } catch (error) {
    res.status(401).json({ message: "Невірний токен" });
  }
});

// ====================== TASK 9: Logout ======================
app.post("/logout", (req, res) => {
  res.json({ message: "Вихід виконано успішно. Видаліть токен на клієнті." });
});

// ====================== TASK 10: Оновлення профілю ======================
app.put("/profile", async (req, res) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Немає токена" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { email } = decoded;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    const { newEmail } = req.body;

    if (newEmail && newEmail !== email) {
      const emailExists = await User.findOne({ where: { email: newEmail } });
      if (emailExists) {
        return res.status(400).json({ message: "Цей email вже використовується" });
      }
      await user.update({ email: newEmail });
    }

    res.json({ 
      message: "Профіль оновлено успішно",
      user: { email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(401).json({ message: "Невірний токен" });
  }
});

// ====================== END LAB 3 AUTH ======================

const PORT = 3000;

// ====================== DATABASE SYNC ======================
sequelize.sync({ force: true })
    .then(() => console.log('Sequelize tables synced successfully'))
    .catch(err => console.error('Sequelize sync error:', err));

// ====================== BASIC ROUTE ======================
app.get('/', (req, res) => {
    res.json({ 
        message: 'FilmHub Backend is running (Sequelize + raw mysql2)' 
    });
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

// ====================== RAW mysql2 QUERIES ======================
app.get('/raw/posts', async (req, res) => {
    try {
        const [rows] = await mysqlPool.execute('SELECT * FROM posts ORDER BY createdAt DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/raw/posts', async (req, res) => {
    const { title, content } = req.body;
    try {
        const [result] = await mysqlPool.execute(
            'INSERT INTO posts (title, content) VALUES (?, ?)',
            [title, content]
        );
        res.status(201).json({ id: result.insertId, title, content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/raw/posts/:id', async (req, res) => {
    const { title, content } = req.body;
    try {
        await mysqlPool.execute(
            'UPDATE posts SET title = ?, content = ? WHERE id = ?',
            [title, content, req.params.id]
        );
        res.json({ message: "Post updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/raw/posts/:id', async (req, res) => {
    try {
        await mysqlPool.execute('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================== SEQUELIZE CRUD ======================
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
    console.log(`FilmHub Backend running on http://localhost:${PORT}`);
});