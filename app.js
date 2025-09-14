// ===== CONFIG =====
const OPENWEATHER_API_KEY = "bfc0ebe1289a2a3a51b95c8ec9b07510"; // Replace with your OpenWeather API key

// ===== STATE =====
let state = { units: 'metric', lastCity: null, lastCoords: null };

// ===== DOM =====
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const messageEl = document.getElementById('message');
const weatherSection = document.getElementById('weatherSection');
const cityNameEl = document.getElementById('cityName');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const currentIcon = document.getElementById('currentIcon');
const forecastEl = document.getElementById('forecast');
const updateTimeEl = document.getElementById('updateTime');
const sunTimesEl = document.getElementById('sunTimes');
const addFavBtn = document.getElementById('addFavBtn');
const favoritesListEl = document.getElementById('favoritesList');
const clearFavsBtn = document.getElementById('clearFavs');
const refreshFavsBtn = document.getElementById('refreshFavs');
const cBtn = document.getElementById('cBtn');
const fBtn = document.getElementById('fBtn');

// ===== HELPERS =====
function showMessage(msg, type='info'){ messageEl.innerHTML = msg ? `<div class="${type==='error'?'error':''}">${msg}</div>` : '' }
function convertTemp(c){ return state.units==='metric' ? Math.round(c)+'°C' : Math.round(c*9/5+32)+'°F'; }
function convertWind(m){ return state.units==='metric' ? m.toFixed(1)+' m/s' : (m*2.2369).toFixed(1)+' mph'; }
function formatDate(unix, offset){ const d=new Date((unix+offset)*1000); return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}) }

// ===== API =====
async function geocodeCity(city){
  const url=`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
  const res=await fetch(url); const data=await res.json();
  if(!data.length) throw new Error('City not found'); return data[0];
}
async function fetchWeather(lat,lon){
  const url=`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly,alerts&appid=${OPENWEATHER_API_KEY}`;
  const res=await fetch(url); return await res.json();
}

// ===== RENDER =====
function renderWeather(data, city){
  state.lastWeatherData=data; state.lastCity=city;
  weatherSection.style.display='block';
  const tz=data.timezone_offset;
  const cur=data.current;
  cityNameEl.textContent=city;
  tempEl.textContent=convertTemp(cur.temp);
  descEl.textContent=cur.weather[0].description;
  humidityEl.textContent=cur.humidity;
  windEl.textContent=convertWind(cur.wind_speed);
  currentIcon.src=`https://openweathermap.org/img/wn/${cur.weather[0].icon}@4x.png`;
  updateTimeEl.textContent="Updated: "+new Date((cur.dt+tz)*1000).toLocaleString();
  sunTimesEl.textContent=` • Sunrise: ${new Date((cur.sunrise+tz)*1000).toLocaleTimeString()} • Sunset: ${new Date((cur.sunset+tz)*1000).toLocaleTimeString()}`;
  forecastEl.innerHTML='';
  data.daily.slice(1,6).forEach(d=>{
    forecastEl.innerHTML+=`
      <div class="day">
        <div>${formatDate(d.dt,tz)}</div>
        <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png"/>
        <div>${d.weather[0].description}</div>
        <div>Min ${convertTemp(d.temp.min)}</div>
        <div>Max ${convertTemp(d.temp.max)}</div>
      </div>`;
  });
}

// ===== SEARCH FLOW =====
async function searchCity(city){
  if(!city) return showMessage('Enter city name','error');
  try{
    showMessage('Loading...');
    const geo=await geocodeCity(city);
    const weather=await fetchWeather(geo.lat,geo.lon);
    renderWeather(weather, geo.name+', '+geo.country);
    showMessage('');
  }catch(e){ showMessage(e.message,'error'); }
}

// ===== FAVORITES =====
function loadFavs(){ return JSON.parse(localStorage.getItem('favs')||'[]'); }
function saveFavs(f){ localStorage.setItem('favs',JSON.stringify(f)); renderFavs(); }
function addFav(){ if(!state.lastCity) return; const favs=loadFavs(); if(!favs.includes(state.lastCity)){ favs.push(state.lastCity); saveFavs(favs);} }
function renderFavs(){ favoritesListEl.innerHTML=''; const favs=loadFavs(); if(!favs.length) return favoritesListEl.innerHTML='<div class="muted">No favorites</div>'; favs.forEach(c=>{ favoritesListEl.innerHTML+=`<div class="fav-item"><span>${c}</span><button onclick="searchCity('${c}')">Show</button></div>` }) }

// ===== EVENTS =====
searchBtn.onclick=()=>searchCity(searchInput.value.trim());
searchInput.onkeydown=e=>{ if(e.key==='Enter') searchCity(searchInput.value.trim()); };
geoBtn.onclick=()=>navigator.geolocation.getCurrentPosition(async p=>{ const w=await fetchWeather(p.coords.latitude,p.coords.longitude); renderWeather(w,`Lat ${p.coords.latitude.toFixed(2)}, Lon ${p.coords.longitude.toFixed(2)}`); });
addFavBtn.onclick=addFav; clearFavsBtn.onclick=()=>{localStorage.removeItem('favs');renderFavs();}; refreshFavsBtn.onclick=renderFavs;
cBtn.onclick=()=>{state.units='metric'; if(state.lastWeatherData) renderWeather(state.lastWeatherData,state.lastCity)};
fBtn.onclick=()=>{state.units='imperial'; if(state.lastWeatherData) renderWeather(state.lastWeatherData,state.lastCity)};

// ===== INIT =====
renderFavs();
