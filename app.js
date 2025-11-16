const API_KEY = "7ded80d91f2b280ec979100cc8bbba94";
const API_BASE = "https://api.openweathermap.org/data/2.5";
const LANG = "pl";
const UNITS = "metric";
const cityInput = document.getElementById("cityInput");
const weatherBtn = document.getElementById("weatherBtn");
const msg = document.getElementById("msg");
const currentWeatherEl = document.getElementById("currentWeather");
const forecastSummaryEl = document.getElementById("forecastSummary");
const forecastTableEl = document.getElementById("forecastTable");
cityInput.value = localStorage.getItem("labd:lastCity") || "";
function setMsg(text, type = "") {
    msg.textContent = text || "";
    msg.className = "msg" + (type ? " " + type : "");
}
function formatTemp(t) { return `${Math.round(t)}°C`; }
function formatWind(ws) { return `${Math.round(ws)} m/s`; }
function iconUrl(code) { return `https://openweathermap.org/img/wn/${code}@2x.png`; }
function toLocal(dt) { return new Date(dt * 1000).toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month:"2-digit" }); }
function toLocalDate(dt) { return new Date(dt * 1000).toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month:"2-digit" }); }
class SimpleTable {
    constructor(columns, rows) { this.columns = columns; this.rows = rows; }
    toHTML() {
        const thead = `<thead><tr>${this.columns.map(c => `<th>${c.label}</th>`).join("")}</tr></thead>`;
        const tbody = `<tbody>${this.rows.map(r => `<tr>${this.columns.map(c => `<td>${r[c.key] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>`;
        return `<table class="table">${thead}${tbody}</table>`;
    }
}
function loadCurrentWeather(city) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${UNITS}&lang=${LANG}`;
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                try {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const data = JSON.parse(xhr.responseText);
                        console.log("[XHR current] response:", data);
                        resolve(data);
                    } else {
                        reject(new Error(`Błąd XHR: ${xhr.status} ${xhr.statusText}`));
                    }
                } catch (e) { reject(e); }
            }
        };
        xhr.onerror = () => reject(new Error("Błąd sieci XHR"));
        xhr.send();
    });
}
async function loadForecast(city) {
    const url = `${API_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${UNITS}&lang=${LANG}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`Błąd Fetch: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log("[Fetch forecast] response:", data);
    return data;
}
function renderCurrent(data) {
    if (!data || !data.weather || !data.weather[0]) {
        currentWeatherEl.innerHTML = "<p>Brak danych.</p>";
        return;
    }
    const w = data.weather[0];
    const t = data.main?.temp;
    const feels = data.main?.feels_like;
    const hum = data.main?.humidity;
    const wind = data.wind?.speed;
    const icon = w.icon;
    currentWeatherEl.innerHTML = `
    <img class="icon" src="${iconUrl(icon)}" alt="${w.description}" />
    <div>
      <div class="meta">
        <span class="kv"><span class="k">Miasto:</span> <span class="v">${data.name}</span></span>
        <span class="kv"><span class="k">Temp:</span> <span class="v">${formatTemp(t)}</span></span>
        <span class="kv"><span class="k">Odczuwalna:</span> <span class="v">${formatTemp(feels)}</span></span>
        <span class="kv"><span class="k">Wiatr:</span> <span class="v">${formatWind(wind)}</span></span>
        <span class="kv"><span class="k">Wilgotność:</span> <span class="v">${hum}%</span></span>
      </div>
      <div class="desc">${w.description}</div>
    </div>
  `;
}
function groupDaily(list) {
    const byDay = {};
    for (const item of list) {
        const d = new Date(item.dt * 1000);
        const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push(item);
    }
    const days = Object.keys(byDay).sort().slice(0,5);
    return days.map(k => {
        const arr = byDay[k];
        let tmin = Infinity, tmax = -Infinity, windSum = 0;
        let pick = arr[0];
        for (const it of arr) {
            const t = it.main?.temp;
            if (typeof t === "number") {
                if (t < tmin) tmin = t;
                if (t > tmax) tmax = t;
            }
            windSum += (it.wind?.speed || 0);
        }
        const midday = arr.find(it => {
            const h = new Date(it.dt * 1000).getHours();
            return h === 12 || h === 15;
        });
        if (midday) pick = midday;
        const windAvg = windSum / arr.length;
        const w = pick.weather?.[0];
        return {
            dt: pick.dt,
            dateLabel: toLocalDate(pick.dt),
            tempMin: formatTemp(tmin),
            tempMax: formatTemp(tmax),
            windAvg: formatWind(windAvg),
            desc: w?.description ?? "-",
            icon: w?.icon ?? "01d",
            main: w?.main ?? ""
        };
    });
}
function renderForecast(data) {
    if (!data || !Array.isArray(data.list)) {
        forecastSummaryEl.innerHTML = "<p>Brak danych prognozy.</p>";
        forecastTableEl.innerHTML = "";
        return;
    }
    const daily = groupDaily(data.list);
    const cards = daily.map(d => `
    <div class="card">
      <div class="when">${d.dateLabel}</div>
      <div class="t">${d.tempMin} / ${d.tempMax}</div>
      <div class="desc">${d.desc}</div>
    </div>
  `).join("");
    forecastSummaryEl.innerHTML = cards;
    const rows = daily.map(d => ({
        date: d.dateLabel,
        tmin: d.tempMin,
        tmax: d.tempMax,
        wind: d.windAvg,
        desc: d.desc,
        icon: `<img src="${iconUrl(d.icon)}" alt="${d.main}" width="32" height="32" />`,
    }));
    const table = new SimpleTable(
        [
            { key: "date", label: "Dzień" },
            { key: "tmin", label: "Min" },
            { key: "tmax", label: "Max" },
            { key: "wind", label: "Wiatr (avg)" },
            { key: "desc", label: "Opis" },
            { key: "icon", label: "Ikona" },
        ],
        rows
    );
    forecastTableEl.innerHTML = table.toHTML();
}
async function onFetchWeather() {
    const city = (cityInput.value || "").trim();
    if (!city) { setMsg("Podaj nazwę miejscowości.", "err"); return; }
    localStorage.setItem("labd:lastCity", city);
    setMsg("Pobieram dane...", "ok");
    weatherBtn.disabled = true;
    currentWeatherEl.innerHTML = "";
    forecastSummaryEl.innerHTML = "";
    forecastTableEl.innerHTML = "";
    try {
        const current = await loadCurrentWeather(city);
        renderCurrent(current);
        const forecast = await loadForecast(city);
        renderForecast(forecast);
        setMsg("Gotowe.", "ok");
    } catch (e) {
        console.error(e);
        setMsg(`Błąd: ${e.message}`, "err");
    } finally {
        weatherBtn.disabled = false;
    }
}
weatherBtn.addEventListener("click", onFetchWeather);
cityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") onFetchWeather(); });
