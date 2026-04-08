Адаптивний веб-застосунок **FilmHub** — онлайн-каталог фільмів.

Репозиторій для лабораторних робіт з дисципліни «Web-орієнтовані технології. Backend-розробки».

## Структура проєкту
backend-2026/
├── frontend/                 ← Лабораторна №1 (адаптивний фронтенд)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── backend/                  ← Лабораторна №2 (Node.js + Sequelize)
│   ├── config/
│   ├── models/
│   ├── server.js
│   └── package.json
├── backend_lr1.html
├── backend_lr2.html
├── screenshots/
└── README.md

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
Bashcd backend
npm install
node server.js

Сервер буде доступний за адресою: http://localhost:3000

### Технології
- Frontend: HTML5, CSS3 (Flexbox + Grid), JavaScript
- Backend: Node.js, Express.js, Sequelize ORM, MySQL
- Інструменти: Git, Conventional Commits, MySQL Workbench