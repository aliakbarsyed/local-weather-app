const API = {
  forecast: "https://api.open-meteo.com/v1/forecast",
  geocode: "https://geocoding-api.open-meteo.com/v1/search",
  reverse: "https://api.bigdatacloud.net/data/reverse-geocode-client",
};

const state = {
  unit: localStorage.getItem("weather-unit") || "celsius",
  place: JSON.parse(localStorage.getItem("weather-place") || "null"),
  forecast: null,
};

const $ = (id) => document.getElementById(id);
const elements = {
  unitToggle: $("unitToggle"), searchForm: $("searchForm"), searchInput: $("searchInput"),
  searchResults: $("searchResults"), locateButton: $("locateButton"), status: $("status"),
  weatherContent: $("weatherContent"), locationName: $("locationName"), currentDate: $("currentDate"),
  currentTemp: $("currentTemp"), condition: $("condition"), feelsLike: $("feelsLike"),
  weatherArt: $("weatherArt"), wind: $("wind"), humidity: $("humidity"),
  precipitation: $("precipitation"), uvIndex: $("uvIndex"), updatedAt: $("updatedAt"),
  hourlyForecast: $("hourlyForecast"), dailyForecast: $("dailyForecast"),
};

const weatherCodes = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"], 48: ["Icy fog", "🌫️"], 51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"], 56: ["Freezing drizzle", "🌧️"], 57: ["Heavy freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"], 66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"], 71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "❄️"], 80: ["Light showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Heavy showers", "⛈️"],
  85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"], 95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"], 99: ["Severe hailstorm", "⛈️"],
};

const describeWeather = (code, isDay = 1) => {
  const [label, icon] = weatherCodes[code] || ["Unknown", "🌤️"];
  if (code === 0 && !isDay) return ["Clear night", "🌙"];
  if ([1, 2].includes(code) && !isDay) return [label, "☁️"];
  return [label, icon];
};

const temperature = (value) => `${Math.round(value)}°`;
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));

async function requestJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  return response.json();
}

async function loadForecast(place) {
  showStatus("Loading forecast…");
  const params = new URLSearchParams({
    latitude: place.latitude, longitude: place.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",
    temperature_unit: state.unit, wind_speed_unit: state.unit === "celsius" ? "kmh" : "mph",
    timezone: "auto", forecast_days: "7",
  });

  try {
    state.forecast = await requestJson(`${API.forecast}?${params}`);
    state.place = place;
    localStorage.setItem("weather-place", JSON.stringify(place));
    render();
  } catch (error) {
    showStatus("Couldn’t load the weather. Check your connection and try again.", true);
    console.error(error);
  }
}

function showStatus(message, isError = false) {
  elements.status.hidden = false;
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#ff9f9f" : "";
  elements.weatherContent.hidden = true;
}

