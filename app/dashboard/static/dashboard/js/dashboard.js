/* ========================================
   Smart Home — Dashboard Controller
   ======================================== */

let groupMode = "room";
let devices = [];
let wsConnected = false;
let activeRoomFilter = null;
let activeCategoryFilter = window.currentCategory || "all";

// --- Lucide Icon SVGs ---
const ICONS = {
  // Home
  light: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  ac: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`,
  sensor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h1"/><path d="M6 8v8"/><path d="M10 4v16"/><path d="M14 6v12"/><path d="M18 8v8"/><path d="M22 12h1"/></svg>`,
  camera: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  sensor_temp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
  sensor_humidity: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,
  switch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  valve: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-7l-2-2"/><path d="M17 8v.8A6 6 0 0 1 13.8 14v0H10v0A6.5 6.5 0 0 1 7 8.8V8"/><path d="M12 2v3"/><path d="m4.6 11 1.4-1.4"/><path d="m19.4 11-1.4-1.4"/></svg>`,
  motor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,

  // Solar PV
  pv_voltage: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  pv_current: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  pv_power: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  pv_energy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  pv_panel_temp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
  battery_voltage: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 11v2"/><path d="M10 11v2"/><path d="M14 11v2"/></svg>`,
  battery_soc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="8" height="6" fill="currentColor" opacity="0.3"/></svg>`,
  battery_current: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg>`,
  inverter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6"/><path d="M9 15h6"/><path d="M12 9v6"/></svg>`,
  grid_power: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,

  // Hydroponics
  hydro_ph: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`,
  hydro_ec: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h1"/><path d="M6 8v8"/><path d="M10 4v16"/><path d="M14 6v12"/><path d="M18 8v8"/><path d="M22 12h1"/></svg>`,
  hydro_tds: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h1"/><path d="M6 8v8"/><path d="M10 4v16"/><path d="M14 6v12"/><path d="M18 8v8"/><path d="M22 12h1"/></svg>`,
  hydro_water_temp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
  hydro_water_level: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,
  hydro_flow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  hydro_light: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  hydro_nutrient_pump: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7l-2-2"/><path d="M17 8v.8A6 6 0 0 1 13.8 14H10A6.5 6.5 0 0 1 7 8.8V8"/><path d="M12 2v3"/></svg>`,
  hydro_ph_up_pump: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>`,
  hydro_ph_down_pump: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`,
  hydro_main_pump: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7l-2-2"/><path d="M17 8v.8A6 6 0 0 1 13.8 14H10A6.5 6.5 0 0 1 7 8.8V8"/><path d="M12 2v3"/></svg>`,
  hydro_air_temp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
  hydro_air_humidity: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,

  // Fishery
  fish_water_temp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
  fish_ph: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`,
  fish_do: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>`,
  fish_ammonia: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`,
  fish_nitrite: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`,
  fish_nitrate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`,
  fish_turbidity: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  fish_water_level: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,
  fish_aerator: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>`,
  fish_feeder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><rect x="5" y="17" width="14" height="4" rx="1"/></svg>`,
  fish_heater: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
  fish_drain_valve: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7l-2-2"/><path d="M17 8v.8A6 6 0 0 1 13.8 14H10A6.5 6.5 0 0 1 7 8.8V8"/><path d="M12 2v3"/></svg>`,
  fish_inlet_valve: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7l-2-2"/><path d="M17 8v.8A6 6 0 0 1 13.8 14H10A6.5 6.5 0 0 1 7 8.8V8"/><path d="M12 2v3"/></svg>`,

  // General
  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  box: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  wifiOff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>`,
};

function getDeviceIcon(type) {
  return ICONS[type] || ICONS.box;
}

function getDeviceIconClass(type) {
  // Determine icon class based on type prefix or exact match
  // Solar PV types
  if (type === "pv_voltage") return "pv-voltage";
  if (type === "pv_current" || type === "pv_energy" || type === "grid_power") return "pv-current";
  if (type === "pv_power") return "pv-power";
  if (type === "pv_panel_temp") return "pv-temp";
  if (type === "battery_voltage" || type === "battery_current") return "battery";
  if (type === "battery_soc") return "battery-soc";
  if (type === "inverter") return "inverter";

  // Hydroponics types
  if (type === "hydro_ph") return "hydro-ph";
  if (type === "hydro_ec" || type === "hydro_tds") return "hydro-ec";
  if (type === "hydro_water_temp" || type === "hydro_air_temp") return "hydro-temp";
  if (type === "hydro_water_level") return "hydro-level";
  if (type === "hydro_flow") return "hydro-flow";
  if (type === "hydro_light") return "hydro-light";
  if (type === "hydro_air_humidity") return "hydro-humidity";
  if (type.startsWith("hydro_") && type.includes("pump")) return "hydro-pump";

  // Fishery types
  if (type === "fish_water_temp") return "fish-temp";
  if (type === "fish_ph") return "fish-ph";
  if (type === "fish_do") return "fish-do";
  if (type === "fish_ammonia" || type === "fish_nitrite" || type === "fish_nitrate") return "fish-chemical";
  if (type === "fish_turbidity") return "fish-turbidity";
  if (type === "fish_water_level") return "fish-level";
  if (type === "fish_aerator") return "fish-aerator";
  if (type === "fish_feeder") return "fish-feeder";
  if (type === "fish_heater") return "fish-heater";
  if (type === "fish_drain_valve" || type === "fish_inlet_valve") return "fish-valve";

  const map = {
    light: "light", ac: "ac", sensor: "sensor", camera: "camera",
    sensor_temp: "sensor-temp", sensor_humidity: "sensor-humidity",
    switch: "switch", valve: "valve", motor: "motor",
  };
  return map[type] || "default";
}

// --- CSRF ---
function getCSRFToken() {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="));
  return cookie ? cookie.split("=")[1] : "";
}

// --- API ---
async function loadDevices() {
  try {
    let url = "/api/devices/";
    if (activeCategoryFilter && activeCategoryFilter !== "all") {
      url += `?category=${activeCategoryFilter}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    devices = await res.json();
    render();
    updateStats();
  } catch (err) {
    console.error("Failed to load devices:", err);
    const groups = document.getElementById("groups");
    if (groups) {
      groups.innerHTML = `
        <div class="empty-state">
          ${ICONS.wifiOff}
          <h3>Connection Error</h3>
          <p>Failed to load devices. Retrying...</p>
        </div>`;
    }
    setTimeout(loadDevices, 3000);
  }
}

