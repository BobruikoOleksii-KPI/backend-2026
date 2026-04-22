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

const SECRET_KEY = "secret123";

// ====================== Auth Middleware ======================
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Немає токена" });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Невірний токен" });
  }
};

// ====================== Login attempts limiter ======================
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 5 * 60 * 1000;

// ====================== Token storages ======================
const refreshTokens = {};
const resetTokens = {};
const verificationTokens = {};

// ====================== Google OAuth ======================
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: '',
    clientSecret: '',
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ where: { email: profile.emails[0].value } });
      if (!user) {
        user = await User.create({
          email: profile.emails[0].value,
          password: await bcrypt.hash(Math.random().toString(36), 10), // random password
          role: "user",
          isVerified: true,
          name: profile.displayName
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Google login route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback
app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const token = jwt.sign({ 
      email: req.user.email, 
      role: req.user.role 
    }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ 
      message: "Успішний вхід через Google",
      token,
      user: req.user
    });
  }
);

// Реєстрація користувача + email verification
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

    const user = await User.create({ 
      email, 
      password: hashedPassword,
      role: "user",
      isVerified: false
    });

    // Генеруємо токен для підтвердження email
    const verificationToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "24h" });
    verificationTokens[verificationToken] = email;

    console.log(`[EMAIL VERIFICATION] Token for ${email}: ${verificationToken}`);

    res.status(201).json({ 
      message: "Користувача створено. Перевірте email для підтвердження (токен виведено в консоль сервера)",
      verificationToken   // для тестування в лабораторній
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

// ====================== Verify email ======================
app.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token || !verificationTokens[token]) {
    return res.status(400).json({ message: "Невірний або прострочений токен підтвердження" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const email = decoded.email;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

    await user.update({ isVerified: true });
    delete verificationTokens[token];

    res.json({ message: "Email успішно підтверджено" });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(400).json({ message: "Невірний токен" });
  }
});

// Авторизація (логін) — з обмеженням спроб
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const attempts = loginAttempts[email] || { count: 0, lastAttempt: 0 };
    const now = Date.now();

    if (attempts.count >= MAX_ATTEMPTS && (now - attempts.lastAttempt) < BLOCK_TIME_MS) {
      return res.status(429).json({ 
        message: `Забагато невдалих спроб. Спробуйте пізніше (${Math.ceil((BLOCK_TIME_MS - (now - attempts.lastAttempt)) / 60000)} хв)` 
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      loginAttempts[email] = { count: attempts.count + 1, lastAttempt: now };
      return res.status(400).json({ message: "Користувача не знайдено" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      loginAttempts[email] = { count: attempts.count + 1, lastAttempt: now };
      return res.status(400).json({ message: "Невірний пароль" });
    }

    delete loginAttempts[email];

    const accessToken = jwt.sign({ email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "7d" });

    refreshTokens[refreshToken] = user.email;

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// Refresh token
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens[refreshToken]) {
    return res.status(401).json({ message: "Невірний або прострочений refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, SECRET_KEY);
    const newAccessToken = jwt.sign({ email: decoded.email }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    delete refreshTokens[refreshToken];
    res.status(401).json({ message: "Невірний refresh token" });
  }
});

// Захищений маршрут (профіль)
app.get("/profile", authenticateToken, (req, res) => {
  res.json({ message: "Доступ дозволено", user: req.user });
});

// ====================== Logout ======================
app.post("/logout", (req, res) => {
  res.json({ message: "Вихід виконано успішно. Видаліть токен на клієнті." });
});

// ====================== Оновлення профілю ======================
app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

    const { newEmail } = req.body;
    if (newEmail && newEmail !== email) {
      const emailExists = await User.findOne({ where: { email: newEmail } });
      if (emailExists) return res.status(400).json({ message: "Цей email вже використовується" });
      await user.update({ email: newEmail });
    }

    res.json({ message: "Профіль оновлено успішно", user: { email: user.email, role: user.role } });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// ====================== Зміна пароля ======================
app.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { email } = req.user;
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "Всі поля обов'язкові" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Новий пароль мінімум 6 символів" });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Нові паролі не співпадають" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Невірний старий пароль" });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedNewPassword });

    res.json({ message: "Пароль успішно змінено" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// ====================== Видалення користувача ======================
app.delete("/profile", authenticateToken, async (req, res) => {
  try {
    const { email } = req.user;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    await user.destroy();
    Object.keys(refreshTokens).forEach(key => {
      if (refreshTokens[key] === email) delete refreshTokens[key];
    });

    res.json({ message: "Користувача успішно видалено" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// ====================== Відновлення пароля ======================
// Forgot password (генеруємо reset-токен)
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email обов'язковий" });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    // Генеруємо простий reset-токен (для лабораторної роботи)
    const resetToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "15m" });
    resetTokens[resetToken] = email;

    console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`); // debugging

    res.json({ 
      message: "Reset token згенеровано (для тестування)",
      resetToken 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// Reset password
app.put("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword, confirmNewPassword } = req.body;

    if (!resetToken || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "Всі поля обов'язкові" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Новий пароль мінімум 6 символів" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Нові паролі не співпадають" });
    }

    if (!resetTokens[resetToken]) {
      return res.status(401).json({ message: "Невірний або прострочений reset token" });
    }

    const decoded = jwt.verify(resetToken, SECRET_KEY);
    const email = decoded.email;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedNewPassword });

    delete resetTokens[resetToken]; // cleanup

    res.json({ message: "Пароль успішно замінено" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Помилка сервера" });
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