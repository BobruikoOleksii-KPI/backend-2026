console.log('script.js loaded successfully');

// ==================== MOBILE BURGER MENU ====================
const burger = document.getElementById('burger');
const navMenu = document.querySelector('.nav-menu');

if (burger) {
    burger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        burger.classList.toggle('active');
    });
}

// ==================== POSTER MAPPING ====================
const posterMap = {
    "Inception": "inception.jpg",
    "Dune": "dune.jpg",
    "Dune: Part Two": "dune.jpg",
    "Oppenheimer": "oppenheimer.jpg",
    "The Batman": "batman.jpg",
    "Interstellar": "interstellar.jpg",
    "The Matrix": "matrix.jpg",
    "Parasite": "parasite.jpg",
    "Joker": "joker.jpg"
};

// ==================== AUTHENTICATION SYSTEM ====================
let currentToken = localStorage.getItem('token');

function updateAuthUI() {
    const authContainer = document.getElementById('auth-links');
    const createBtn = document.getElementById('create-post-btn');
    
    if (currentToken) {
        authContainer.innerHTML = `
            <a href="#" onclick="showProfile()" style="color:#00d4ff;">Профіль</a>
            <a href="#" onclick="logout()" style="margin-left:15px; color:#e50914;">Вийти</a>
        `;
        if (createBtn) createBtn.style.display = 'inline-block';
    } else {
        authContainer.innerHTML = `
            <a href="#" onclick="showLoginModal()">Увійти</a>
            <a href="#" onclick="showRegisterModal()" style="margin-left:15px;">Реєстрація</a>
        `;
        if (createBtn) createBtn.style.display = 'none';
    }
}

// ==================== AUTH MODAL FUNCTIONS ====================
function showLoginModal() {
    closeModal();
    document.getElementById('modal-title').textContent = 'Увійти';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('auth-modal').style.display = 'flex';
}

function showRegisterModal() {
    closeModal();
    document.getElementById('modal-title').textContent = 'Реєстрація';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('auth-modal').style.display = 'flex';
}

function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const title = document.getElementById('modal-title');

    if (loginForm.style.display !== 'none') {
        title.textContent = 'Реєстрація';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    } else {
        title.textContent = 'Увійти';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
}

function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        alert('Введіть email та пароль');
        return;
    }

    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.accessToken || data.token);
            currentToken = data.accessToken || data.token;
            closeModal();
            updateAuthUI();
            alert('Успішний вхід!');
            loadMovies(); // refresh if needed
        } else {
            alert(data.message || 'Невірні дані для входу');
        }
    } catch (err) {
        alert('Помилка з\'єднання з сервером');
    }
}

async function handleRegister() {
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const confirmPassword = document.getElementById('register-confirm').value.trim();

    if (!email || !password || !confirmPassword) {
        alert('Заповніть всі поля');
        return;
    }
    if (password !== confirmPassword) {
        alert('Паролі не співпадають');
        return;
    }

    try {
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, confirmPassword })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Реєстрація успішна! Тепер увійдіть в акаунт.');
            closeModal();
            showLoginModal();
        } else {
            alert(data.message || 'Помилка реєстрації');
        }
    } catch (err) {
        alert('Помилка з\'єднання з сервером');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentToken = null;
    updateAuthUI();
    alert('Ви вийшли з акаунту');
}