async function toggleDevice(id, event) {
  if (event) {
    event.stopPropagation();
    addRipple(event);
  }
  try {
    const res = await fetch(`/api/toggle/${id}/`, {
      method: "POST",
      headers: { "X-CSRFToken": getCSRFToken() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    loadDevices();
  } catch (err) {
    console.error("Failed to toggle device:", err);
  }
}

// --- Ripple Effect ---
function addRipple(event) {
  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.left = (event.clientX - rect.left) + "px";
  ripple.style.top = (event.clientY - rect.top) + "px";
  btn.style.position = "relative";
  btn.style.overflow = "hidden";
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// --- Stats ---
function updateStats() {
  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.status).length;
  const rooms = [...new Set(devices.map((d) => d.room__name))].length;

  const el = (id) => document.getElementById(id);
  animateNumber(el("stat-total"), totalDevices);
  animateNumber(el("stat-active"), activeDevices);
  animateNumber(el("stat-rooms"), rooms);

  const connEl = el("stat-connection");
  if (connEl) connEl.textContent = wsConnected ? "Live" : "Offline";

  const badge = document.getElementById("ws-badge");
  if (badge) {
    badge.className = wsConnected
      ? "connection-badge connected"
      : "connection-badge disconnected";
    badge.innerHTML = wsConnected
      ? `<span class="status-dot on"></span> Connected`
      : `<span class="status-dot off"></span> Disconnected`;
  }
}

function animateNumber(el, target) {
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const diff = target - current;
  const steps = Math.min(Math.abs(diff), 20);
  const stepTime = 300 / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(current + (diff * step) / steps);
    if (step >= steps) clearInterval(timer);
  }, stepTime);
}

// --- Category Filter ---
function filterCategory(category) {
  activeCategoryFilter = category;
  activeRoomFilter = null;

  // Update URL without reload
  const url = new URL(window.location);
  url.searchParams.set("category", category);
  window.history.pushState({}, "", url);

  // Update sidebar active state
  document.querySelectorAll(".sidebar-section .sidebar-item").forEach(el => {
    el.classList.remove("active");
  });

  // Highlight active category
  const categoryItems = document.querySelectorAll(".sidebar-section .sidebar-item");
  categoryItems.forEach(el => {
    const span = el.querySelector("span:nth-child(2)");
    if (span) {
      const catName = window.categoryNames[category];
      if (span.textContent === catName || (category === "all" && span.textContent === "All Systems")) {
        el.classList.add("active");
      }
    }
  });

  // Update header subtitle
  const subtitle = document.getElementById("header-subtitle");
  if (subtitle) {
    const name = window.categoryNames[category] || category;
    subtitle.textContent = category === "all" ? "Here's your home overview" : `Viewing ${name} system`;
  }

  loadDevices();
  closeMobileSidebar();
}

// --- Room Filter ---
function filterRoom(roomName) {
  if (activeRoomFilter === roomName) {
    activeRoomFilter = null;
  } else {
    activeRoomFilter = roomName;
  }

  document.querySelectorAll(".room-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.room === activeRoomFilter);
  });

  render();
  closeMobileSidebar();
}

