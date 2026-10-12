'use strict';

/**
 * HELPERS
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;



/**
 * MOBILE NAVBAR
 */

const navbar = $("[data-navbar]");
const navToggler = $("[data-nav-toggler]");

const setNav = (open) => {
  navbar.classList.toggle("active", open);
  document.body.classList.toggle("nav-active", open);
  navToggler.setAttribute("aria-expanded", open);
  navToggler.querySelector("ion-icon").setAttribute("name", open ? "close-outline" : "menu-outline");
};

navToggler.addEventListener("click", () => setNav(!navbar.classList.contains("active")));
$$("[data-nav-link]").forEach(link => link.addEventListener("click", () => setNav(false)));



/**
 * HEADER & BACK TO TOP
 */

const header = $("[data-header]");
const backTopBtn = $("[data-back-top-btn]");

const onScroll = () => {
  const scrolled = window.scrollY > 24;
  header.classList.toggle("active", scrolled);
  backTopBtn.classList.toggle("active", window.scrollY > 600);
};

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Highlight the nav link for the section in view
const navLinks = $$("[data-nav-link]");
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
  });
}, { rootMargin: "-45% 0px -50% 0px" });

navLinks.forEach(link => {
  const section = $(link.getAttribute("href"));
  if (section) sectionObserver.observe(section);
});



/**
 * TOASTS
 */

const toastRegion = $("[data-toasts]");

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", type === "success" ? "status" : "alert");

  const icon = document.createElement("ion-icon");
  icon.setAttribute("name", type === "success" ? "checkmark-circle" : "alert-circle");
  icon.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.textContent = message;

  toast.append(icon, text);
  toastRegion.append(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3200);
};



/**
 * NEWSLETTER
 */

const newsletter = $("[data-newsletter]");

newsletter.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = newsletter.elements.email;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showToast("You're subscribed to the daily climate briefing.");
    newsletter.reset();
  } else {
    showToast("Please enter a valid email address.", "error");
    email.focus();
  }
});



/**
 * WEATHER CODES (WMO)
 */

