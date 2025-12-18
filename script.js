let history = [];

async function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    const container = document.getElementById('weatherContainer');
    document.getElementById('loadingContainer').innerHTML = "<p style='text-align:center'>Загрузка...</p>";

    try {
        // 1. Геокодинг
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`);
        const geoData = await geo.json();
        if (!geoData.results) throw new Error("Город не найден");
        const loc = geoData.results[0];

        // 2. Получение ВСЕХ твоих данных (текущие, 24 часа, 7 дней)
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation,weathercode,windspeed_10m&hourly=temperature_2m,weathercode,relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=auto`);
        const data = await res.json();

        document.getElementById('loadingContainer').innerHTML = "";
        renderApp(loc, data);
        updateHistory(loc.name);
    } catch (err) {
        document.getElementById('loadingContainer').innerHTML = "";
        document.getElementById('errorContainer').innerHTML = `<p style='color:#ff7675'>${err.message}</p>`;
    }
}

function renderApp(loc, data) {
    const container = document.getElementById('weatherContainer');
    const now = new Date();
    
    // Твой почасовой прогноз (24 часа)
    const currentHour = now.getHours();
    let hourlyHTML = "";
    for(let i = 0; i < 24; i++) {
        const idx = currentHour + i;
        hourlyHTML += `
            <div class="hour-pill">
                <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px">${idx % 24}:00</div>
                <div style="font-size: 20px">${getEmoji(data.hourly.weathercode[idx])}</div>
                <div style="font-weight: 700; margin-top: 5px">${Math.round(data.hourly.temperature_2m[idx])}°</div>
            </div>`;
    }

    // Твой прогноз на 7 дней
    const weeklyHTML = data.daily.time.map((time, i) => `
        <div class="week-row">
            <div style="width: 120px; font-weight: 600">${i === 0 ? 'Сегодня' : new Date(time).toLocaleDateString('ru', {weekday: 'long'})}</div>
            <div style="font-size: 24px">${getEmoji(data.daily.weathercode[i])}</div>
            <div style="flex: 1; margin-left: 20px; opacity: 0.6">${getDesc(data.daily.weathercode[i])}</div>
            <div style="font-weight: 700">${Math.round(data.daily.temperature_2m_max[i])}° <span style="opacity:0.4; font-weight:400">/ ${Math.round(data.daily.temperature_2m_min[i])}°</span></div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="hero-card">
            <div class="hero-left">
                <div>
                    <h2 style="font-size: 30px">${new Date().toLocaleDateString('ru', {weekday: 'long'})}</h2>
                    <p style="opacity: 0.8">${new Date().toLocaleDateString('ru', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    <p style="margin-top: 15px; font-weight: 600">📍 ${loc.name}, ${loc.country_code?.toUpperCase() || ''}</p>
                </div>
                <div>
                    <div class="hero-temp">${Math.round(data.current.temperature_2m)}°C</div>
                    <div class="hero-desc">${getDesc(data.current.weathercode)}</div>
                </div>
            </div>
            <div class="hero-right">
                <div class="hero-stats">
                    <div class="info-row"><span>Влажность</span><span class="info-val">${data.current.relativehumidity_2m}%</span></div>
                    <div class="info-row"><span>Ощущается как</span><span class="info-val">${Math.round(data.current.apparent_temperature)}°C</span></div>
                    <div class="info-row"><span>Ветер</span><span class="info-val">${data.current.windspeed_10m} км/ч</span></div>
                    <div class="info-row"><span>УФ-Индекс</span><span class="info-val">${data.daily.uv_index_max[0]}</span></div>
                </div>
                <div class="mini-forecast">
                    ${data.daily.time.slice(0, 4).map((t, i) => `
                        <div class="mini-item ${i === 0 ? 'active' : ''}">
                            <div style="font-size: 18px">${getEmoji(data.daily.weathercode[i])}</div>
                            <div style="font-size: 10px; font-weight: 700; margin: 5px 0">${new Date(t).toLocaleDateString('ru', {weekday: 'short'})}</div>
                            <div style="font-size: 13px">${Math.round(data.daily.temperature_2m_max[i])}°</div>
                        </div>
                    `).join('')}
                </div>
                <button class="history-item" style="width:100%; padding: 12px; border:none; background: linear-gradient(90deg, #74ebd5, #acb6e5); color:white; font-weight:700; margin-top:20px" onclick="document.getElementById('cityInput').focus()">СМЕНИТЬ ГОРОД</button>
            </div>
        </div>

        <h3 class="section-title">24-часовой прогноз</h3>
        <div class="hourly-container">${hourlyHTML}</div>

        <h3 class="section-title">Прогноз на 7 дней</h3>
        <div class="weekly-list">${weeklyHTML}</div>
    `;
}

function getEmoji(code) {
    const table = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 61: '🌧️', 71: '🌨️', 95: '⛈️' };
    return table[code] || '☀️';
}

function getDesc(code) {
    const table = { 0: 'Ясно', 1: 'Ясно', 2: 'Облачно', 3: 'Пасмурно', 45: 'Туман', 61: 'Дождь', 71: 'Снег', 95: 'Гроза' };
    return table[code] || 'Солнечно';
}

function updateHistory(name) {
    if (!history.includes(name)) {
        history.unshift(name);
        if (history.length > 5) history.pop();
        document.getElementById('historyContainer').innerHTML = history.map(c => `<div class="history-item" onclick="setCity('${c}')">${c}</div>`).join('');
    }
}

function setCity(c) {
    document.getElementById('cityInput').value = c;
    searchWeather();
}

// Запуск при старте
searchWeather();
