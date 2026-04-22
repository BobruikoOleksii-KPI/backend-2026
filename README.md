Адаптивний веб-застосунок **FilmHub** — онлайн-каталог фільмів.

Репозиторій для лабораторних робіт з дисципліни «Web-орієнтовані технології. Backend-розробки».

## Як запустити

### 1. Frontend (Lab 1)
Перейдіть у папку `frontend` і запустіть одним із способів:

**Через Live Server (рекомендовано):**
- Відкрийте `frontend` у VS Code
- Клікніть правою кнопкою на `index.html` → **Open with Live Server**

**Через термінал:**
`cd frontend`
`npx serve`

### 2. Backend (Lab 2 + Lab 3)

- `cd backend`
- `npm install`

**Запуск MySQL сервера:**
1. Відкрийте **PowerShell** (або Command Prompt).
2. Перейдіть у папку MySQL:
`cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"`
3. Запустіть сервер (залиште це вікно відкритим):
`.\mysqld --console` (Ви побачите [Server] ready for connections)
4. Створіть базу даних (відкрийте ще один термінал):
`.\mysql -u root -p` (натисність Enter, або введіть пароль якщо він є)
Після промпту `mysql>` введіть:
`CREATE DATABASE web_backend_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
Після цього введіть `EXIT;` і закрийте вікно.

Запуск Node.js сервера:
У новому терміналі:
`cd C:\Users\...\backend2026\backend`
`node server.js`
Сервер буде доступний за адресою: http://localhost:3000
Примітка: Користувач root має порожній пароль (створено через --initialize-insecure).

### Технології
- Frontend: HTML5, CSS3 (Flexbox + Grid), JavaScript
- Backend: Node.js, Express.js, Sequelize ORM, MySQL
- Інструменти: Git, Conventional Commits, MySQL Workbench