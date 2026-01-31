/* ========================================
   Smart Home — Dashboard Controller
   ======================================== */

let groupMode = "room";
let devices = [];
let wsConnected = false;

// --- Lucide Icon SVGs ---
const ICONS = {
  light: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  ac: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`,
  sensor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h1"/><path d="M6 8v8"/><path d="M10 4v16"/><path d="M14 6v12"/><path d="M18 8v8"/><path d="M22 12h1"/></svg>`,
  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  devices: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
  rooms: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6l10-3 10 3"/><path d="M2 6v12l10 3 10-3V6"/><path d="M12 3v18"/></svg>`,
  sun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  menu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  zap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  power: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>`,
  wifi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>`,
  wifiOff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>`,
  logout: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
  thermometer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
  box: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
};

function getDeviceIcon(type) {
  return ICONS[type] || ICONS.box;
}

function getDeviceIconClass(type) {
  if (type === "light") return "light";
  if (type === "ac") return "ac";
  if (type === "sensor") return "sensor";
  return "default";
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
    const res = await fetch("/api/devices/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    devices = await res.json();
    render();
    updateStats();
    updateSidebarRooms();
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

// --- Sidebar Rooms ---
function updateSidebarRooms() {
  const container = document.getElementById("sidebar-rooms");
  if (!container) return;

  const roomMap = {};
  devices.forEach((d) => {
    if (!roomMap[d.room__name]) roomMap[d.room__name] = 0;
    roomMap[d.room__name]++;
  });

  container.innerHTML = Object.entries(roomMap)
    .map(
      ([name, count]) => `
    <div class="sidebar-item" onclick="filterRoom('${name}')">
      ${ICONS.home}
      <span>${name}</span>
      <span class="count">${count}</span>
    </div>`
    )
    .join("");
}

let activeRoomFilter = null;

function filterRoom(roomName) {
  if (activeRoomFilter === roomName) {
    activeRoomFilter = null;
  } else {
    activeRoomFilter = roomName;
  }

  document.querySelectorAll("#sidebar-rooms .sidebar-item").forEach((el) => {
    el.classList.toggle(
      "active",
      el.querySelector("span").textContent === activeRoomFilter
    );
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

  document.querySelectorAll("#sidebar-rooms .sidebar-item").forEach((el) => {
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
  return groups;
}

// --- Render ---
function render() {
  const container = document.getElementById("groups");
  if (!container) return;
  const groups = groupDevices();

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
        <div class="section-title">${group.charAt(0).toUpperCase() + group.slice(1)}</div>
        <div class="devices-grid">
          ${items.map(renderCard).join("")}
        </div>
      </div>`
    )
    .join("");
}

function renderCard(d) {
  const iconClass = getDeviceIconClass(d.type);
  const statusClass = d.status ? "on" : "off";

  return `
    <div class="device-card ${d.status ? "is-on" : ""}">
      <div class="device-card-top">
        <div class="device-icon-wrap ${iconClass}">
          ${getDeviceIcon(d.type)}
        </div>
        <button class="toggle-switch ${statusClass}"
                onclick="toggleDevice(${d.id}, event)"
                aria-label="Toggle ${d.name}">
          <span class="toggle-knob"></span>
        </button>
      </div>
      <div class="device-card-info">
        <h3>${d.name}</h3>
        <p>${d.type.charAt(0).toUpperCase() + d.type.slice(1)} &bull; ${d.room__name}</p>
      </div>
      <div class="device-status">
        <span class="device-status-label ${statusClass}">
          <span class="status-dot ${statusClass}"></span>
          ${d.status ? "Active" : "Inactive"}
        </span>
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
  // Preserve the username part set by Django template
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
    const log = document.getElementById("log");
    if (log) {
      log.textContent =
        `[${new Date().toLocaleTimeString()}] ${data.device} => ${data.status ? "ON" : "OFF"}\n` +
        log.textContent;
    }
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
}

document.addEventListener("DOMContentLoaded", initDashboard);
