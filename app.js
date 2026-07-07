import { state, addTask, deleteTask, checkTask, getDateStr, editTaskName } from './tasks.js';
import { getData, saveData } from './storage.js';
import { timer, changeMode, startTimer, stopTimer, resetClock } from './timer.js';
import * as ui from './ui.js';

let searchFilter = "";
let isCompletedCollapsed = false;
let editingTaskId = null;

function renderAll() {
    ui.showList(
        state.tasks, 
        searchFilter, 
        isCompletedCollapsed, 
        onToggleTask, 
        onDeleteTask,
        editingTaskId,
        onStartEdit,
        onSaveEdit,
        onCancelEdit
    );
    
    const todayStr = getDateStr();
    const completedToday = state.tasks.filter(t => t.completed && t.completedDate === todayStr).length;
    ui.todayProgress(state.tasks, state.dailyGoal);
    ui.streakChart(state.history, state.dailyGoal, completedToday);

    const focusView = document.getElementById('focus-view');
    const profileView = document.getElementById('profile-view');
    
    if (focusView && focusView.classList.contains('active-view')) {
        ui.focusTab(state.tasks, state.dailyGoal, onToggleTask);
    }
    if (profileView && profileView.classList.contains('active-view')) {
        ui.profileStats(state.tasks, state.history);
    }
}

function onToggleTask(id) {
    checkTask(id);
    renderAll();
}

function onDeleteTask(id) {
    deleteTask(id);
    renderAll();
}

function onStartEdit(id) {
    editingTaskId = id;
    renderAll();
}

function onSaveEdit(id, newTitle) {
    editTaskName(id, newTitle);
    editingTaskId = null;
    renderAll();
}

function onCancelEdit() {
    editingTaskId = null;
    renderAll();
}

