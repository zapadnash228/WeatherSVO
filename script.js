let searchHistory = [];

// Загрузка истории (без localStorage)
function loadHistory() {
    // История будет храниться только в памяти
    updateHistoryDisplay();
}

// Сохранение истории (в памяти)
function saveHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);
        if (searchHistory.length > 5) {
            searchHistory.pop();
        }
        updateHistoryDisplay();
    }
}

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

// Получение координат города через Geocoding API
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
        country: data.results[0].country
    };
}

// Получение данных о погоде
async function getWeather(lat, lon) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,pressure_msl,relativehumidity_2m,visibility&hourly=temperature_2m,weathercode,relativehumidity_2m,windspeed_10m,precipitation,pressure_msl,uv_index,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=7`
    );
    return await response.json();
}

// Получение эмодзи для кода погоды
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

// Получение описания погоды на русском
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
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
}

// Получение полной даты
function getFullDate() {
    const now = new Date();
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return {
        day: days[now.getDay()],
        date: `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
    };
}

// Форматирование времени
function formatTime(dateString) {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Отображение погоды на странице
function displayWeather(location, weather) {
    const container = document.getElementById('weatherContainer');
    const now = new Date();
    const currentHour = now.getHours();
    const dateInfo = getFullDate();
    
    // Данные текущей погоды
    const currentTemp = weather.current.temperature_2m;
    const feelsLike = weather.current.apparent_temperature;
    const currentHumidity = weather.current.relativehumidity_2m;
    const currentPressure = weather.current.pressure_msl;
    const currentPrecipitation = weather.current.precipitation;
    const currentVisibility = weather.current.visibility / 1000; // в км
    const currentCode = weather.hourly.weathercode[currentHour];
    const currentWind = weather.hourly.windspeed_10m[currentHour];
    const currentUV = weather.hourly.uv_index[currentHour];
    const uvInfo = getUVLevel(currentUV);
    
    // Сегодняшние данные
    const todayMax = weather.daily.temperature_2m_max[0];
    const todayMin = weather.daily.temperature_2m_min[0];
    const todaySunrise = formatTime(weather.daily.sunrise[0]);
    const todaySunset = formatTime(weather.daily.sunset[0]);

    // 4 дня для мини-прогноза
    const miniForecasts = weather.daily.time.slice(0, 4).map((date, i) => {
        return `
            <div class="forecast-day ${i === 0 ? 'active' : ''}">
                <div class="forecast-weekday">${i === 0 ? 'Сегодня' : getDayName(date)}</div>
                <div class="forecast-icon">${getWeatherEmoji(weather.daily.weathercode[i])}</div>
                <div class="forecast-temp">${Math.round(weather.daily.temperature_2m_max[i])}°C</div>
            </div>
        `;
    }).join('');

    // Генерация почасовой погоды (24 часа)
    const hourlyHTML = Array.from({length: 24}, (_, i) => {
        const hour = (currentHour + i) % 24;
        const temp = weather.hourly.temperature_2m[currentHour + i];
        const code = weather.hourly.weathercode[currentHour + i];
        const humidity = weather.hourly.relativehumidity_2m[currentHour + i];
        const precipitation = weather.hourly.precipitation[currentHour + i];
        const time = `${hour.toString().padStart(2, '0')}:00`;
        
        return `
            <div class="hour-card">
                <div class="time">${time}</div>
                <div class="emoji">${getWeatherEmoji(code)}</div>
                <div class="temp">${Math.round(temp)}°</div>
                <div class="details">
                    💧 ${humidity}%
                    ${precipitation > 0 ? `<br>🌧️ ${precipitation}мм` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Генерация 7-дневного прогноза
    const forecastHTML = weather.daily.time.map((date, i) => {
        const precipitation = weather.daily.precipitation_sum[i];
        const uvMax = weather.daily.uv_index_max[i];
        const uvLevel = getUVLevel(uvMax);
        
        return `
            <div class="day-card">
                <div class="day-info">
                    <div class="date">${i === 0 ? 'Сегодня' : formatDate(date)}</div>
                    <div class="emoji">${getWeatherEmoji(weather.daily.weathercode[i])}</div>
                    <div class="description">
                        ${getWeatherDescription(weather.daily.weathercode[i])}
                        ${precipitation > 0 ? `<br><span style="font-size: 0.85em;">🌧️ ${Math.round(precipitation)}мм</span>` : ''}
                        <br><span style="font-size: 0.85em;">☀️ УФ: ${Math.round(uvMax)} (${uvLevel.level})</span>
                    </div>
                </div>
                <div class="temps">
                    <div class="temp-max">${Math.round(weather.daily.temperature_2m_max[i])}°</div>
                    <div class="temp-min">${Math.round(weather.daily.temperature_2m_min[i])}°</div>
                </div>
            </div>
        `;
    }).join('');

    // Вставка всего HTML
    container.innerHTML = `
        <div class="weather-container">
            <div class="current-weather">
                <div class="date-location">
                    <div class="current-day">${dateInfo.day}</div>
                    <div class="current-date">${dateInfo.date}</div>
                    <div class="location">
                        <span>📍</span>
                        <span>${location.name}, ${location.country}</span>
                    </div>
                </div>
                
                <div class="weather-main">
                    <div class="weather-icon-large">${getWeatherEmoji(currentCode)}</div>
                    <div class="current-temp">${Math.round(currentTemp)}°C</div>
                    <div class="weather-description">${getWeatherDescription(currentCode)}</div>
                    <div class="temp-range">
                        <span>Макс: ${Math.round(todayMax)}°</span>
                        <span style="margin: 0 10px;">•</span>
                        <span>Мин: ${Math.round(todayMin)}°</span>
                    </div>
                </div>
            </div>

            <div class="weather-details">
                <div class="details-grid">
                    <div class="detail-card">
                        <div class="detail-icon">🌡️</div>
                        <div class="detail-content">
                            <div class="detail-label">Ощущается как</div>
                            <div class="detail-value">${Math.round(feelsLike)}°C</div>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-icon">💧</div>
                        <div class="detail-content">
                            <div class="detail-label">Влажность</div>
                            <div class="detail-value">${currentHumidity}%</div>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-icon">💨</div>
                        <div class="detail-content">
                            <div class="detail-label">Ветер</div>
                            <div class="detail-value">${Math.round(currentWind)} км/ч</div>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-icon">🌧️</div>
                        <div class="detail-content">
                            <div class="detail-label">Осадки</div>
                            <div class="detail-value">${currentPrecipitation} мм</div>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-icon">🔆</div>
                        <div class="detail-content">
                            <div class="detail-label">УФ индекс</div>
                            <div class="detail-value" style="color: ${uvInfo.color}">${Math.round(currentUV)} <span style="font-size: 0.6em;">(${uvInfo.level})</span></div>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-icon">🧭</div>
                        <div class="detail-content">
                            <div class="detail-label">Давление</div>
                            <div class="detail-value">${Math.round(currentPressure)} гПа</div>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-icon">👁️</div>
                        <div class="detail-content">
                            <div class="detail-label">Видимость</div>
                            <div class="detail-value">${currentVisibility.toFixed(1)} км</div>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-icon">🌅</div>
                        <div class="detail-content">
                            <div class="detail-label">Восход / Закат</div>
                            <div class="detail-value" style="font-size: 0.9em;">${todaySunrise} / ${todaySunset}</div>
                        </div>
                    </div>
                </div>

                <div class="forecast-mini">
                    ${miniForecasts}
                </div>

                <button class="change-location-btn" onclick="document.getElementById('cityInput').focus()">
                    <span>📍</span>
                    <span>Изменить местоположение</span>
                </button>
            </div>
        </div>

        <div class="hourly-section">
            <h3>📊 Почасовой прогноз</h3>
            <div class="hourly-scroll">
                ${hourlyHTML}
            </div>
        </div>

        <div class="forecast-section">
            <h3>📅 Прогноз на 7 дней</h3>
            <div class="forecast-grid">
                ${forecastHTML}
            </div>
        </div>
    `;
}

// Основная функция поиска погоды
async function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    const errorContainer = document.getElementById('errorContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    const weatherContainer = document.getElementById('weatherContainer');

    if (!city) {
        errorContainer.innerHTML = '<div class="error">Пожалуйста, введите название города</div>';
        return;
    }

    // Очистка предыдущих результатов
    errorContainer.innerHTML = '';
    weatherContainer.innerHTML = '';
    loadingContainer.innerHTML = '<div class="loading">🔍 Поиск погоды...</div>';

    try {
        // Получение координат города
        const location = await getCoordinates(city);
        
        // Получение данных о погоде
        const weather = await getWeather(location.lat, location.lon);
        
        // Отображение результатов
        loadingContainer.innerHTML = '';
        displayWeather(location, weather);
        
        // Сохранение в историю
        saveHistory(location.name);
    } catch (error) {
        loadingContainer.innerHTML = '';
        errorContainer.innerHTML = `<div class="error">❌ ${error.message}</div>`;
    }
}

// Обработчик Enter в поле ввода и инициализация
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    
    // Обработчик нажатия Enter
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });

    // Загрузка истории при старте
    loadHistory();
    
    // Автоматический поиск погоды для Бишкека при загрузке
    cityInput.value = 'Бишкек';
    searchWeather();
});