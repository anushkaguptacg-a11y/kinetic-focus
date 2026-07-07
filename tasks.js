import { saveData } from './storage.js';

export let state = {
    tasks: [],
    selectedPriority: 'high',
    dailyGoal: 8,
    settings: {
        darkMode: false
    },
    history: {}
};

export function getDateStr(date = new Date()) {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
}

export function escape(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function addTask(title, priority) {
    const task = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title,
        priority,
        completed: false,
        createdDate: getDateStr(),
        completedDate: null
    };
    state.tasks.unshift(task);
    saveData(state);
    return task;
}

export function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task && task.completed && task.completedDate) {
        const cDate = task.completedDate;
        if (state.history[cDate]) {
            state.history[cDate] = Math.max(0, state.history[cDate] - 1);
        }
    }
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveData(state);
}

export function checkTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    const todayStr = getDateStr();

    if (task.completed) {
        task.completedDate = todayStr;
        state.history[todayStr] = (state.history[todayStr] || 0) + 1;
    } else {
        const oldCompletedDate = task.completedDate;
        if (oldCompletedDate && state.history[oldCompletedDate]) {
            state.history[oldCompletedDate] = Math.max(0, state.history[oldCompletedDate] - 1);
        }
        task.completedDate = null;
    }
    saveData(state);
}

export function editTaskName(id, newTitle) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.title = newTitle;
        saveData(state);
    }
}