// ==================== PROFILE PAGE (favorites fixed) ====================
async function showProfile() {
    if (!currentToken) {
        alert("Увійдіть в акаунт");
        return;
    }

    const modal = document.getElementById('profile-modal');
    const infoDiv = document.getElementById('profile-info');
    const favDiv = document.getElementById('profile-favorites');

    infoDiv.innerHTML = `<p>Завантаження профілю...</p>`;
    favDiv.innerHTML = '';

    try {
        const res = await fetch('/profile', {
            headers: { 
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        const user = data.user || data;

        // Profile info
        let expiresText = '—';
        if (user.exp) {
            const expDate = new Date(user.exp * 1000);
            expiresText = expDate.toLocaleString('uk-UA');
        }

        infoDiv.innerHTML = `
            <p><strong>Email:</strong> ${user.email || '—'}</p>
            <p><strong>Роль:</strong> ${user.role || 'user'}</p>
            <p><strong>Сесія закінчується:</strong> ${expiresText}</p>
        `;

        // === FAVORITES SECTION (fixed with type-safe comparison) ===
        const favIds = getFavorites(); // already strings
        const allPostsRes = await fetch('/posts');
        const allPosts = await allPostsRes.json();

        const userFavorites = allPosts.filter(post => 
            favIds.includes(String(post.id))
        );

        console.log('Favorites found in profile:', userFavorites.length, userFavorites);

        if (userFavorites.length > 0) {
            favDiv.innerHTML = userFavorites.map(post => `
                <div onclick="viewPost(${post.id}); closeProfileModal()" 
                     style="cursor:pointer; text-align:center; background:#222; padding:8px; border-radius:8px;">
                    <img src="assets/images/${posterMap[post.title] || post.image || 'inception.jpg'}" 
                         style="width:100%; height:160px; object-fit:cover; border-radius:6px;" alt="${post.title}">
                    <p style="margin:8px 0 4px; font-size:0.95rem;">${post.title}</p>
                </div>
            `).join('');
        } else {
            favDiv.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#888; padding:40px 20px;">У вас ще немає улюблених фільмів</p>`;
        }

        modal.style.display = 'flex';

    } catch (err) {
        console.error('Profile error:', err);
        infoDiv.innerHTML = `<p style="color:#e50914;">Не вдалося завантажити профіль</p>`;
        modal.style.display = 'flex';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
}

function viewPost(id) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeProfileModal();
}

// ==================== CREATE POST MODAL ====================
function showCreatePostModal() {
    if (!currentToken) {
        alert("Увійдіть в акаунт, щоб додати пост");
        return;
    }
    document.getElementById('create-post-modal').style.display = 'flex';
}

function closeCreatePostModal() {
    document.getElementById('create-post-modal').style.display = 'none';
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
}

async function createPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const imageName = document.getElementById('post-image').value;

    if (!title) {
        alert("Назва фільму обов'язкова");
        return;
    }
    if (!imageName) {
        alert("Оберіть постер для фільму");
        return;
    }

    try {
        const res = await fetch('/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ 
                title, 
                content,
                image: imageName   // new field
            })
        });

        if (res.ok) {
            closeCreatePostModal();
            alert('Фільм успішно додано до каталогу!');
            loadMovies(); // refresh grid
        } else {
            const data = await res.json();
            alert(data.message || 'Помилка при створенні фільму');
        }
    } catch (err) {
        alert('Помилка з\'єднання з сервером');
    }
}

async function deletePost(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей фільм?')) return;

    try {
        const res = await fetch(`/posts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (res.ok) {
            alert('Фільм видалено');
            loadMovies(); // refresh the grid
        } else {
            alert('Не вдалося видалити фільм');
        }
    } catch (err) {
        alert('Помилка з\'єднання з сервером');
    }
}

// ==================== EDIT POST ====================
function editPost(id) {
    if (!currentToken) return;

    // Find the post in the current list (simple approach)
    const card = document.querySelector(`button[onclick="deletePost(${id})"]`).closest('.movie-card');
    const title = card.querySelector('h3').textContent;
    const content = card.querySelector('p').textContent;

    document.getElementById('edit-post-id').value = id;
    document.getElementById('edit-post-title').value = title;
    document.getElementById('edit-post-content').value = content === 'Опис відсутній' ? '' : content;

    document.getElementById('edit-post-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-post-modal').style.display = 'none';
}

async function saveEditedPost() {
    const id = document.getElementById('edit-post-id').value;
    const title = document.getElementById('edit-post-title').value.trim();
    const content = document.getElementById('edit-post-content').value.trim();

    if (!title) {
        alert("Назва фільму обов'язкова");
        return;
    }

    try {
        const res = await fetch(`/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ title, content })
        });

        if (res.ok) {
            closeEditModal();
            alert('Фільм успішно оновлено!');
            loadMovies();
        } else {
            alert('Не вдалося оновити фільм');
        }
    } catch (err) {
        alert('Помилка з\'єднання з сервером');
    }
}