// --- Grouping ---
function setGroup(mode) {
  groupMode = mode;
  activeRoomFilter = null;

  document.querySelectorAll(".group-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  document.querySelectorAll(".room-item").forEach((el) => {
    el.classList.remove("active");
  });

  render();
}

function groupDevices() {
  let filtered = devices;
  if (activeRoomFilter) {
    filtered = devices.filter((d) => d.room__name === activeRoomFilter);
  }

  const groups = {};
  filtered.forEach((d) => {
    const key = groupMode === "room" ? d.room__name : d.type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });

  // Sort devices within each group by name to keep order stable
  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => a.name.localeCompare(b.name));
  });

  return groups;
}

// --- Render ---
function render() {
  const container = document.getElementById("groups");
  if (!container) return;
  const groups = groupDevices();

  // Update filter info
  const filterInfo = document.getElementById("filter-info");
  if (filterInfo) {
    if (activeRoomFilter) {
      filterInfo.textContent = `Filtered: ${activeRoomFilter}`;
      filterInfo.style.display = "block";
    } else {
      filterInfo.style.display = "none";
    }
  }

  if (Object.keys(groups).length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        ${ICONS.box}
        <h3>No Devices Found</h3>
        <p>${activeRoomFilter ? "No devices in this room" : "Add devices from the admin panel"}</p>
      </div>`;
    return;
  }

  container.innerHTML = Object.entries(groups)
    .map(
      ([group, items]) => `
      <div>
        <div class="section-title">${formatGroupName(group)}</div>
        <div class="devices-grid">
          ${items.map(renderCard).join("")}
        </div>
      </div>`
    )
    .join("");
}

function formatGroupName(name) {
  // Handle device type names
  const typeLabels = {
    light: "Lights", ac: "Air Conditioners", sensor: "Sensors", camera: "Cameras",
    sensor_temp: "Temperature Sensors", sensor_humidity: "Humidity Sensors",
    switch: "Switches", valve: "Valves", motor: "Motors",
    pv_voltage: "PV Voltage", pv_current: "PV Current", pv_power: "PV Power",
    pv_energy: "PV Energy", pv_panel_temp: "Panel Temperature",
    battery_voltage: "Battery Voltage", battery_soc: "Battery SoC", battery_current: "Battery Current",
    inverter: "Inverters", grid_power: "Grid Power",
    hydro_ph: "pH Sensors", hydro_ec: "EC Sensors", hydro_tds: "TDS Sensors",
    hydro_water_temp: "Water Temperature", hydro_water_level: "Water Level",
    hydro_flow: "Flow Rate", hydro_light: "Grow Lights",
    hydro_nutrient_pump: "Nutrient Pumps", hydro_ph_up_pump: "pH Up Pumps",
    hydro_ph_down_pump: "pH Down Pumps", hydro_main_pump: "Main Pumps",
    hydro_air_temp: "Air Temperature", hydro_air_humidity: "Air Humidity",
    fish_water_temp: "Water Temperature", fish_ph: "pH Sensors",
    fish_do: "Dissolved Oxygen", fish_ammonia: "Ammonia",
    fish_nitrite: "Nitrite", fish_nitrate: "Nitrate",
    fish_turbidity: "Turbidity", fish_water_level: "Water Level",
    fish_aerator: "Aerators", fish_feeder: "Auto Feeders",
    fish_heater: "Heaters", fish_drain_valve: "Drain Valves", fish_inlet_valve: "Inlet Valves",
  };
  return typeLabels[name] || name;
}

function getValueDisplay(d) {
  if (d.value == null) return "";
  const unit = d.unit || "";

  // Color coding based on thresholds
  let colorClass = "";
  if (d.min_value != null && d.value < d.min_value) colorClass = "critical-low";
  if (d.max_value != null && d.value > d.max_value) colorClass = "critical-high";

  return `<span class="device-value ${colorClass}">${d.value}${unit}</span>`;
}

function getTypeLabel(type) {
  const labels = {
    light: "Light", ac: "AC", sensor: "Sensor", camera: "Camera",
    sensor_temp: "Temperature", sensor_humidity: "Humidity",
    switch: "Switch", valve: "Valve", motor: "Motor",
    // PV
    pv_voltage: "Voltage", pv_current: "Current", pv_power: "Power",
    pv_energy: "Energy", pv_panel_temp: "Panel Temp",
    battery_voltage: "Voltage", battery_soc: "SoC", battery_current: "Current",
    inverter: "Inverter", grid_power: "Grid",
    // Hydro
    hydro_ph: "pH", hydro_ec: "EC", hydro_tds: "TDS",
    hydro_water_temp: "Water Temp", hydro_water_level: "Level",
    hydro_flow: "Flow", hydro_light: "Grow Light",
    hydro_nutrient_pump: "Nutrient Pump", hydro_ph_up_pump: "pH Up",
    hydro_ph_down_pump: "pH Down", hydro_main_pump: "Main Pump",
    hydro_air_temp: "Air Temp", hydro_air_humidity: "Humidity",
    // Fish
    fish_water_temp: "Temp", fish_ph: "pH", fish_do: "DO",
    fish_ammonia: "NH3", fish_nitrite: "NO2", fish_nitrate: "NO3",
    fish_turbidity: "Turbidity", fish_water_level: "Level",
    fish_aerator: "Aerator", fish_feeder: "Feeder",
    fish_heater: "Heater", fish_drain_valve: "Drain", fish_inlet_valve: "Inlet",
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function renderCard(d) {
  const iconClass = getDeviceIconClass(d.type);
  const statusClass = d.status ? "on" : "off";
  const valueHtml = getValueDisplay(d);
  const isControllable = d.is_controllable;

  return `
    <div class="device-card ${d.status ? "is-on" : ""} ${iconClass}">
      <div class="device-card-top">
        <div class="device-icon-wrap ${iconClass}">
          ${getDeviceIcon(d.type)}
        </div>
        ${isControllable ? `
        <button class="toggle-switch ${statusClass}"
                onclick="toggleDevice(${d.id}, event)"
                aria-label="Toggle ${d.name}">
          <span class="toggle-knob"></span>
        </button>
        ` : `
        <span class="sensor-indicator ${statusClass}"></span>
        `}
      </div>
      <div class="device-card-info">
        <h3>${d.name}</h3>
        <p>${getTypeLabel(d.type)} &bull; ${d.room__name}</p>
      </div>
      <div class="device-status">
        ${isControllable ? `
        <span class="device-status-label ${statusClass}">
          <span class="status-dot ${statusClass}"></span>
          ${d.status ? "Active" : "Inactive"}
        </span>
        ` : ""}
        ${valueHtml}
      </div>
    </div>`;
}

// --- Mobile Sidebar ---
function toggleMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("active");
}

// --- Live Clock ---
function updateClock() {
  const el = document.getElementById("live-clock");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// --- Greeting ---
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function initGreeting() {
  const el = document.getElementById("header-greeting");
  if (!el) return;
  const current = el.textContent;
  const namePart = current.includes(",") ? current.substring(current.indexOf(",")) : "";
  el.textContent = getGreeting() + namePart;
}

// --- WebSocket ---
function connectWebSocket() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${proto}://${location.host}/ws/devices/`);

  socket.onopen = () => {
    wsConnected = true;
    updateStats();
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    loadDevices();
  };

  socket.onclose = () => {
    wsConnected = false;
    updateStats();
    console.warn("WebSocket closed, reconnecting in 3s...");
    setTimeout(connectWebSocket, 3000);
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
    socket.close();
  };
}

// --- Logout ---
function confirmLogout() {
  if (confirm("Are you sure you want to logout?")) {
    document.getElementById("logout-form").submit();
  }
}

// --- Init ---
function initDashboard() {
  initGreeting();
  updateClock();
  setInterval(updateClock, 1000);
  loadDevices();
  connectWebSocket();
  closeMobileSidebar();

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileSidebar();
    }
  });
}

document.addEventListener("DOMContentLoaded", initDashboard);
