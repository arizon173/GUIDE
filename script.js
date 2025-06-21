let places = {};
let events = [];

const Telegram = window.Telegram.WebApp;
Telegram.ready();
Telegram.expand();

// Мапа для відповідності кнопок до типів з даних
const categoryMap = {
  restaurants: 'restaurant',
  parks: 'park',
  museums: 'museum',
  relax: 'relax',
  cinema: 'cinema'
};

// === 📍 Завантаження місць ===
async function loadPlaces() {
  try {
    const res = await fetch('/admin-api/places', {
      headers: {
        'Authorization': 'Basic ' + btoa('admin:password'),
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const rawPlaces = await res.json();

    places = rawPlaces.reduce((acc, place) => {
      if (!acc[place.type]) acc[place.type] = {};
      acc[place.type][place._id] = place;
      return acc;
    }, {});

    if (document.getElementById('nav-places').checked) {
      showPlaces();
      showSubmenu(true);
    }
  } catch (err) {
    console.error('Помилка при завантаженні місць:', err);
    document.getElementById('content').innerHTML = '<p class="error">❌ Не вдалося завантажити місця.</p>';
  }
}

// === 🗓️ Завантаження подій ===
async function loadEvents() {
  try {
    const res = await fetch('/admin-api/events', {
      headers: {
        'Authorization': 'Basic ' + btoa('admin:password'),
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    events = await res.json();

    if (document.getElementById('nav-events').checked) {
      showEvents();
      showSubmenu(false);
    }
  } catch (err) {
    console.error('Помилка при завантаженні подій:', err);
    document.getElementById('content').innerHTML = '<p class="error">❌ Не вдалося завантажити події.</p>';
  }
}

// === 🎨 Тема ===
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme ? savedTheme === 'dark' : Telegram.themeParams.bg_color?.toLowerCase() !== '#ffffff';
  document.body.classList.toggle('dark-theme', isDark);
  document.body.style.backgroundColor = isDark ? 'var(--bg-dark)' : 'var(--bg-light)';
  updateThemeIcon(isDark ? 'dark' : 'light');
}

function updateThemeIcon(theme) {
  document.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  const theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  document.body.style.backgroundColor = isDark ? 'var(--bg-dark)' : 'var(--bg-light)';
  updateThemeIcon(theme);
}

// === 📍 Показ місць ===
function showPlaces(category = '') {
  const content = document.getElementById('content');
  let html = '<h2>Місця у Львові</h2>';

  // Якщо є фільтр - використовуємо правильний тип
  const realCategory = categoryMap[category] || category;

  // Якщо фільтр пустий - показуємо всі місця
  const filteredPlaces = realCategory ? { [realCategory]: places[realCategory] || {} } : places;

  Object.entries(filteredPlaces).forEach(([cat, items]) => {
    html += `<h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>`;
    Object.values(items).forEach(place => {
      html += `
        <div class="place-card">
          <img src="${place.photo || 'https://via.placeholder.com/300x150?text=Фото'}" alt="${place.name}" loading="lazy">
          <h4>${place.name}</h4>
          <p>${place.description}</p>
          ${place.url ? `<a href="${place.url}" target="_blank">Детальніше</a>` : ''}
        </div>`;
    });
  });
  content.innerHTML = html;
}

// === 🗓️ Показ подій ===
function showEvents() {
  const content = document.getElementById('content');
  if (!events.length) {
    content.innerHTML = '<h2>Події у Львові</h2><p>Наразі немає подій.</p>';
    return;
  }

  let html = '<h2>Події у Львові</h2>';
  events.forEach(event => {
    html += `
      <div class="event-card">
        <h4>${event.title}</h4>
        <p>${event.description}</p>
        <p><strong>📅 ${new Date(event.date).toLocaleDateString()}</strong></p>
        ${event.url ? `<a href="${event.url}" target="_blank">Детальніше</a>` : ''}
      </div>`;
  });
  content.innerHTML = html;
}

// === 📍 Фільтрація місць ===
function filterPlaces(category) {
  const buttons = document.querySelectorAll('.glass-submenu button');
  buttons.forEach(btn => btn.classList.remove('active'));

  const activeButton = Array.from(buttons).find(btn => btn.getAttribute('onclick') === `filterPlaces('${category}')`);
  if (activeButton) activeButton.classList.add('active');

  showPlaces(category);
}

// === 🚩 Показ / Приховування підменю ===
function showSubmenu(show) {
  const submenu = document.getElementById('places-submenu');
  if (show) {
    submenu.classList.remove('hidden');
  } else {
    submenu.classList.add('hidden');
    // Прибираємо активність з кнопок фільтрації при прихованні
    const buttons = document.querySelectorAll('.glass-submenu button');
    buttons.forEach(btn => btn.classList.remove('active'));
  }
}

// === 🎛️ Навігація ===
function clearNavListeners() {
  const inputs = document.querySelectorAll('.glass-radio-group input');
  inputs.forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  });
}

function setupNavListeners() {
  clearNavListeners();
  const inputs = document.querySelectorAll('.glass-radio-group input');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      if (input.id === 'nav-places') {
        showPlaces();
        showSubmenu(true);
      }
      if (input.id === 'nav-events') {
        showEvents();
        showSubmenu(false);
      }
    });
  });
}

// === 🔘 Тематика
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// === 🚀 Старт
initTheme();
setupNavListeners();
loadPlaces();
loadEvents();
