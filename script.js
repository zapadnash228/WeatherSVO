let searchHistory = [];

// Обновление отображения истории
function updateHistoryDisplay() {
    const container = document.getElementById('historyContainer');
    if (searchHistory.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = searchHistory.map(city => 
        `<div class="history-item" onclick="searchFromHistory('${city}')">${city}</div>`
    ).join('');
}

// Поиск из истории
function searchFromHistory(city) {
    document.getElementById('cityInput').value = city;
    searchWeather();
}

// Сохранение в историю
function saveHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);
        if (searchHistory.length > 5) {
            searchHistory.pop();
        }
        updateHistoryDisplay();
    }
}

// Получение координат города
async function getCoordinates(city) {
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`
    );
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
        throw new Error('Город не найден');
    }
    
    return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country || data.results[0].country_code || ''
    };
}

// Получение данных о погоде
async function getWeather(lat, lon) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,pressure_msl,relativehumidity_2m,visibility,weathercode,windspeed_10m&hourly=temperature_2m,weathercode,relativehumidity_2m,windspeed_10m,precipitation,pressure_msl,uv_index,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=7`
    );
    return await response.json();
}

// Получение эмодзи для погоды
function getWeatherEmoji(code) {
    const weatherCodes = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌦️', 55: '🌦️',
        61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '🌨️', 73: '🌨️', 75: '🌨️',
        80: '🌧️', 81: '🌧️', 82: '🌧️',
        95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return weatherCodes[code] || '🌤️';
}

// Получение описания погоды
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Ясно', 1: 'Преимущественно ясно', 2: 'Переменная облачность', 3: 'Облачно',
        45: 'Туман', 48: 'Туман',
        51: 'Легкая морось', 53: 'Морось', 55: 'Сильная морось',
        61: 'Небольшой дождь', 63: 'Дождь', 65: 'Сильный дождь',
        71: 'Небольшой снег', 73: 'Снег', 75: 'Сильный снег',
        80: 'Ливень', 81: 'Сильный ливень', 82: 'Очень сильный ливень',
        95: 'Гроза', 96: 'Гроза с градом', 99: 'Сильная гроза с градом'
    };
    return descriptions[code] || 'Переменная облачность';
}