const WMO = {
  0: ["Clear sky", "clear"],
  1: ["Mostly clear", "partly"],
  2: ["Partly cloudy", "partly"],
  3: ["Overcast", "cloudy"],
  45: ["Fog", "fog"],
  48: ["Freezing fog", "fog"],
  51: ["Light drizzle", "drizzle"],
  53: ["Drizzle", "drizzle"],
  55: ["Heavy drizzle", "drizzle"],
  56: ["Freezing drizzle", "drizzle"],
  57: ["Freezing drizzle", "drizzle"],
  61: ["Light rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Freezing rain", "rain"],
  67: ["Freezing rain", "rain"],
  71: ["Light snow", "snow"],
  73: ["Snow", "snow"],
  75: ["Heavy snow", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Rain showers", "rain"],
  81: ["Rain showers", "rain"],
  82: ["Violent showers", "rain"],
  85: ["Snow showers", "snow"],
  86: ["Heavy snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm, hail", "storm"],
  99: ["Severe thunderstorm", "storm"]
};

const describe = (code) => WMO[code] || ["—", "cloudy"];

const skyFor = (kind, isDay) => ({
  clear: isDay ? "clear-day" : "clear-night",
  partly: isDay ? "clear-day" : "clear-night",
  cloudy: isDay ? "cloudy-day" : "cloudy-night",
  fog: "fog",
  drizzle: "rain",
  rain: "rain",
  snow: "snow",
  storm: "storm"
}[kind]);



/**
 * WEATHER ICONS (inline SVG, 64×64)
 */

const ICON_PARTS = {
  sun: `<g><circle cx="32" cy="32" r="11" fill="url(#gSun)"/>
        <g class="wx-sun-rays" stroke="#fbbf24" stroke-width="3" stroke-linecap="round">
          <path d="M32 9v6M32 49v6M9 32h6M49 32h6M15.7 15.7l4.2 4.2M44.1 44.1l4.2 4.2M15.7 48.3l4.2-4.2M44.1 19.9l4.2-4.2"/>
        </g></g>`,
  sunSmall: `<g transform="translate(-8 -8) scale(.82)"><circle cx="32" cy="32" r="11" fill="url(#gSun)"/>
        <g class="wx-sun-rays" stroke="#fbbf24" stroke-width="3" stroke-linecap="round">
          <path d="M32 11v5M11 32h5M17.2 17.2l3.6 3.6M46.8 17.2l-3.6 3.6M32 48v5"/>
        </g></g>`,
  moon: `<path d="M40 14a18 18 0 1 0 12 30 15 15 0 0 1-12-30z" fill="url(#gMoon)"/>`,
  moonSmall: `<path d="M26 8a13 13 0 1 0 9 21.6A10.8 10.8 0 0 1 26 8z" fill="url(#gMoon)"/>`,
  cloud: `<path class="wx-cloud" d="M20 48h26a11 11 0 0 0 1.4-21.9A15 15 0 0 0 19 30a9 9 0 0 0 1 18z" fill="url(#gCloud)"/>`,
  cloudDark: `<path class="wx-cloud" d="M20 44h26a11 11 0 0 0 1.4-21.9A15 15 0 0 0 19 26a9 9 0 0 0 1 18z" fill="url(#gCloudDark)"/>`,
  rain: `<g stroke="#60a5fa" stroke-width="2.6" stroke-linecap="round">
          <path class="wx-drop" d="M24 50l-2 6"/><path class="wx-drop" d="M33 50l-2 6"/><path class="wx-drop" d="M42 50l-2 6"/></g>`,
  drizzle: `<g fill="#93c5fd"><circle class="wx-drop" cx="25" cy="53" r="1.8"/><circle class="wx-drop" cx="33" cy="53" r="1.8"/><circle class="wx-drop" cx="41" cy="53" r="1.8"/></g>`,
  snow: `<g fill="#e0f2fe"><circle class="wx-flake" cx="24" cy="53" r="2.4"/><circle class="wx-flake" cx="33" cy="53" r="2.4"/><circle class="wx-flake" cx="42" cy="53" r="2.4"/></g>`,
  bolt: `<path class="wx-bolt" d="M34 42l-7 11h6l-3 9 10-13h-6l4-7z" fill="#facc15"/>`,
  fog: `<g stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" opacity=".9">
          <path d="M14 46h36"/><path d="M18 53h28" opacity=".7"/></g>`
};

let iconUid = 0;

const weatherIcon = (code, isDay = true) => {
  const kind = describe(code)[1];
  const id = ++iconUid;
  const p = ICON_PARTS;
  let body;

  switch (kind) {
    case "clear": body = isDay ? p.sun : p.moon; break;
    case "partly": body = (isDay ? p.sunSmall : p.moonSmall) + p.cloud; break;
    case "cloudy": body = p.cloud; break;
    case "fog": body = p.cloudDark + p.fog; break;
    case "drizzle": body = p.cloudDark + p.drizzle; break;
    case "rain": body = p.cloudDark + p.rain; break;
    case "snow": body = p.cloud + p.snow; break;
    case "storm": body = p.cloudDark + p.bolt; break;
    default: body = p.cloud;
  }

  // Gradient ids are made unique per icon so multiple SVGs can coexist
  const defs = `<defs>
    <radialGradient id="gSun${id}" cx=".4" cy=".4"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></radialGradient>
    <linearGradient id="gMoon${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f5f9"/><stop offset="1" stop-color="#94a3b8"/></linearGradient>
    <linearGradient id="gCloud${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient>
    <linearGradient id="gCloudDark${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbd5e1"/><stop offset="1" stop-color="#64748b"/></linearGradient>
  </defs>`;

  return `<svg viewBox="0 0 64 64" aria-hidden="true">${defs}${body.replace(/url\(#(g\w+)\)/g, `url(#$1${id})`)}</svg>`;
};



/**
 * UNITS & FORMATTING
 */

const units = {
  current: store.get("unit", "c"),
  temp(c) { return Math.round(this.current === "f" ? c * 9 / 5 + 32 : c); },
  wind(kmh) { return this.current === "f" ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`; },
  dist(m) {
    if (this.current === "f") return `${(m / 1609.34).toFixed(m < 16000 ? 1 : 0)} mi`;
    return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
  },
  precip(mm) { return this.current === "f" ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`; }
};

// Open-Meteo returns local times without an offset. Treat them as UTC
// and always read them back with UTC getters so the browser's own zone never interferes.
const toLocalMs = (iso) => Date.parse(`${iso}Z`);

const fmtHour = (ms) => {
  const h = new Date(ms).getUTCHours();
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
};

const fmtClock = (ms) => {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtDate = (ms) => {
  const d = new Date(ms);
  return `${DAY_NAMES[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const compassPoint = (deg) => COMPASS[Math.round(deg / 22.5) % 16];



/**
 * CLIMATE INDICES
 */

// NOAA Rothfusz heat index, computed in °F, returned in °C
const heatIndexC = (tC, rh) => {
  const T = tC * 9 / 5 + 32;
  let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + rh * 0.094);

  if (hi >= 80) {
    hi = -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh - 0.00683783 * T * T
      - 0.05481717 * rh * rh + 0.00122874 * T * T * rh + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;
    if (rh < 13 && T >= 80 && T <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    else if (rh > 85 && T >= 80 && T <= 87) hi += ((rh - 85) / 10) * ((87 - T) / 5);
  }

  return Math.max((hi - 32) * 5 / 9, tC);
};

// PAGASA heat index classification
const heatLevel = (c) => {
  if (c >= 52) return { label: "Extreme danger", color: "#a21caf", note: "Heat stroke is imminent. Stay indoors and keep cool." };
  if (c >= 42) return { label: "Danger", color: "#ef4444", note: "Heat cramps and exhaustion likely; heat stroke probable with continued exposure." };
  if (c >= 33) return { label: "Extreme caution", color: "#fb923c", note: "Heat cramps and exhaustion possible. Limit time outdoors and hydrate." };
  if (c >= 27) return { label: "Caution", color: "#facc15", note: "Fatigue is possible with prolonged exposure and activity." };
  return { label: "Comfortable", color: "#4ade80", note: "No heat-related risk expected." };
};

const aqiLevel = (v) => {
  if (v <= 50) return { label: "Good", note: "Air quality is satisfactory and poses little or no risk." };
  if (v <= 100) return { label: "Moderate", note: "Unusually sensitive people should limit prolonged exertion outdoors." };
  if (v <= 150) return { label: "Unhealthy for sensitive groups", note: "Children, older adults and people with lung disease should reduce exertion." };
  if (v <= 200) return { label: "Unhealthy", note: "Everyone may begin to experience health effects. Limit time outside." };
  if (v <= 300) return { label: "Very unhealthy", note: "Health alert: everyone may experience more serious effects." };
  return { label: "Hazardous", note: "Emergency conditions. Avoid all outdoor activity." };
};

const uvLevel = (v) => {
  if (v < 3) return { label: "Low", note: "No protection needed for most people." };
  if (v < 6) return { label: "Moderate", note: "Seek shade during midday hours." };
  if (v < 8) return { label: "High", note: "Wear sunscreen, a hat and sunglasses." };
  if (v < 11) return { label: "Very high", note: "Avoid the sun between 10 AM and 4 PM." };
  return { label: "Extreme", note: "Unprotected skin can burn in minutes." };
};



/**
 * WEATHER STATE & FETCHING
 */

const DEFAULT_PLACE = { name: "Lipa, Batangas", lat: 13.9411, lon: 121.1631 };

const state = {
  place: store.get("place", DEFAULT_PLACE),
  data: null,
  aqi: null,
  refreshTimer: null
};

const FORECAST_PARAMS = new URLSearchParams({
  current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m",
  hourly: "temperature_2m,precipitation_probability,weather_code,is_day,uv_index,visibility,pressure_msl",
  daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
  timezone: "auto",
  forecast_days: "10"
});

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const nowPanel = $("[data-now]");

const loadWeather = async () => {
  const { lat, lon } = state.place;
  nowPanel.classList.toggle("is-loading", !state.data);

  try {
    const [data, aqi] = await Promise.all([
      fetchJSON(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${FORECAST_PARAMS}`),
      fetchJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&timezone=auto`)
        .catch(() => null)
    ]);

    state.data = data;
    state.aqi = aqi;
    state.fetchedAt = Date.now();
    render();
  } catch (error) {
    console.error("Weather request failed:", error);
    $("[data-updated]").textContent = "Offline — retrying soon";
    showToast("Couldn't reach the weather service. Retrying shortly.", "error");
  } finally {
    nowPanel.classList.remove("is-loading");
  }

  clearTimeout(state.refreshTimer);
  state.refreshTimer = setTimeout(loadWeather, 10 * 60 * 1000);
};

const setPlace = (place) => {
  state.place = place;
  store.set("place", place);
  state.data = null;
  loadWeather();
};



/**
 * RENDER
 */

const setText = (sel, text) => { const el = $(sel); if (el) el.textContent = text; };

const render = () => {
  const d = state.data;
  if (!d) return;

  const c = d.current;
  const offsetMs = d.utc_offset_seconds * 1000;
  const localNow = Date.now() + offsetMs;
  const [condition, kind] = describe(c.weather_code);
  const isDay = !!c.is_day;

  // Index of the current hour in the hourly arrays
  const hourTimes = d.hourly.time.map(toLocalMs);
  let hIdx = hourTimes.findIndex(t => t > localNow) - 1;
  if (hIdx < 0) hIdx = 0;

  // Sky
  const sky = skyFor(kind, isDay);
  document.body.dataset.sky = sky;
  particles.setMode(sky);
  $('meta[name="theme-color"]').setAttribute("content", getComputedStyle(document.body).getPropertyValue("--sky-top").trim());

  // Hero
  setText("[data-location]", state.place.name);
  setText("[data-local-time]", `${fmtDate(localNow)} · ${fmtClock(localNow)}`);
  setText("[data-updated]", "Updated just now");
  setText("[data-temp]", units.temp(c.temperature_2m));
  setText("[data-condition]", condition);
  setText("[data-high]", `${units.temp(d.daily.temperature_2m_max[0])}°`);
  setText("[data-low]", `${units.temp(d.daily.temperature_2m_min[0])}°`);

  setText("[data-summary]", buildSummary(d, hIdx));
  document.title = `${units.temp(c.temperature_2m)}° ${condition} · ${state.place.name} — Climate`;

  // Feels like + heat index category
  const hi = heatIndexC(c.temperature_2m, c.relative_humidity_2m);
  const heat = heatLevel(hi);
  const feelsDiff = c.apparent_temperature - c.temperature_2m;
  setText("[data-feels]", `${units.temp(c.apparent_temperature)}°`);
  setText("[data-heat-label]", hi >= 27 ? `Heat index: ${heat.label}` : "");
  setText("[data-heat-note]", Math.abs(feelsDiff) < 1.5
    ? "Similar to the actual temperature."
    : feelsDiff > 0
      ? (hi >= 33 ? heat.note : "Humidity is making it feel warmer.")
      : "Wind is making it feel cooler.");

  // Air quality
  const aqiVal = state.aqi?.current?.us_aqi;
  if (Number.isFinite(aqiVal)) {
    const aq = aqiLevel(aqiVal);
    setText("[data-aqi-value]", Math.round(aqiVal));
    setText("[data-aqi-label]", aq.label);
    setText("[data-aqi-note]", `${aq.note} PM2.5 is ${state.aqi.current.pm2_5?.toFixed(1) ?? "—"} µg/m³.`);
    $("[data-aqi-thumb]").style.setProperty("--pos", `${clamp(aqiVal / 300, 0, 1) * 100}%`);
  } else {
    setText("[data-aqi-value]", "—");
    setText("[data-aqi-label]", "Unavailable");
    setText("[data-aqi-note]", "No air quality data for this location.");
  }

  renderAlert(d, hIdx, hi, heat);
  renderHourly(d, hIdx, hourTimes);
  renderDaily(d, c.temperature_2m);
  renderMetrics(d, hIdx, localNow);
};

const buildSummary = (d, hIdx) => {
  const h = d.hourly;
  const parts = [];

  for (let i = hIdx; i < hIdx + 12 && i < h.time.length; i++) {
    if ((h.precipitation_probability[i] ?? 0) >= 50) {
      const [label] = describe(h.weather_code[i]);
      const when = i === hIdx ? "right now" : `around ${fmtHour(toLocalMs(h.time[i]))}`;
      parts.push(`${/storm/i.test(label) ? "Thunderstorms" : "Rain"} likely ${when}.`);
      break;
    }
  }

  if (!parts.length) parts.push(`${describe(d.current.weather_code)[0]} conditions expected for the next few hours.`);

  parts.push(`Wind gusts are up to ${units.wind(d.current.wind_gusts_10m)}.`);

  return parts.join(" ");
};

const alertEl = $("[data-alert]");

const renderAlert = (d, hIdx, hi, heat) => {
  const h = d.hourly;
  let alert = null;

  const stormHour = h.weather_code.slice(hIdx, hIdx + 12).findIndex(code => code >= 95);
  const heavyRainHour = h.weather_code.slice(hIdx, hIdx + 12).findIndex(code => code === 65 || code === 82);

  if (stormHour !== -1) {
    alert = {
      title: "Thunderstorm advisory",
      text: `Thunderstorms possible ${stormHour === 0 ? "now" : `from about ${fmtHour(toLocalMs(h.time[hIdx + stormHour]))}`}. Stay indoors and avoid open areas.`,
      color: "#ffd60a"
    };
  } else if (hi >= 42) {
    alert = { title: `Heat index ${heat.label.toLowerCase()} — ${units.temp(hi)}°`, text: heat.note, color: "#ff9f0a" };
  } else if (heavyRainHour !== -1) {
    alert = { title: "Heavy rainfall advisory", text: "Heavy rain expected within 12 hours. Watch for flooding in low-lying areas.", color: "#8fd3ff" };
  }

  alertEl.hidden = !alert;
  if (!alert) return;
  alertEl.style.setProperty("--alert-color", alert.color);
  setText("[data-alert-title]", alert.title);
  setText("[data-alert-text]", alert.text);
};

const SUN_ICON = {
  rise: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 44a18 18 0 0 1 36 0z" fill="#ffd60a"/><path d="M8 50h48" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M32 8v10M26 14l6-6 6 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  set: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 44a18 18 0 0 1 36 0z" fill="#ff9f0a"/><path d="M8 50h48" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M32 8v10M26 12l6 6 6-6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

const renderHourly = (d, hIdx, hourTimes) => {
  const h = d.hourly;
  const count = Math.min(25, h.time.length - hIdx);
  const start = hourTimes[hIdx];
  const end = hourTimes[hIdx + count - 1];

  // Sunrise / sunset events that fall inside the window, like Apple Weather
  const events = [];
  d.daily.sunrise.forEach(iso => events.push({ t: toLocalMs(iso), kind: "rise" }));
  d.daily.sunset.forEach(iso => events.push({ t: toLocalMs(iso), kind: "set" }));
  const inWindow = events.filter(e => e.t > start && e.t < end).sort((a, b) => a.t - b.t);

  const items = [];
  for (let k = 0; k < count; k++) {
    const i = hIdx + k;
    const pop = h.precipitation_probability[i] ?? 0;
    items.push({
      t: hourTimes[i],
      html: `
        <div class="hour">
          <span class="hour-time">${k === 0 ? "Now" : fmtHour(hourTimes[i])}</span>
          <span class="hour-icon-wrap">
            <span class="hour-icon">${weatherIcon(h.weather_code[i], !!h.is_day[i])}</span>
            ${pop >= 20 ? `<span class="hour-pop">${pop}%</span>` : ""}
          </span>
          <span class="hour-temp">${units.temp(h.temperature_2m[i])}°</span>
        </div>`
    });
  }

  inWindow.forEach(e => items.push({
    t: e.t,
    html: `
      <div class="hour">
        <span class="hour-time">${fmtClock(e.t).replace(" ", " ")}</span>
        <span class="hour-icon-wrap"><span class="hour-icon">${SUN_ICON[e.kind]}</span></span>
        <span class="hour-temp">${e.kind === "rise" ? "Sunrise" : "Sunset"}</span>
      </div>`
  }));

  items.sort((a, b) => a.t - b.t);
  $("[data-hourly]").innerHTML = items.map(item => item.html).join("");
};

const tempColor = (c) => {
  const stops = [[-10, "#5e5ce6"], [0, "#64d2ff"], [10, "#5ac8fa"], [17, "#30d158"], [23, "#ffd60a"], [28, "#ff9f0a"], [34, "#ff453a"]];
  for (let i = stops.length - 1; i >= 0; i--) if (c >= stops[i][0]) return stops[i][1];
  return stops[0][1];
};

const renderDaily = (d, currentTemp) => {
  const dl = d.daily;
  const lo = Math.min(...dl.temperature_2m_min);
  const hi = Math.max(...dl.temperature_2m_max);
  const span = Math.max(hi - lo, 1);
  const pct = (v) => `${((v - lo) / span) * 100}%`;

  $("[data-daily]").innerHTML = dl.time.map((iso, i) => {
    const ms = toLocalMs(`${iso}T12:00`);
    const name = i === 0 ? "Today" : DAY_NAMES[new Date(ms).getUTCDay()];
    const min = dl.temperature_2m_min[i];
    const max = dl.temperature_2m_max[i];
    const pop = dl.precipitation_probability_max[i] ?? 0;
    const nowDot = i === 0 ? `<span class="range-now" style="--now:${pct(clamp(currentTemp, min, max))}"></span>` : "";

    return `
      <li class="day">
        <span class="day-name">${name}</span>
        <span class="day-icon-wrap" title="${describe(dl.weather_code[i])[0]}">
          <span class="day-icon">${weatherIcon(dl.weather_code[i], true)}</span>
          ${pop >= 20 ? `<span class="day-pop">${pop}%</span>` : ""}
        </span>
        <span class="day-min">${units.temp(min)}°</span>
        <span class="range"><span class="range-fill" style="--from:${pct(min)};--to:${pct(max)};--c1:${tempColor(min)};--c2:${tempColor(max)}"></span>${nowDot}</span>
        <span class="day-max">${units.temp(max)}°</span>
      </li>`;
  }).join("");
};

const renderMetrics = (d, hIdx, localNow) => {
  const c = d.current;
  const h = d.hourly;
  const dl = d.daily;

  // UV
  const uv = h.uv_index[hIdx] ?? 0;
  const uvMax = dl.uv_index_max[0] ?? 0;
  setText("[data-uv]", Math.round(uv));
  setText("[data-uv-label]", uvLevel(uv).label);
  setText("[data-uv-note]", uv < uvMax - 0.5
    ? `Peaks at ${Math.round(uvMax)} later today. ${uvLevel(uvMax).note}`
    : uvLevel(uv).note);
  $("[data-uv-thumb]").style.setProperty("--pos", `${clamp(uv / 11, 0, 1) * 100}%`);

  // Wind — needle points the way the wind is blowing
  const [speed, unit] = units.wind(c.wind_speed_10m).split(" ");
  setText("[data-wind-speed]", speed);
  setText("[data-wind-unit]", unit);
  setText("[data-wind-note]", `From the ${compassPoint(c.wind_direction_10m)}, gusts to ${units.wind(c.wind_gusts_10m)}.`);
  $("[data-compass-needle]").style.transform = `rotate(${(c.wind_direction_10m + 180) % 360}deg)`;

  // Humidity
  setText("[data-humidity]", `${c.relative_humidity_2m}%`);
  setText("[data-dew]", `The dew point is ${units.temp(c.dew_point_2m)}° right now.`);

  // Pressure gauge (960–1060 hPa across 270°) + 3h trend
  const p3 = h.pressure_msl[Math.max(0, hIdx - 3)];
  const trend = c.pressure_msl - p3;
  setText("[data-pressure]", Math.round(c.pressure_msl).toLocaleString());
  $("[data-gauge-needle]").style.transform = `rotate(${-135 + clamp((c.pressure_msl - 960) / 100, 0, 1) * 270}deg)`;
  $("[data-pressure-arrow]").setAttribute("name", Math.abs(trend) < 0.6 ? "remove" : trend > 0 ? "arrow-up" : "arrow-down");
  setText("[data-pressure-note]", Math.abs(trend) < 0.6 ? "Steady over the last 3 hours." : `${trend > 0 ? "Rising" : "Falling"} over the last 3 hours.`);

  // Cloud cover
  const cloud = c.cloud_cover;
  const rainHours = h.precipitation_probability.slice(hIdx, hIdx + 24).filter(p => p >= 50).length;
  setText("[data-cloud]", `${cloud}%`);
  setText("[data-cloud-label]", cloud < 20 ? "Clear" : cloud < 50 ? "Partly cloudy" : cloud < 85 ? "Mostly cloudy" : "Overcast");
  setText("[data-cloud-note]", rainHours ? `Rain likely for ${rainHours} of the next 24 hours.` : "No rain likely in the next 24 hours.");

  // Visibility
  const vis = h.visibility[hIdx];
  if (Number.isFinite(vis)) {
    setText("[data-visibility]", units.dist(vis));
    setText("[data-visibility-note]", vis >= 10000 ? "It's perfectly clear right now." : vis >= 4000 ? "Light haze is affecting visibility." : "Poor visibility. Drive with care.");
  }

  // Precipitation
  setText("[data-precip]", units.precip(dl.precipitation_sum[0] ?? 0));
  const nextWet = dl.precipitation_sum.findIndex((v, i) => i > 0 && v >= 1);
  setText("[data-precip-note]", nextWet === -1
    ? "None expected in the next 10 days."
    : `${units.precip(dl.precipitation_sum[nextWet])} expected ${nextWet === 1 ? "tomorrow" : `on ${DAY_NAMES[new Date(toLocalMs(`${dl.time[nextWet]}T12:00`)).getUTCDay()]}`}.`);

  // Sun: show the next event big, the other in the note
  const rise = toLocalMs(dl.sunrise[0]);
  const set = toLocalMs(dl.sunset[0]);
  const beforeSunset = localNow < set;
  const nextRise = localNow < rise ? rise : toLocalMs(dl.sunrise[1]);
  setText("[data-sun-title]", beforeSunset && localNow >= rise ? "Sunset" : "Sunrise");
  setText("[data-sun-big]", fmtClock(beforeSunset && localNow >= rise ? set : nextRise));
  setText("[data-sun-note]", beforeSunset && localNow >= rise ? `Sunrise: ${fmtClock(rise)}` : `Sunset: ${fmtClock(set)}`);
  drawSunCurve(rise, set, localNow);
};

// A 24-hour sine curve; the sun crosses the horizon line at sunrise and sunset
const drawSunCurve = (rise, set, localNow) => {
  const dayStart = Math.floor(rise / 864e5) * 864e5;
  const f = (t) => ((t - dayStart) / 864e5 + 1) % 1;
  const noon = (f(rise) + f(set)) / 2;
  const mid = 36, amp = 28;
  const y = (x) => mid - amp * Math.cos(2 * Math.PI * (x - noon));

  let path = "";
  for (let i = 0; i <= 48; i++) {
    const x = i / 48;
    path += `${i ? "L" : "M"}${(x * 200).toFixed(1)},${y(x).toFixed(1)} `;
  }

  const horizon = y(f(rise));
  $("[data-sun-path]").setAttribute("d", path);
  const line = $(".sun-horizon");
  line.setAttribute("y1", horizon);
  line.setAttribute("y2", horizon);

  const now = f(localNow);
  const dot = $("[data-sun-dot]");
  dot.setAttribute("cx", now * 200);
  dot.setAttribute("cy", y(now));
  dot.classList.toggle("is-night", localNow < rise || localNow > set);
};

// Dial ticks (once): compass ring and a 270° pressure scale
(() => {
  const ticks = (from, to, step, majorEvery) => {
    let html = "";
    for (let a = from; a <= to; a += step) {
      const major = (a - from) % majorEvery === 0;
      const rad = (a - 90) * Math.PI / 180;
      const r1 = 54, r2 = major ? 46 : 49;
      html += `<line class="${major ? "major" : ""}" x1="${60 + r1 * Math.cos(rad)}" y1="${60 + r1 * Math.sin(rad)}" x2="${60 + r2 * Math.cos(rad)}" y2="${60 + r2 * Math.sin(rad)}"/>`;
    }
    return html;
  };
  $("[data-compass-ticks]").innerHTML = ticks(0, 357, 3, 30);
  $("[data-gauge-ticks]").innerHTML = ticks(-135, 135, 4.5, 270);
})();

// Keep the local clock ticking between refreshes
setInterval(() => {
  if (!state.data) return;
  const localNow = Date.now() + state.data.utc_offset_seconds * 1000;
  setText("[data-local-time]", `${fmtDate(localNow)} · ${fmtClock(localNow)}`);
  const mins = Math.round((Date.now() - state.fetchedAt) / 60000);
  setText("[data-updated]", mins < 1 ? "Updated just now" : `Updated ${mins} min ago`);
}, 30000);



/**
 * UNIT TOGGLE
 */

const unitButtons = $$("[data-unit]");

const syncUnitButtons = () => unitButtons.forEach(btn => {
  const active = btn.dataset.unit === units.current;
  btn.classList.toggle("is-active", active);
  btn.setAttribute("aria-pressed", active);
});

unitButtons.forEach(btn => btn.addEventListener("click", () => {
  units.current = btn.dataset.unit;
  store.set("unit", units.current);
  syncUnitButtons();
  render();
}));

syncUnitButtons();



/**
 * CITY SEARCH
 */

const searchForm = $("[data-search]");
const searchInput = $("[data-search-input]");
const searchResults = $("[data-search-results]");
let results = [];
let activeIndex = -1;

const closeResults = () => { searchResults.hidden = true; activeIndex = -1; };

const placeLabel = (r) => [r.name, r.admin1, r.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

const renderResults = () => {
  if (!results.length) {
    searchResults.innerHTML = `<li class="search-empty">No matching places</li>`;
  } else {
    searchResults.innerHTML = results.map((r, i) => {
      const [name, ...rest] = placeLabel(r);
      return `<li class="search-result" role="option" id="opt-${i}" data-index="${i}" aria-selected="${i === activeIndex}">
        <ion-icon name="location-outline" aria-hidden="true"></ion-icon>
        <span>${name}<small>${rest.join(", ")}</small></span>
      </li>`;
    }).join("");
  }
  searchResults.hidden = false;
};

const choose = (r) => {
  const [name, region] = placeLabel(r);
  setPlace({ name: region ? `${name}, ${region}` : name, lat: r.latitude, lon: r.longitude });
  searchInput.value = "";
  searchInput.blur();
  closeResults();
};

const runSearch = debounce(async (q) => {
  if (q.length < 2) { closeResults(); return; }
  try {
    const json = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
    if (searchInput.value.trim() !== q) return;
    results = json.results || [];
    activeIndex = results.length ? 0 : -1;
    renderResults();
  } catch (e) {
    closeResults();
  }
}, 250);

searchInput.addEventListener("input", () => runSearch(searchInput.value.trim()));

searchInput.addEventListener("keydown", (e) => {
  if (searchResults.hidden || !results.length) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = (activeIndex + (e.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
    renderResults();
  } else if (e.key === "Escape") {
    closeResults();
  }
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (results[activeIndex]) choose(results[activeIndex]);
});

searchResults.addEventListener("mousedown", (e) => {
  const item = e.target.closest("[data-index]");
  if (item) { e.preventDefault(); choose(results[Number(item.dataset.index)]); }
});

searchInput.addEventListener("blur", () => setTimeout(closeResults, 120));

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)) {
    e.preventDefault();
    searchInput.focus();
  }
});



/**
 * GEOLOCATION
 */

const locateBtn = $("[data-locate]");

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) { showToast("Location isn't supported in this browser.", "error"); return; }

  locateBtn.classList.add("is-loading");
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const lat = +coords.latitude.toFixed(4);
    const lon = +coords.longitude.toFixed(4);
    let name = "Current location";
    try {
      const geo = await fetchJSON(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      name = [geo.city || geo.locality, geo.principalSubdivision].filter(Boolean).join(", ") || name;
    } catch (e) { /* keep generic label */ }
    locateBtn.classList.remove("is-loading");
    setPlace({ name, lat, lon });
  }, () => {
    locateBtn.classList.remove("is-loading");
    showToast("Location permission was denied.", "error");
  }, { timeout: 10000, maximumAge: 300000 });
});



/**
 * SKY PARTICLES (rain, snow, stars)
 */

const particles = (() => {
  const canvas = $("[data-particles]");
  const ctx = canvas.getContext("2d");
  let mode = null;
  let items = [];
  let raf = null;
  let w = 0, h = 0, dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const spawn = () => {
    const area = (w * h) / 10000;
    if (mode === "rain" || mode === "storm") {
      items = Array.from({ length: Math.round(area * 1.4) }, () => ({ x: Math.random() * w, y: Math.random() * h, l: 10 + Math.random() * 14, v: 9 + Math.random() * 7 }));
    } else if (mode === "snow") {
      items = Array.from({ length: Math.round(area * 0.8) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.2, v: 0.5 + Math.random(), s: Math.random() * 6.28 }));
    } else if (mode === "clear-night" || mode === "cloudy-night") {
      items = Array.from({ length: Math.round(area * (mode === "clear-night" ? 0.9 : 0.3)) }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.7, r: Math.random() * 1.2 + 0.2, p: Math.random() * 6.28 }));
    } else {
      items = [];
    }
  };

  let flash = 0;

  const frame = (t) => {
    ctx.clearRect(0, 0, w, h);

    if (mode === "rain" || mode === "storm") {
      ctx.strokeStyle = "rgba(200, 220, 245, 0.32)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const p of items) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.l * 0.18, p.y + p.l);
        p.y += p.v; p.x -= p.v * 0.18;
        if (p.y > h) { p.y = -p.l; p.x = Math.random() * w * 1.1; }
      }
      ctx.stroke();

      if (mode === "storm") {
        if (flash <= 0 && Math.random() < 0.002) flash = 1;
        if (flash > 0) {
          ctx.fillStyle = `rgba(210, 200, 255, ${flash * 0.12})`;
          ctx.fillRect(0, 0, w, h);
          flash -= 0.04;
        }
      }
    } else if (mode === "snow") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (const p of items) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fill();
        p.s += 0.01;
        p.y += p.v;
        p.x += Math.sin(p.s) * 0.4;
        if (p.y > h) { p.y = -4; p.x = Math.random() * w; }
      }
    } else if (items.length) {
      for (const p of items) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + Math.sin(t / 900 + p.p) * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fill();
      }
    }

    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    cancelAnimationFrame(raf);
    if (!items.length) { ctx.clearRect(0, 0, w, h); return; }
    if (prefersReducedMotion) { frame(0); cancelAnimationFrame(raf); return; }
    raf = requestAnimationFrame(frame);
  };

  window.addEventListener("resize", debounce(() => { resize(); spawn(); start(); }, 200));
  document.addEventListener("visibilitychange", () => document.hidden ? cancelAnimationFrame(raf) : start());

  resize();

  return {
    setMode(next) {
      if (next === mode) return;
      mode = next;
      spawn();
      start();
    }
  };
})();



/**
 * SPARKLINES (climate signals)
 */

$$("[data-spark]").forEach(svg => {
  const vals = svg.dataset.spark.split(",").map(Number);
  const min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 200, 54 - ((v - min) / (max - min || 1)) * 48]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  svg.innerHTML = `<path class="spark-area" d="${line} L200,60 L0,60 Z"/><path class="spark-line" d="${line}"/>`;
});



/**
 * VOICES CAROUSEL
 */

const carousel = $("[data-carousel]");

const scrollCarousel = (dir) => {
  const card = carousel.firstElementChild;
  const step = card.getBoundingClientRect().width + 18;
  const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
  const atStart = carousel.scrollLeft <= 4;

  if (dir > 0 && atEnd) carousel.scrollTo({ left: 0, behavior: "smooth" });
  else if (dir < 0 && atStart) carousel.scrollTo({ left: carousel.scrollWidth, behavior: "smooth" });
  else carousel.scrollBy({ left: dir * step, behavior: "smooth" });
};

$("[data-carousel-next]").addEventListener("click", () => scrollCarousel(1));
$("[data-carousel-prev]").addEventListener("click", () => scrollCarousel(-1));



/**
 * REVEAL ON SCROLL
 */

const revealTargets = $$(".section-head, .signal, .action-grid li, .voice, .quote, .dev-card, .footer-card");
revealTargets.forEach(el => el.classList.add("reveal"));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = [...entry.target.parentElement.children];
    entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 6) * 60}ms`;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

revealTargets.forEach(el => revealObserver.observe(el));



/**
 * BOOT
 */

loadWeather();
