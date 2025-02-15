async function fetchWeather(current = false, future = false, past = false) {
    const location = document.getElementById('locationInput').value;
    if (!location) {
        alert('Please enter a city or zip code');
        return;
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1&format=json`;

    try {
        const geoResponse = await fetch(geoUrl);
        if (!geoResponse.ok) {
            throw new Error('Location not found');
        }
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('No coordinates found for this location');
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        let apiUrl;
        if (current) {
            apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto&windspeed_10m=true&humidity_2m=true`;
        } else if (future) {
            apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto&forecast_days=8`; 
        } else if (past) {
            apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto&past_days=7`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        const data = await response.json();

        let weatherHTML = `<h2>Weather for ${name}, ${country}</h2>`;

        if (current) {
            let tempC = data.current_weather.temperature;
            let tempF = convertCelsiusToFahrenheit(tempC);
            const weatherCode = data.current_weather.weathercode;
            const windSpeed = data.current_weather.windspeed_10m;
            const humidity = data.current_weather.humidity_2m;
            const icon = getWeatherIcon(weatherCode);
            const { time, day } = getCurrentTimeAndDay();

            weatherHTML += `
                <h3>Current Weather</h3>
                <p><strong>${day}, ${time}</strong></p>
                <p class="icon1">${icon}</p>
                <p>Temperature: ${tempF}°F </p>
                <p>Wind Speed: ${windSpeed} km/h</p>
                <p>Humidity: ${humidity}%</p>
            `;
        } else {
            if (future) {
                weatherHTML += '<h3>Next 7 Days Weather</h3>';
            } else if (past) {
                weatherHTML += '<h3>Last 7 Days Weather</h3>';
            }
            weatherHTML += '<div class="forecast-container">';

            const totalDays = Math.min(8, data.daily.time.length);

            for (let i = 1; i < totalDays; i++) { 
                const date = new Date(data.daily.time[i]).toDateString();
                let tempMaxC = data.daily.temperature_2m_max[i];
                let tempMinC = data.daily.temperature_2m_min[i];

                let tempMaxF = convertCelsiusToFahrenheit(tempMaxC);
                let tempMinF = convertCelsiusToFahrenheit(tempMinC);

                const weatherCode = data.daily.weathercode[i];
                const windSpeed = data.daily.wind_speed_10m_max[i]; 
                const humidity = data.daily.relative_humidity_2m_max[i]; 
                const icon = getWeatherIcon(weatherCode);

                weatherHTML += `
                    <div class="forecast-item">
                        <p><strong>${date}</strong></p>
                        <p class="icon2">${icon}</p> 
                         <span>
                            <p>🌡️ ${tempMaxF}°F</p>
                            <p>❄️ ${tempMinF}°F</p>
                            <p>💨 ${windSpeed} km/h</p>
                            <p>💧 ${humidity}%</p>
                       </span>
                    </div>
                `;
            }

            weatherHTML += '</div>';
        }

        document.getElementById('weatherResult').innerHTML = weatherHTML;
    } catch (error) {
        document.getElementById('weatherResult').innerHTML = '<p>Error fetching weather data.</p>';
    }
}

function resetSearch() {
    document.getElementById('locationInput').value = '';
    document.getElementById('weatherResult').innerHTML = '';
}

// Function to convert Celsius to Fahrenheit
function convertCelsiusToFahrenheit(celsius) {
    return ((celsius * 9) / 5 + 32).toFixed(1);  
}

// Function to get weather icons
function getWeatherIcon(code) {
    const weatherIcons = {
        0: '☀️',  // Clear sky
        1: '🌤️',  // Partly cloudy
        2: '⛅',   // Mostly cloudy
        3: '☁️',   // Overcast
        45: '🌫️',  // Foggy
        48: '🌫️',  // Mist
        51: '🌧️',  // Light rain
        53: '🌧️',  // Moderate rain
        55: '🌧️',  // Heavy rain
        61: '🌧️',  // Showers
        63: '🌧️',  // Showers
        71: '❄️',   // Light snow
        73: '❄️',   // Moderate snow
        75: '❄️',   // Heavy snow
        95: '🌩️',  // Thunderstorms
        96: '🌩️',  // Thunderstorms
        99: '🌩️',  // Thunderstorms
    };
    
    return weatherIcons[code] || '❓';  // Default to question mark if code is not found
}

// Function to get current time and day
function getCurrentTimeAndDay() {
    const now = new Date();
    const options = { weekday: 'long' };
    const day = now.toLocaleDateString(undefined, options);
    const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return { time, day };
}

// background
function toggleMenu() {
    const menu = document.querySelector('.menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

const canvas = document.getElementById('rainCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const drops = [];
for (let i = 0; i < 100; i++) {
    drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 5 + 2,
        length: Math.random() * 20 + 10
    });
}

function drawRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(174,194,224,0.6)';
    ctx.strokeStyle = 'rgba(174,194,224,0.6)';
    ctx.lineWidth = 1;
    drops.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
        drop.y += drop.speed;
        if (drop.y > canvas.height) {
            drop.y = 0;
            drop.x = Math.random() * canvas.width;
        }
    });
    requestAnimationFrame(drawRain);
}
drawRain();