function render() {
  const { current, current_units: units, hourly, daily } = state.forecast;
  const [condition, icon] = describeWeather(current.weather_code, current.is_day);
  elements.status.hidden = true;
  elements.weatherContent.hidden = false;
  elements.unitToggle.textContent = state.unit === "celsius" ? "°C" : "°F";
  elements.locationName.textContent = state.place.name;
  elements.currentDate.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date(current.time));
  elements.currentTemp.textContent = temperature(current.temperature_2m);
  elements.condition.textContent = condition;
  elements.feelsLike.textContent = `Feels like ${temperature(current.apparent_temperature)}`;
  elements.weatherArt.textContent = icon;
  elements.wind.textContent = `${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}`;
  elements.humidity.textContent = `${current.relative_humidity_2m}%`;
  elements.precipitation.textContent = `${current.precipitation} ${units.precipitation}`;
  elements.uvIndex.textContent = `${Math.round(daily.uv_index_max[0])} · ${uvLabel(daily.uv_index_max[0])}`;
  elements.updatedAt.textContent = `Updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
  renderHourly(hourly, current.time);
  renderDaily(daily);
}

function renderHourly(hourly, currentTime) {
  const currentHour = new Date(currentTime).getTime();
  const start = hourly.time.findIndex((time) => new Date(time).getTime() >= currentHour);
  elements.hourlyForecast.innerHTML = hourly.time.slice(start, start + 24).map((time, offset) => {
    const i = start + offset;
    const [, icon] = describeWeather(hourly.weather_code[i], hourly.is_day[i]);
    const label = offset === 0 ? "Now" : new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(new Date(time));
    return `<article class="hour ${offset === 0 ? "now" : ""}"><span class="time">${label}</span><span class="icon">${icon}</span><strong>${temperature(hourly.temperature_2m[i])}</strong><span class="rain">${hourly.precipitation_probability[i] ?? 0}% rain</span></article>`;
  }).join("");
}

function renderDaily(daily) {
  elements.dailyForecast.innerHTML = daily.time.map((time, i) => {
    const [, icon] = describeWeather(daily.weather_code[i]);
    const name = i === 0 ? "Today" : new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${time}T12:00`));
    return `<article class="day"><span class="day-name">${name}</span><span class="day-icon">${icon}</span><span class="rain">${daily.precipitation_probability_max[i] ?? 0}%</span><span class="temps"><strong>${temperature(daily.temperature_2m_max[i])}</strong><span class="low">${temperature(daily.temperature_2m_min[i])}</span></span></article>`;
  }).join("");
}

function uvLabel(value) {
  if (value < 3) return "Low";
  if (value < 6) return "Moderate";
  if (value < 8) return "High";
  if (value < 11) return "Very high";
  return "Extreme";
}

let searchTimer;
elements.searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const query = elements.searchInput.value.trim();
  if (query.length < 2) return hideResults();
  searchTimer = setTimeout(() => searchPlaces(query), 300);
});

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const first = elements.searchResults.querySelector("button");
  if (first) first.click();
});

async function searchPlaces(query) {
  try {
    const data = await requestJson(`${API.geocode}?${new URLSearchParams({ name: query, count: "6", language: navigator.language.split("-")[0], format: "json" })}`);
    if (!data.results?.length) {
      elements.searchResults.innerHTML = '<div class="result"><span>No places found</span></div>';
    } else {
      elements.searchResults.innerHTML = data.results.map((place, i) => `<button type="button" class="result" data-index="${i}"><strong>${escapeHtml(place.name)}</strong><span>${escapeHtml([place.admin1, place.country].filter(Boolean).join(", "))}</span></button>`).join("");
      elements.searchResults.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
        const place = data.results[Number(button.dataset.index)];
        hideResults();
        elements.searchInput.value = "";
        loadForecast({ name: [place.name, place.country_code].filter(Boolean).join(", "), latitude: place.latitude, longitude: place.longitude });
      }));
    }
    elements.searchResults.hidden = false;
  } catch { hideResults(); }
}

function hideResults() { elements.searchResults.hidden = true; elements.searchResults.innerHTML = ""; }
document.addEventListener("click", (event) => { if (!elements.searchForm.contains(event.target) && !elements.searchResults.contains(event.target)) hideResults(); });

elements.unitToggle.addEventListener("click", () => {
  state.unit = state.unit === "celsius" ? "fahrenheit" : "celsius";
  localStorage.setItem("weather-unit", state.unit);
  if (state.place) loadForecast(state.place);
});

elements.locateButton.addEventListener("click", useCurrentLocation);
function useCurrentLocation() {
  if (!navigator.geolocation) return showStatus("Location is not supported by this browser. Search for your city instead.", true);
  showStatus("Finding your location…");
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    let name = "Current location";
    try {
      const place = await requestJson(`${API.reverse}?${new URLSearchParams({ latitude: coords.latitude, longitude: coords.longitude, localityLanguage: "en" })}`);
      name = place.city || place.locality || place.principalSubdivision || name;
    } catch { /* Forecast still works if reverse geocoding is unavailable. */ }
    loadForecast({ name, latitude: coords.latitude, longitude: coords.longitude });
  }, () => showStatus("Location access was blocked. Search for your city instead.", true), { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
}

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
if (state.place) loadForecast(state.place); else useCurrentLocation();
