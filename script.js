let history = [];

// Обновление истории
function updateHistory(name) {
    if (!history.includes(name)) {
        history.unshift(name);
        if (history.length > 5) history.pop();
        document.getElementById('historyContainer').innerHTML = history.map(c => 
            `<div class="history-item" onclick="setCity('${c}')">${c}</div>`
        ).join('');
    }
}

function setCity(c) {
    document.getElementById('cityInput').value = c;
    searchWeather();
}

// Получение координат
async function getCoordinates(city) {
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`
    );
    const data = await response.json();
    if (!data.results) throw new Error('Город не найден');
    return data.results[0];
}

// Получение ПОЛНЫХ данных о погоде (все параметры!)
async function getWeather(lat, lon) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,pressure_msl,visibility&hourly=temperature_2m,weathercode,relativehumidity_2m,windspeed_10m,precipitation&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset,precipitation_sum&timezone=auto&forecast_days=7`
    );
    return await response.json();
}

// Эмодзи погоды
function getEmoji(code) {
    const table = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌦️', 55: '🌦️',
        61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '🌨️', 73: '🌨️', 75: '🌨️',
        80: '🌧️', 81: '🌧️', 82: '🌧️',
        95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return table[code] || '☀️';
}

// Описание погоды
function getDesc(code) {
    const table = {
        0: 'Ясно', 1: 'Ясно', 2: 'Облачно', 3: 'Пасмурно',
        45: 'Туман', 48: 'Туман',
        51: 'Морось', 53: 'Морось', 55: 'Морось',
        61: 'Дождь', 63: 'Дождь', 65: 'Дождь',
        71: 'Снег', 73: 'Снег', 75: 'Снег',
        80: 'Ливень', 81: 'Ливень', 82: 'Ливень',
        95: 'Гроза', 96: 'Гроза', 99: 'Гроза'
    };
    return table[code] || 'Солнечно';
}

// Уровень УФ
function getUVLevel(uv) {
    if (uv <= 2) return { level: 'Низкий', color: '#4CAF50' };
    if (uv <= 5) return { level: 'Умеренный', color: '#FFEB3B' };
    if (uv <= 7) return { level: 'Высокий', color: '#FF9800' };
    if (uv <= 10) return { level: 'Очень высокий', color: '#F44336' };
    return { level: 'Экстремальный', color: '#9C27B0' };
}