function switchView(viewId, element) {
    document.querySelectorAll('.view-content').forEach(view => view.classList.remove('active-view'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(viewId).classList.add('active-view');
    element.classList.add('active');
    
    const titleElement = document.getElementById('dashboard-title');
    const searchContainer = document.getElementById('header-search-container');
    
    if (viewId === 'tasks-view') {
        titleElement.innerText = "Productivity Dashboard";
        searchContainer.style.display = 'block';
    } else if (viewId === 'focus-view') {
        titleElement.innerText = "Focus Sanctuary";
        searchContainer.style.display = 'none';
    } else if (viewId === 'profile-view') {
        titleElement.innerText = "Performance Statistics";
        searchContainer.style.display = 'none';
    } else if (viewId === 'settings-view') {
        titleElement.innerText = "Dashboard Settings";
        searchContainer.style.display = 'none';
    }
    
    renderAll();
}

window.addEventListener('DOMContentLoaded', () => {
    const loaded = getData();
    if (loaded) {
        Object.assign(state, loaded);
    }

    ui.tick();
    ui.setDarkMode(state.settings.darkMode);

    document.getElementById('dark-mode-toggle').checked = state.settings.darkMode;
    document.getElementById('daily-goal-input').value = state.dailyGoal;

    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    navItems[0].addEventListener('click', () => switchView('tasks-view', navItems[0]));
    navItems[1].addEventListener('click', () => switchView('focus-view', navItems[1]));
    navItems[2].addEventListener('click', () => switchView('profile-view', navItems[2]));
    
    const settingsBtn = document.querySelector('.settings-container .nav-item');
    settingsBtn.addEventListener('click', () => switchView('settings-view', settingsBtn));

    const keepGoingBtn = document.getElementById('keep-going-action');
    if (keepGoingBtn) {
        keepGoingBtn.addEventListener('click', () => switchView('focus-view', navItems[1]));
    }

    const searchInput = document.getElementById('task-search');
    searchInput.addEventListener('input', () => {
        searchFilter = searchInput.value;
        renderAll();
    });

    const taskInput = document.getElementById('new-task-title');
    const addBtn = document.querySelector('.add-task-btn');
    
    function triggerAddTask() {
        const title = taskInput.value.trim();
        if (title) {
            addTask(title, state.selectedPriority);
            taskInput.value = '';
            renderAll();
        }
    }
    
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerAddTask();
    });
    addBtn.addEventListener('click', triggerAddTask);

    const pills = document.querySelectorAll('.priority-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.selectedPriority = pill.innerText.toLowerCase() === 'med' ? 'medium' : pill.innerText.toLowerCase();
        });
    });

    const accordionBtn = document.getElementById('accordion-toggle-btn');
    accordionBtn.addEventListener('click', () => {
        isCompletedCollapsed = !isCompletedCollapsed;
        const list = document.getElementById('completed-tasks-list');
        if (isCompletedCollapsed) {
            accordionBtn.classList.add('collapsed');
            list.classList.add('collapsed');
        } else {
            accordionBtn.classList.remove('collapsed');
            list.classList.remove('collapsed');
        }
    });

    const darkToggle = document.getElementById('dark-mode-toggle');
    darkToggle.addEventListener('change', () => {
        state.settings.darkMode = darkToggle.checked;
        ui.setDarkMode(state.settings.darkMode);
        saveData(state);
    });

    const goalInput = document.getElementById('daily-goal-input');
    goalInput.addEventListener('change', () => {
        let goalVal = parseInt(goalInput.value);
        if (isNaN(goalVal) || goalVal < 1) {
            goalVal = 8;
            goalInput.value = 8;
        }
        state.dailyGoal = goalVal;
        saveData(state);
        renderAll();
    });

    const resetBtn = document.querySelector('.danger-btn');
    resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete all tasks, history, and reset your dashboard? This cannot be undone.")) {
            state.tasks = [];
            state.history = {};
            state.dailyGoal = 8;
            state.settings.darkMode = false;
            
            ui.setDarkMode(false);
            darkToggle.checked = false;
            goalInput.value = 8;
            
            saveData(state);
            switchView('tasks-view', navItems[0]);
        }
    });

    const timerModes = document.querySelectorAll('.timer-mode-btn');
    timerModes[0].addEventListener('click', () => selectTimerMode('work', timerModes[0]));
    timerModes[1].addEventListener('click', () => selectTimerMode('short', timerModes[1]));
    timerModes[2].addEventListener('click', () => selectTimerMode('long', timerModes[2]));

    function selectTimerMode(mode, element) {
        timerModes.forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
        changeMode(mode);
        uiTimerDisplay();
    }

    const timerToggleBtn = document.getElementById('timer-toggle-btn');
    const timerResetBtn = document.getElementById('timer-reset-btn');

    function uiTimerDisplay() {
        const minutes = Math.floor(timer.timeLeft / 60);
        const seconds = timer.timeLeft % 60;
        document.getElementById('timer-time-display').innerText = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function onTimerTick() {
        uiTimerDisplay();
    }

    function onTimerEnd() {
        alert("Time's up! Great job maintaining your focus!");
        timerToggleBtn.innerText = "Start Focus";
        timerToggleBtn.style.backgroundColor = "var(--primary)";
        uiTimerDisplay();
    }

    timerToggleBtn.addEventListener('click', () => {
        if (timer.isRunning) {
            stopTimer();
            timerToggleBtn.innerText = "Resume Focus";
            timerToggleBtn.style.backgroundColor = "var(--primary)";
        } else {
            startTimer(onTimerTick, onTimerEnd);
            timerToggleBtn.innerText = "Pause";
            timerToggleBtn.style.backgroundColor = "var(--danger)";
        }
    });

    timerResetBtn.addEventListener('click', () => {
        resetClock();
        timerToggleBtn.innerText = "Start Focus";
        timerToggleBtn.style.backgroundColor = "var(--primary)";
        uiTimerDisplay();
    });

    renderAll();
    lucide.createIcons();
});