// Получение уровня УФ
function getUVLevel(uv) {
    if (uv <= 2) return { level: 'Низкий', color: '#4CAF50' };
    if (uv <= 5) return { level: 'Умеренный', color: '#FFEB3B' };
    if (uv <= 7) return { level: 'Высокий', color: '#FF9800' };
    if (uv <= 10) return { level: 'Очень высокий', color: '#F44336' };
    return { level: 'Экстремальный', color: '#9C27B0' };
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

// Получение дня недели
function getDayName(dateString) {
    const date = new Date(dateString);
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[date.getDay()];
}

// Форматирование времени
function formatTime(dateString) {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Отображение погоды
function displayWeather(location, weather) {
    const container = document.getElementById('weatherContainer');
    const now = new Date();
    const currentHour = now.getHours();
    
    // Текущая погода
    const currentTemp = weather.current.temperature_2m;
    const feelsLike = weather.current.apparent_temperature;
    const currentHumidity = weather.current.relativehumidity_2m;
    const currentPressure = weather.current.pressure_msl;
    const currentPrecipitation = weather.current.precipitation;
    const currentVisibility = (weather.current.visibility / 1000).toFixed(1);
    const currentCode = weather.current.weathercode;
    const currentWind = weather.current.windspeed_10m;
    const currentUV = weather.hourly.uv_index[currentHour] || 0;
    const uvInfo = getUVLevel(currentUV);
    
    // Сегодняшние данные
    const todayMax = weather.daily.temperature_2m_max[0];
    const todayMin = weather.daily.temperature_2m_min[0];
    const todaySunrise = formatTime(weather.daily.sunrise[0]);
    const todaySunset = formatTime(weather.daily.sunset[0]);
    
    // Текущая дата
    const dateInfo = {
        day: getDayName(now),
        date: now.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    // Мини-прогноз на 4 дня
    const miniForecasts = weather.daily.time.slice(0, 4).map((date, i) => {
        const dayName = i === 0 ? 'Сегодня' : new Date(date).toLocaleDateString('ru', { weekday: 'short' });
        return `
            <div class="mini-item ${i === 0 ? 'active' : ''}">
                <div style="font-size: 28px; margin-bottom: 8px">${getWeatherEmoji(weather.daily.weathercode[i])}</div>
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase">${dayName}</div>
                <div style="font-size: 15px; font-weight: 700">${Math.round(weather.daily.temperature_2m_max[i])}°</div>
            </div>
        `;
    }).join('');

    // Почасовой прогноз (24 часа)
    const hourlyHTML = Array.from({length: 24}, (_, i) => {
        const idx = currentHour + i;
        const hour = idx % 24;
        const temp = weather.hourly.temperature_2m[idx];
        const code = weather.hourly.weathercode[idx];
        const humidity = weather.hourly.relativehumidity_2m[idx];
        const precipitation = weather.hourly.precipitation[idx];
        const time = `${hour.toString().padStart(2, '0')}:00`;
        
        return `
            <div class="hour-pill">
                <div class="hour-time">${time}</div>
                <div class="hour-icon">${getWeatherEmoji(code)}</div>
                <div class="hour-temp">${Math.round(temp)}°</div>
                <div class="hour-details">
                    💧 ${humidity}%
                    ${precipitation > 0 ? `<br>🌧️ ${precipitation}мм` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Недельный прогноз (7 дней)
    const weeklyHTML = weather.daily.time.map((date, i) => {
        const dayName = i === 0 ? 'Сегодня' : getDayName(date);
        const precipitation = weather.daily.precipitation_sum[i];
        const uvMax = weather.daily.uv_index_max[i];
        const uvLevel = getUVLevel(uvMax);
        
        return `
            <div class="week-row">
                <div class="week-day">${dayName}</div>
                <div class="week-icon">${getWeatherEmoji(weather.daily.weathercode[i])}</div>
                <div class="week-desc">
                    ${getWeatherDescription(weather.daily.weathercode[i])}
                    ${precipitation > 0 ? `<br><span style="font-size: 0.9em;">🌧️ ${Math.round(precipitation)}мм</span>` : ''}
                    <br><span style="font-size: 0.9em; color: ${uvLevel.color}">☀️ УФ: ${Math.round(uvMax)} (${uvLevel.level})</span>
                </div>
                <div class="week-temps">
                    <span class="week-temp-max">${Math.round(weather.daily.temperature_2m_max[i])}°</span>
                    <span class="week-temp-min">/ ${Math.round(weather.daily.temperature_2m_min[i])}°</span>
                </div>
            </div>
        `;
    }).join('');

    // Вставка HTML
    container.innerHTML = `
        <div class="hero-card">
            <div class="hero-left">
                <div>
                    <h2 style="font-size: 28px; margin-bottom: 5px">${dateInfo.day}</h2>
                    <p style="opacity: 0.9; margin-bottom: 15px">${dateInfo.date}</p>
                    <p style="font-weight: 600; display: flex; align-items: center; gap: 8px">
                        <span style="font-size: 20px">📍</span>
                        <span>${location.name}, ${location.country}</span>
                    </p>
                </div>
                <div style="text-align: center">
                    <div class="hero-icon">${getWeatherEmoji(currentCode)}</div>
                    <div class="hero-temp">${Math.round(currentTemp)}°C</div>
                    <div class="hero-desc">${getWeatherDescription(currentCode)}</div>
                    <div class="hero-temp-range">
                        Макс: ${Math.round(todayMax)}° • Мин: ${Math.round(todayMin)}°
                    </div>
                </div>
            </div>

            <div class="hero-right">
                <div class="hero-stats">
                    <div class="stat-card">
                        <div class="stat-icon">🌡️</div>
                        <div class="stat-content">
                            <div class="stat-label">Ощущается как</div>
                            <div class="stat-value">${Math.round(feelsLike)}°C</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💧</div>
                        <div class="stat-content">
                            <div class="stat-label">Влажность</div>
                            <div class="stat-value">${currentHumidity}%</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💨</div>
                        <div class="stat-content">
                            <div class="stat-label">Ветер</div>
                            <div class="stat-value">${Math.round(currentWind)} км/ч</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🌧️</div>
                        <div class="stat-content">
                            <div class="stat-label">Осадки</div>
                            <div class="stat-value">${currentPrecipitation} мм</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🔆</div>
                        <div class="stat-content">
                            <div class="stat-label">УФ индекс</div>
                            <div class="stat-value" style="color: ${uvInfo.color}">${Math.round(currentUV)} <span style="font-size: 0.7em">(${uvInfo.level})</span></div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🧭</div>
                        <div class="stat-content">
                            <div class="stat-label">Давление</div>
                            <div class="stat-value">${Math.round(currentPressure)} гПа</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">👁️</div>
                        <div class="stat-content">
                            <div class="stat-label">Видимость</div>
                            <div class="stat-value">${currentVisibility} км</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🌅</div>
                        <div class="stat-content">
                            <div class="stat-label">Восход / Закат</div>
                            <div class="stat-value" style="font-size: 1em">${todaySunrise} / ${todaySunset}</div>
                        </div>
                    </div>
                </div>

                <div class="mini-forecast">
                    ${miniForecasts}
                </div>

                <button class="change-location-btn" onclick="document.getElementById('cityInput').focus()">
                    📍 Изменить местоположение
                </button>
            </div>
        </div>

        <h3 class="section-title">📊 Почасовой прогноз (24 часа)</h3>
        <div class="hourly-container">
            ${hourlyHTML}
        </div>

        <h3 class="section-title">📅 Прогноз на 7 дней</h3>
        <div class="weekly-list">
            ${weeklyHTML}
        </div>
    `;
}

// Основная функция поиска
async function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    const errorContainer = document.getElementById('errorContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    const weatherContainer = document.getElementById('weatherContainer');

    if (!city) {
        errorContainer.innerHTML = '<p style="text-align:center">⚠️ Пожалуйста, введите название города</p>';
        return;
    }

    // Очистка
    errorContainer.innerHTML = '';
    weatherContainer.innerHTML = '';
    loadingContainer.innerHTML = '<p style="text-align:center">🔍 Поиск погоды...</p>';

    try {
        // Получение координат
        const location = await getCoordinates(city);
        
        // Получение погоды
        const weather = await getWeather(location.lat, location.lon);
        
        // Отображение
        loadingContainer.innerHTML = '';
        displayWeather(location, weather);
        
        // Сохранение в историю
        saveHistory(location.name);
    } catch (error) {
        loadingContainer.innerHTML = '';
        errorContainer.innerHTML = `<p style="text-align:center">❌ ${error.message}</p>`;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    
    // Enter для поиска
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });

    // Автоматический поиск при загрузке
    searchWeather();
});
