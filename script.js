// ---------- العناصر ----------
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const statToday = document.getElementById("statToday");
const statWeek = document.getElementById("statWeek");
const chart = document.getElementById("chart");

const modeButtons = {
  focus: document.getElementById("focusBtn"),
  short: document.getElementById("shortBtn"),
  long: document.getElementById("longBtn"),
};

// ---------- الإعدادات والحالة ----------
const durations = { focus: 25, short: 5, long: 15 }; // بالدقائق

let mode = "focus";
let remaining = durations[mode] * 60; // بالثواني
let running = false;
let endTime = 0;
let intervalId = null;
let completedFocus = 0;

// ---------- العرض ----------
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function render() {
  timeEl.textContent = formatTime(remaining);
  document.title = running
    ? formatTime(remaining) + " - Pomodoro Timer"
    : "Pomodoro Timer";
}

// ---------- التحكم بالمؤقّت ----------
function start() {
  if (running) return;
  running = true;
  endTime = Date.now() + remaining * 1000; // وقت النهاية بدل العدّ بالثواني
  intervalId = setInterval(tick, 250);
}

function stop() {
  running = false;
  clearInterval(intervalId);
  render();
}

function reset() {
  stop();
  remaining = durations[mode] * 60;
  render();
}

function tick() {
  remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  render();
  if (remaining === 0) finish();
}

function setMode(newMode) {
  stop();
  mode = newMode;
  remaining = durations[mode] * 60;

  document.body.classList.remove("short", "long");
  if (mode !== "focus") document.body.classList.add(mode);

  for (const key in modeButtons) {
    modeButtons[key].classList.toggle("active", key === mode);
  }
  render();
}

function finish() {
  stop();
  beep();

  if (mode === "focus") {
    addStats(durations.focus);
    completedFocus++;
    // بعد كل 4 جلسات تركيز تجي راحة طويلة
    setMode(completedFocus % 4 === 0 ? "long" : "short");
  } else {
    setMode("focus");
  }
}

// ---------- الصوت ----------
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  } catch (e) {}
}

// ---------- الإحصائيات ----------
function dateKey(d = new Date()) {
  return d.toLocaleDateString("en-CA"); // شكل التاريخ: 2026-11-23
}

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem("pomodoroStats")) || {};
  } catch (e) {
    return {};
  }
}

let stats = loadStats();

function addStats(minutes) {
  const key = dateKey();
  stats[key] = (stats[key] || 0) + minutes;
  try {
    localStorage.setItem("pomodoroStats", JSON.stringify(stats));
  } catch (e) {}
  renderStats();
}

function renderStats() {
  const days = [];
  let weekTotal = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const minutes = stats[dateKey(d)] || 0;
    weekTotal += minutes;
    days.push({
     name: d.toLocaleDateString("en-US", { weekday: "short" }),      minutes: minutes,
    });
  }

  statToday.textContent = stats[dateKey()] || 0;
  statWeek.textContent = weekTotal;

  const max = Math.max(...days.map((d) => d.minutes), 1);
  chart.innerHTML = days
    .map(
      (d) => `
      <div class="bar-col">
        <span>${d.minutes || ""}</span>
        <div class="bar" style="height:${(d.minutes / max) * 80}%"></div>
        <small>${d.name}</small>
      </div>`
    )
    .join("");
}

// ---------- الأحداث ----------
startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
resetBtn.addEventListener("click", reset);

modeButtons.focus.addEventListener("click", () => setMode("focus"));
modeButtons.short.addEventListener("click", () => setMode("short"));
modeButtons.long.addEventListener("click", () => setMode("long"));

// زر المسافة للتشغيل والإيقاف
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    running ? stop() : start();
  }
});

// ---------- البداية ----------
setMode("focus");
renderStats();