// Форматирование времени
function formatTime(dateString) {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Название дня недели
function getDayName(dateString) {
    const date = new Date(dateString);
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[date.getDay()];
}

// Отрисовка приложения
function renderApp(loc, data) {
    const container = document.getElementById('weatherContainer');
    const now = new Date();
    const currentHour = now.getHours();

    // Почасовой прогноз (24 часа)
    let hourlyHTML = "";
    for (let i = 0; i < 24; i++) {
        const idx = currentHour + i;
        const temp = data.hourly.temperature_2m[idx];
        const code = data.hourly.weathercode[idx];
        const humidity = data.hourly.relativehumidity_2m[idx];
        const precipitation = data.hourly.precipitation[idx];
        
        hourlyHTML += `
            <div class="hour-pill">
                <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px">${(idx % 24)}:00</div>
                <div style="font-size: 30px; margin: 10px 0">${getEmoji(code)}</div>
                <div style="font-weight: 700; margin-bottom: 5px">${Math.round(temp)}°</div>
                <div style="font-size: 11px; opacity: 0.7">💧 ${humidity}%</div>
                ${precipitation > 0 ? `<div style="font-size: 11px; opacity: 0.7">🌧️ ${precipitation}мм</div>` : ''}
            </div>`;
    }

    // Прогноз на 7 дней
    const weeklyHTML = data.daily.time.map((time, i) => {
        const dayName = i === 0 ? 'Сегодня' : getDayName(time);
        const precipitation = data.daily.precipitation_sum[i];
        const uvMax = data.daily.uv_index_max[i];
        const uvLevel = getUVLevel(uvMax);
        
        return `
            <div class="week-row">
                <div style="width: 120px; font-weight: 600">${dayName}</div>
                <div style="font-size: 30px; margin: 0 15px">${getEmoji(data.daily.weathercode[i])}</div>
                <div style="flex: 1; margin-left: 20px; opacity: 0.8; font-size: 14px; line-height: 1.6">
                    ${getDesc(data.daily.weathercode[i])}
                    ${precipitation > 0 ? `<br><span style="font-size: 0.9em">🌧️ ${Math.round(precipitation)}мм</span>` : ''}
                    <br><span style="font-size: 0.9em; color: ${uvLevel.color}">☀️ УФ: ${Math.round(uvMax)} (${uvLevel.level})</span>
                </div>
                <div style="font-weight: 700; font-size: 16px">
                    ${Math.round(data.daily.temperature_2m_max[i])}° 
                    <span style="opacity:0.4; font-weight:400">/ ${Math.round(data.daily.temperature_2m_min[i])}°</span>
                </div>
            </div>
        `;
    }).join('');

    // УФ индекс сегодня
    const todayUV = data.daily.uv_index_max[0];
    const uvInfo = getUVLevel(todayUV);

    // Восход и закат
    const sunrise = formatTime(data.daily.sunrise[0]);
    const sunset = formatTime(data.daily.sunset[0]);

    // ГЛАВНАЯ КАРТОЧКА
    container.innerHTML = `
        <div class="hero-card">
            <div class="hero-left">
                <div>
                    <h2 style="font-size: 30px">${now.toLocaleDateString('ru', { weekday: 'long' })}</h2>
                    <p style="opacity: 0.8">${now.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p style="margin-top: 15px; font-weight: 600">📍 ${loc.name}, ${loc.country_code?.toUpperCase() || ''}</p>
                </div>
                <div style="text-align: center">
                    <div class="hero-icon">${getEmoji(data.current.weathercode)}</div>
                    <div class="hero-temp">${Math.round(data.current.temperature_2m)}°C</div>
                    <div class="hero-desc">${getDesc(data.current.weathercode)}</div>
                    <div style="margin-top: 10px; opacity: 0.85">Макс: ${Math.round(data.daily.temperature_2m_max[0])}° • Мин: ${Math.round(data.daily.temperature_2m_min[0])}°</div>
                </div>
            </div>
            
            <div class="hero-right">
                <div class="hero-stats">
                    <div class="stat-row">
                        <span class="stat-label">Осадки</span>
                        <span class="stat-value">${data.current.precipitation}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Влажность</span>
                        <span class="stat-value">${data.current.relativehumidity_2m}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Ветер</span>
                        <span class="stat-value">${Math.round(data.current.windspeed_10m)} км/ч</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Ощущается как</span>
                        <span class="stat-value">${Math.round(data.current.apparent_temperature)}°C</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">УФ-Индекс</span>
                        <span class="stat-value" style="color: ${uvInfo.color}">${Math.round(todayUV)} (${uvInfo.level})</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Давление</span>
                        <span class="stat-value">${Math.round(data.current.pressure_msl)} гПа</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Видимость</span>
                        <span class="stat-value">${(data.current.visibility / 1000).toFixed(1)} км</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Восход / Закат</span>
                        <span class="stat-value" style="font-size: 12px">${sunrise} / ${sunset}</span>
                    </div>
                </div>
                
                <div class="mini-forecast">
                    ${data.daily.time.slice(0, 4).map((t, i) => `
                        <div class="mini-item ${i === 0 ? 'active' : ''}">
                            <div style="font-size: 24px">${getEmoji(data.daily.weathercode[i])}</div>
                            <div style="font-size: 10px; font-weight: 700; margin: 5px 0">${i === 0 ? 'Сегодня' : new Date(t).toLocaleDateString('ru', { weekday: 'short' })}</div>
                            <div style="font-size: 14px; font-weight: 600">${Math.round(data.daily.temperature_2m_max[i])}°</div>
                        </div>
                    `).join('')}
                </div>
                
                <button class="change-btn" onclick="document.getElementById('cityInput').focus()">
                    Сменить город
                </button>
            </div>
        </div>

        <h3 class="section-title">📊 24-часовой прогноз</h3>
        <div class="hourly-container">${hourlyHTML}</div>

        <h3 class="section-title">📅 Прогноз на 7 дней</h3>
        <div class="weekly-list">${weeklyHTML}</div>
    `;
}

// Основная функция поиска
async function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    const loadingContainer = document.getElementById('loadingContainer');
    const errorContainer = document.getElementById('errorContainer');
    
    loadingContainer.innerHTML = "<p style='text-align:center'>🔍 Загрузка...</p>";
    errorContainer.innerHTML = "";
    errorContainer.style.display = "none";
    document.getElementById('weatherContainer').innerHTML = "";

    try {
        const loc = await getCoordinates(city);
        const data = await getWeather(loc.latitude, loc.longitude);

        loadingContainer.innerHTML = "";
        renderApp(loc, data);
        updateHistory(loc.name);
    } catch (err) {
        loadingContainer.innerHTML = "";
        errorContainer.innerHTML = `<p style='color:#ff7675; text-align:center'>❌ ${err.message}</p>`;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });

    // Автозапуск
    searchWeather();
});
