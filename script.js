let searchHistory = [];

async function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    const weatherContainer = document.getElementById('weatherContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    const errorContainer = document.getElementById('errorContainer');

    errorContainer.innerHTML = '';
    loadingContainer.innerHTML = '<div class="loading">Загрузка...</div>';

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results) throw new Error('Город не найден');
        const loc = geoData.results[0];

        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relativehumidity_2m,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const weather = await wRes.json();

        loadingContainer.innerHTML = '';
        displayWeather(loc, weather);
        saveHistory(loc.name);
    } catch (e) {
        loadingContainer.innerHTML = '';
        errorContainer.innerHTML = `<div class="error">${e.message}</div>`;
    }
}

function displayWeather(loc, weather) {
    const container = document.getElementById('weatherContainer');
    
    // Форматирование даты
    const now = new Date();
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    const dayName = days[now.getDay()];
    const fullDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    // Прогноз на 4 дня
    const miniForecast = weather.daily.time.slice(0, 4).map((date, i) => {
        const d = new Date(date);
        const daySh = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()];
        return `
            <li class="day-item ${i === 0 ? 'active' : ''}">
                <div class="day-icon">${getWeatherEmoji(weather.daily.weathercode[i])}</div>
                <div class="day-name-sh">${daySh}</div>
                <div class="day-temp">${Math.round(weather.daily.temperature_2m_max[i])}°C</div>
            </li>
        `;
    }).join('');

    container.innerHTML = `
        <div class="weather-app">
            <div class="left-side">
                <div>
                    <h2 class="day-name">${dayName}</h2>
                    <p class="full-date">${fullDate}</p>
                    <p class="loc-tag">📍 ${loc.name}, ${loc.country_code.toUpperCase()}</p>
                </div>
                <div>
                    <h1 class="main-temp">${Math.round(weather.current.temperature_2m)}°C</h1>
                    <p class="weather-desc">${getWeatherDescription(weather.current.weathercode)}</p>
                </div>
            </div>
            <div class="right-side">
                <div class="stats-box">
                    <div class="stat-item"><span>Precipitation</span><span class="stat-val">${weather.current.precipitation}%</span></div>
                    <div class="stat-item"><span>Humidity</span><span class="stat-val">${weather.current.relativehumidity_2m}%</span></div>
                    <div class="stat-item"><span>Wind</span><span class="stat-val">3 km/h</span></div>
                </div>
                <ul class="days-list">${miniForecast}</ul>
                <button class="loc-btn" onclick="document.getElementById('cityInput').focus()">Change Location</button>
            </div>
        </div>
    `;
}

function getWeatherEmoji(code) {
    const codes = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 51: '🌦️', 61: '🌧️', 71: '🌨️', 95: '⛈️' };
    return codes[code] || '☀️';
}

function getWeatherDescription(code) {
    const desc = { 0: 'Ясно', 1: 'Ясно', 2: 'Облачно', 3: 'Пасмурно', 45: 'Туман', 61: 'Дождь' };
    return desc[code] || 'Солнечно';
}

function saveHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);
        if (searchHistory.length > 5) searchHistory.pop();
        updateHistoryUI();
    }
}

function updateHistoryUI() {
    const container = document.getElementById('historyContainer');
    container.innerHTML = searchHistory.map(city => `<div class="history-item" onclick="setCity('${city}')">${city}</div>`).join('');
}

function setCity(city) {
    document.getElementById('cityInput').value = city;
    searchWeather();
}

// Старт
searchWeather();
