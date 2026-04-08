Адаптивний веб-застосунок **FilmHub** — онлайн-каталог фільмів.

Репозиторій для лабораторних робіт з дисципліни «Web-орієнтовані технології. Backend-розробки».

## Як запустити

### 1. Frontend (Lab 1)
Перейдіть у папку `frontend` і запустіть одним із способів:

**Через Live Server (рекомендовано):**
- Відкрийте `frontend` у VS Code
- Клікніть правою кнопкою на `index.html` → **Open with Live Server**

**Через термінал:**
cd frontend
npx serve

### 2. Backend (Lab 2)
cd backend
npm install
У MySQL Workbench вручну створити пусту базу даних:
    CREATE DATABASE web_backend_lab 
        CHARACTER SET utf8mb4 
        COLLATE utf8mb4_unicode_ci;
node server.js

Сервер буде доступний за адресою: http://localhost:3000

### Технології
- Frontend: HTML5, CSS3 (Flexbox + Grid), JavaScript
- Backend: Node.js, Express.js, Sequelize ORM, MySQL
- Інструменти: Git, Conventional Commits, MySQL Workbench