// ==================== FAVORITES SYSTEM ====================
let currentFilter = 'all';

function getFavorites() {
    const favs = localStorage.getItem('favorites');
    console.log('Current favorites in localStorage:', favs);
    return favs ? JSON.parse(favs).map(id => String(id)) : [];
}

function saveFavorites(favs) {
    const stringFavs = favs.map(id => String(id));
    localStorage.setItem('favorites', JSON.stringify(stringFavs));
    console.log('Saved favorites:', stringFavs);
}

function toggleFavorite(id) {
    const stringId = String(id);
    let favs = getFavorites();

    if (favs.includes(stringId)) {
        favs = favs.filter(f => f !== stringId);
        console.log('Removed favorite:', stringId);
    } else {
        favs.push(stringId);
        console.log('Added favorite:', stringId);
    }

    saveFavorites(favs);
    loadMovies(); // refresh grid
}

// ==================== DYNAMIC MOVIE GRID ====================
async function loadMovies() {
    const grid = document.querySelector('.movie-grid');
    if (!grid) return;

    // Show loading spinner
    const spinner = document.getElementById('loading-spinner');
    const emptyState = document.getElementById('empty-state');
    if (spinner) spinner.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    try {
        const response = await fetch('/posts');
        const posts = await response.json();

        // Hide spinner
        if (spinner) spinner.style.display = 'none';

        // Clear the grid
        grid.innerHTML = '';

        // Apply current filter
        let filteredPosts = posts;
        if (currentFilter === 'favorites') {
            const favs = getFavorites();
            filteredPosts = posts.filter(post => favs.includes(post.id));
        }

        if (currentGenreFilter) {
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(currentGenreFilter.toLowerCase()) ||
                (post.content && post.content.toLowerCase().includes(currentGenreFilter.toLowerCase()))
            );
        }

        if (filteredPosts && filteredPosts.length > 0) {
            filteredPosts.forEach(post => {
                const imageName = posterMap[post.title] || post.image || 'inception.jpg';
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.innerHTML = `
                    <img src="assets/images/${imageName}" alt="${post.title}">
                    <h3>${post.title}</h3>
                    <p>${post.content ? post.content.substring(0, 80) + '...' : 'Опис відсутній'}</p>
                    <small>${new Date(post.createdAt).toLocaleDateString('uk-UA')}</small>
                    ${currentToken ? `
                        <button onclick="editPost(${post.id})" style="margin: 8px 14px 12px 14px; padding: 6px 12px; background: #00d4ff; color: black; border: none; border-radius: 4px; cursor: pointer;">Редагувати</button>
                        <button onclick="deletePost(${post.id})" style="margin: 8px 14px 12px; padding: 6px 12px; background: #e50914; color: white; border: none; border-radius: 4px; cursor: pointer;">Видалити</button>
                        <button onclick="toggleFavorite(${post.id})" style="margin: 8px 14px 12px; padding: 6px 12px; background: transparent; border: 2px solid #ff2d55; color: #ff2d55; border-radius: 4px; cursor: pointer;">
                           ${getFavorites().includes(String(post.id)) ? 'Видалити з улюблених' : 'Додати до улюблених'}
                        </button>
                    ` : ''}
                `;
                grid.appendChild(card);
            });
        } else {
            // Show empty state
            const emptyMsg = document.getElementById('empty-message');
            if (emptyMsg) {
                if (currentFilter === 'favorites') {
                    emptyMsg.textContent = 'У вас ще немає улюблених фільмів';
                } else {
                    emptyMsg.textContent = 'Немає фільмів у каталозі';
                }
            }
            if (emptyState) emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        if (spinner) spinner.style.display = 'none';
        grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #e50914; padding: 40px 20px;">
            Не вдалося підключитися до сервера
        </p>`;
    }
}

// ==================== SEARCH FUNCTIONALITY ====================
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.movie-card');

        cards.forEach(card => {
            const title = card.querySelector('h3');
            if (title) {
                if (title.textContent.toLowerCase().includes(term)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            }
        });
    });
}

// ==================== HEADER NAVIGATION (fully functional) ====================
let currentGenreFilter = null;

function navigateTo(section) {
    const grid = document.querySelector('.movie-grid');
    
    if (section === 'home' || section === 'catalog') {
        currentGenreFilter = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadMovies();
    } 
    else if (section === 'genres') {
        showGenresModal();
    } 
    else if (section === 'about') {
        showAboutModal();
    }
}

function showGenresModal() {
    const modalHTML = `
        <div id="genres-modal" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:3000; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; padding:2rem; border-radius:12px; max-width:700px; width:90%; color:#fff;">
                <h2 style="text-align:center; margin-bottom:1.5rem;">Оберіть жанр</h2>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:15px;">
                    <button onclick="filterByGenre('Sci-Fi')" style="padding:15px; background:#222; border:none; border-radius:8px; color:#fff; cursor:pointer;">Sci-Fi</button>
                    <button onclick="filterByGenre('Drama')" style="padding:15px; background:#222; border:none; border-radius:8px; color:#fff; cursor:pointer;">Drama</button>
                    <button onclick="filterByGenre('Action')" style="padding:15px; background:#222; border:none; border-radius:8px; color:#fff; cursor:pointer;">Action</button>
                    <button onclick="filterByGenre('Thriller')" style="padding:15px; background:#222; border:none; border-radius:8px; color:#fff; cursor:pointer;">Thriller</button>
                    <button onclick="filterByGenre('Crime')" style="padding:15px; background:#222; border:none; border-radius:8px; color:#fff; cursor:pointer;">Crime</button>
                </div>
                <button onclick="closeGenresModal()" style="margin-top:2rem; width:100%; padding:12px; background:#e50914; color:white; border:none; border-radius:6px; cursor:pointer;">Закрити</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeGenresModal() {
    const modal = document.getElementById('genres-modal');
    if (modal) modal.remove();
}

function filterByGenre(genre) {
    closeGenresModal();
    currentGenreFilter = genre;
    loadMovies();
}

function showAboutModal() {
    const modalHTML = `
        <div id="about-modal" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:3000; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; padding:2.5rem; border-radius:12px; max-width:600px; width:90%; color:#fff; line-height:1.6;">
                <h2 style="text-align:center; margin-bottom:1rem;">Про FilmHub</h2>
                <p>FilmHub — це сучасний веб-додаток для перегляду, пошуку та управління каталогом фільмів. Розроблено в рамках лабораторних робіт з Backend-розробки (NTUU "КПІ").</p>
                <p>Функціонал включає автентифікацію, CRUD-операції, улюблені фільми, пошук, жанри та повноцінний фронтенд.</p>
                <p style="text-align:center; margin-top:2rem; color:#00d4ff;">Використовує Node.js + Express + MySQL + Sequelize</p>
                <button onclick="closeAboutModal()" style="margin-top:2rem; width:100%; padding:14px; background:#00d4ff; color:black; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Закрити</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAboutModal() {
    const modal = document.getElementById('about-modal');
    if (modal) modal.remove();
}

// ==================== INITIALIZE EVERYTHING ====================
window.addEventListener('load', () => {
    updateAuthUI();
    loadMovies();
    setupSearch();
});