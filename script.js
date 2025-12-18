/* 
    BlackOps System Core
    Handles Auth & App Logic
*/

// --- CONFIG ---
const STORAGE_TASKS = 'bo_tasks';
const STORAGE_DATA = 'bo_data';
const STORAGE_USER = 'bo_user'; // For Auth
const STORAGE_SESSION = 'bo_session'; // Is logged in?

// --- DOM ELEMENTS ---
// Auth Screens
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toSignupBtn = document.getElementById('to-signup');
const toLoginBtn = document.getElementById('to-login');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');

// App Inputs
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const tableHead = document.getElementById('header-row');
const tableBody = document.getElementById('table-body');
const charts = {
    pie: document.getElementById('pie-chart'),
    pieVal: document.getElementById('pie-value'),
    line: document.getElementById('line-chart-wrapper'),
    bar: document.getElementById('bar-chart-wrapper')
};

// --- STATE ---
let tasks = JSON.parse(localStorage.getItem(STORAGE_TASKS)) || [];
let dataMap = JSON.parse(localStorage.getItem(STORAGE_DATA)) || {};
let currentUser = localStorage.getItem(STORAGE_USER) || null;

// --- INITIALIZATION ---
init();

function init() {
    checkSession();
    setupAuthEvents();
    setupAppEvents();
}

// --- AUTH LOGIC ---
function checkSession() {
    const isLoggedIn = localStorage.getItem(STORAGE_SESSION);
    if (isLoggedIn === 'true') {
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
}

function showApp() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    userDisplay.textContent = currentUser || 'Operator';
    renderApp();
}

function setupAuthEvents() {
    // Switch between Login and Signup
    toSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    });

    toLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.remove('active');
        loginForm.classList.add('active');
    });

    // Handle Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;

        // Simple mock validation (accepts any email if password is > 3 chars)
        if (pass.length < 3) {
            alert("Access Denied: Invalid Credentials");
            return;
        }

        // Simulating loading user data
        if(!currentUser) currentUser = email.split('@')[0];
        
        localStorage.setItem(STORAGE_SESSION, 'true');
        showApp();
    });

    // Handle Signup
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        
        currentUser = name;
        localStorage.setItem(STORAGE_USER, name);
        localStorage.setItem(STORAGE_SESSION, 'true');
        
        alert(`Identity Established. Welcome, ${name}.`);
        showApp();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_SESSION);
        location.reload(); // Refresh to clear state
    });
}

// --- APP LOGIC (From previous iteration) ---
function setupAppEvents() {
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
}

function get30Days() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function dateToKey(d) { return d.toISOString().split('T')[0]; }

function addTask() {
    const val = taskInput.value.trim();
    if (!val) return;
    if (tasks.includes(val)) { alert("Task Exists"); return; }
    if (tasks.length >= 8) { alert("Max Limit Reached"); return; }
    
    tasks.push(val);
    saveData();
    taskInput.value = '';
    renderApp();
}

function removeTask(t) {
    if(!confirm(`Delete ${t}?`)) return;
    tasks = tasks.filter(task => task !== t);
    saveData();
    renderApp();
}

function toggleCheck(key, t) {
    if (!dataMap[key]) dataMap[key] = {};
    dataMap[key][t] = !dataMap[key][t];
    saveData();
    renderCharts();
    updateRowStatus(key);
}

function saveData() {
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_DATA, JSON.stringify(dataMap));
}

// --- RENDERERS ---
function renderApp() {
    renderTable();
    renderCharts();
}

function renderTable() {
    // Header
    const fixedTh = `<th class="fixed-col">Timeline</th>`;
    const taskThs = tasks.map(t => `
        <th><div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
            <span>${t}</span>
            <span style="font-size:0.6rem; cursor:pointer; color:#444;" onclick="removeTask('${t}')">✕</span>
        </div></th>`).join('');
    tableHead.innerHTML = fixedTh + taskThs + `<th class="end-col">Status</th>`;

    // Body
    tableBody.innerHTML = '';
    const days = get30Days();
    days.forEach(d => {
        const key = dateToKey(d);
        const tr = document.createElement('tr');
        
        let html = `
            <td class="date-cell">
                <span class="date-main">${d.toLocaleDateString('en-US', {day:'numeric', month:'short'})}</span>
                <span class="date-sub">${d.toLocaleDateString('en-US', {weekday:'short'})}</span>
            </td>`;
        
        tasks.forEach(t => {
            const checked = dataMap[key]?.[t] ? 'checked' : '';
            html += `<td><input type="checkbox" ${checked} onchange="toggleCheck('${key}','${t}')"></td>`;
        });
        
        html += `<td id="stat-${key}" style="color:#666; font-size:0.8rem;">0%</td>`;
        tr.innerHTML = html;
        tableBody.appendChild(tr);
        updateRowStatus(key);
    });

    window.removeTask = removeTask;
    window.toggleCheck = toggleCheck;
}

function updateRowStatus(key) {
    const el = document.getElementById(`stat-${key}`);
    if(!el) return;
    let c = 0;
    tasks.forEach(t => { if(dataMap[key]?.[t]) c++; });
    const p = tasks.length ? Math.round((c/tasks.length)*100) : 0;
    el.textContent = `${p}%`;
    el.style.color = p===100 ? 'var(--primary)' : '#fff';
}

function renderCharts() {
    if(tasks.length === 0) {
        charts.pieVal.textContent = "0%";
        charts.pie.style.background = `conic-gradient(var(--border) 0% 100%)`;
        charts.line.innerHTML = '';
        charts.bar.innerHTML = '<div style="width:100%; text-align:center; color:#444; padding:10px;">No Data</div>';
        return;
    }

    const days = get30Days();
    let totalC = 0;
    let taskC = {};
    let dailyP = [];
    tasks.forEach(t => taskC[t] = 0);

    days.forEach(d => {
        const key = dateToKey(d);
        let dCount = 0;
        tasks.forEach(t => {
            if(dataMap[key]?.[t]) {
                totalC++;
                taskC[t]++;
                dCount++;
            }
        });
        dailyP.push(Math.round((dCount/tasks.length)*100));
    });

    // Pie
    const totP = Math.round((totalC/(days.length*tasks.length))*100);
    charts.pieVal.textContent = `${totP}%`;
    charts.pie.style.background = `conic-gradient(var(--primary) ${totP}%, var(--border) 0%)`;

    // Bar
    let barHTML = '';
    tasks.forEach(t => {
        const h = (taskC[t]/30)*100;
        barHTML += `
            <div class="bar-wrapper">
                <div class="bar" style="height:${h||1}%; background:${h===100?'var(--primary)':'var(--secondary)'}"></div>
                <div class="bar-label">${t}</div>
            </div>`;
    });
    charts.bar.innerHTML = barHTML;

    // Line (SVG)
    const w = 300, h = 100, step = w/(days.length-1);
    let path = `M 0 ${h - dailyP[0]} `;
    dailyP.forEach((p, i) => path += `L ${i*step} ${h - p} `);
    
    charts.line.innerHTML = `<svg viewBox="0 0 300 100" preserveAspectRatio="none">
        <path d="${path} L ${w} ${h} L 0 ${h} Z" class="area-path" />
        <path d="${path}" class="line-path" vector-effect="non-scaling-stroke" />
    </svg>`;
}