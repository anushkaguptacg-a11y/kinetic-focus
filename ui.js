import { escape, getDateStr } from './tasks.js';

export function showList(tasks, searchFilter, isCompletedCollapsed, onToggleTask, onDeleteTask, editingTaskId, onStartEdit, onSaveEdit, onCancelEdit) {
    const activeList = document.getElementById('active-tasks-list');
    const completedList = document.getElementById('completed-tasks-list');
    
    if (!activeList || !completedList) return;

    activeList.innerHTML = '';
    completedList.innerHTML = '';

    const filtered = tasks.filter(t => t.title.toLowerCase().includes(searchFilter.toLowerCase()));
    const active = filtered.filter(t => !t.completed);
    const completed = filtered.filter(t => t.completed);

    if (active.length === 0) {
        activeList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="circle-dashed"></i>
                <p>${searchFilter ? 'No matching tasks found' : 'All clear! Add a task above to begin.'}</p>
            </div>
        `;
    } else {
        active.forEach(task => {
            const card = createCard(task, onToggleTask, onDeleteTask, editingTaskId, onStartEdit, onSaveEdit, onCancelEdit);
            activeList.appendChild(card);
        });
    }

    if (completed.length === 0) {
        completedList.innerHTML = `
            <div class="empty-state" style="padding: 1.5rem;">
                <p>No recently completed tasks</p>
            </div>
        `;
    } else {
        completed.forEach(task => {
            const card = createCard(task, onToggleTask, onDeleteTask, null, null, null, null);
            completedList.appendChild(card);
        });
    }

    const activeTotal = tasks.filter(t => !t.completed).length;
    document.getElementById('pending-count-badge').innerText = `${activeTotal} Pending`;
}

function createCard(task, onToggleTask, onDeleteTask, editingTaskId, onStartEdit, onSaveEdit, onCancelEdit) {
    const card = document.createElement('div');
    const isEditing = editingTaskId && task.id === editingTaskId;
    card.className = `task-card ${task.completed ? 'completed-task' : ''}`;
    
    if (isEditing) {
        card.innerHTML = `
            <div class="checkbox-container">
                <input type="checkbox" class="checkbox-input" ${task.completed ? 'checked' : ''} disabled>
                <div class="checkbox-custom">
                    <svg viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </div>
            <div class="task-details" style="width: 100%;">
                <input type="text" class="task-edit-input" style="font-family: var(--font-main); font-size: 1.05rem; font-weight: 500; border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 0.25rem 0.5rem; width: 90%; outline: none; background-color: var(--input-bg); color: var(--text-primary);">
                <span class="task-priority-tag ${task.priority}" style="margin-top: 0.25rem; display: block;">
                    ${task.priority.toUpperCase()} PRIORITY
                </span>
            </div>
            <div style="display: flex; gap: 0.2rem; align-items: center; align-self: center;">
                <button class="save-task-btn" title="Save" style="background: transparent; border: none; color: var(--success); cursor: pointer; padding: 0.25rem;">
                    <i data-lucide="check"></i>
                </button>
                <button class="cancel-task-btn" title="Cancel" style="background: transparent; border: none; color: var(--danger); cursor: pointer; padding: 0.25rem;">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;

        const editInput = card.querySelector('.task-edit-input');
        editInput.value = task.title;
        setTimeout(() => {
            editInput.focus();
            editInput.select();
        }, 50);

        const saveBtn = card.querySelector('.save-task-btn');
        const cancelBtn = card.querySelector('.cancel-task-btn');

        const triggerSave = () => {
            const val = editInput.value.trim();
            if (val) {
                onSaveEdit(task.id, val);
            }
        };

        saveBtn.addEventListener('click', triggerSave);
        cancelBtn.addEventListener('click', () => onCancelEdit());

        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') triggerSave();
            else if (e.key === 'Escape') onCancelEdit();
        });
    } else {
        card.innerHTML = `
            <div class="checkbox-container">
                <input type="checkbox" class="checkbox-input" ${task.completed ? 'checked' : ''}>
                <div class="checkbox-custom">
                    <svg viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </div>
            <div class="task-details">
                <div class="task-title">${escape(task.title)}</div>
                <span class="task-priority-tag ${task.priority}">
                    ${task.priority.toUpperCase()} PRIORITY
                </span>
            </div>
            <div style="display: flex; gap: 0.2rem; align-items: center; align-self: center;">
                ${!task.completed && onStartEdit ? `
                <button class="edit-task-btn" title="Edit Task">
                    <i data-lucide="pencil"></i>
                </button>` : ''}
                <button class="delete-task-btn" title="Delete Task">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;

        card.querySelector('.checkbox-input').addEventListener('change', () => {
            onToggleTask(task.id);
        });

        card.querySelector('.delete-task-btn').addEventListener('click', () => {
            onDeleteTask(task.id);
        });

        if (!task.completed && onStartEdit) {
            card.querySelector('.edit-task-btn').addEventListener('click', () => {
                onStartEdit(task.id);
            });
        }
    }
    
    return card;
}

export function todayProgress(tasks, dailyGoal) {
    const todayStr = getDateStr();
    const completedToday = tasks.filter(t => t.completed && t.completedDate === todayStr).length;
    const percent = Math.min(100, Math.round((completedToday / dailyGoal) * 100));
    
    let summaryText = `${completedToday} of ${dailyGoal} daily goal tasks completed. `;
    if (percent === 100) {
        summaryText += "Phenomenal! You've crushed your goal for today! 🎉";
    } else if (percent >= 75) {
        summaryText += "You're almost at your daily goal! Keep pushing! 🔥";
    } else if (percent >= 50) {
        summaryText += "Halfway there! Keep up the great pace. 👍";
    } else if (percent > 0) {
        summaryText += "Good start! Keep working on your list.";
    } else {
        summaryText += "No tasks completed yet today. Let's make progress! 💪";
    }
    
    const circleVal = document.getElementById('progress-circle-bar');
    const percentText = document.getElementById('progress-percentage-text');
    const summaryTextEl = document.getElementById('stats-summary-text');
    
    if (circleVal && percentText && summaryTextEl) {
        percentText.innerText = `${percent}%`;
        summaryTextEl.innerText = summaryText;
        
        const circumference = 213.6;
        const offset = circumference - (percent / 100) * circumference;
        circleVal.style.strokeDashoffset = offset;
    }
}

export function streakChart(history, dailyGoal, completedToday) {
    const today = new Date();
    const day1 = new Date(); day1.setDate(today.getDate() - 1);
    const day2 = new Date(); day2.setDate(today.getDate() - 2);

    const day1Str = getDateStr(day1);
    const day2Str = getDateStr(day2);

    const valToday = completedToday;
    const valDay1 = history[day1Str] || 0;
    const valDay2 = history[day2Str] || 0;

    const pctToday = Math.min(100, Math.round((valToday / dailyGoal) * 100));
    const pctDay1 = Math.min(100, Math.round((valDay1 / dailyGoal) * 100));
    const pctDay2 = Math.min(100, Math.round((valDay2 / dailyGoal) * 100));

    const barToday = document.getElementById('streak-day-today');
    const barDay1 = document.getElementById('streak-day-1');
    const barDay2 = document.getElementById('streak-day-2');

    if (barToday && barDay1 && barDay2) {
        barToday.style.height = `${pctToday}%`;
        barDay1.style.height = `${pctDay1}%`;
        barDay2.style.height = `${pctDay2}%`;
    }

    const label1 = document.getElementById('streak-label-1');
    const label2 = document.getElementById('streak-label-2');

    if (label1 && label2) {
        label1.innerText = day1.toLocaleDateString('en-US', { weekday: 'short' });
        label2.innerText = day2.toLocaleDateString('en-US', { weekday: 'short' });
    }
}

export function focusTab(tasks, dailyGoal, onToggleTask) {
    const alertContainer = document.getElementById('high-priority-status-container');
    const tasksListContainer = document.getElementById('high-priority-tasks-list');
    
    if (!alertContainer || !tasksListContainer) return;

    const activeHigh = tasks.filter(t => !t.completed && t.priority === 'high');
    const todayStr = getDateStr();
    const completedToday = tasks.filter(t => t.completed && t.completedDate === todayStr).length;
    const productivityPct = Math.min(100, Math.round((completedToday / dailyGoal) * 100));

    if (activeHigh.length > 0) {
        alertContainer.innerHTML = `
            <div class="priority-alert-box danger">
                <i data-lucide="alert-triangle"></i>
                <div>
                    <div class="priority-alert-title">Attention Needed</div>
                    <div class="priority-alert-desc">
                        You have <strong>${activeHigh.length} High Priority</strong> task(s) remaining. 
                        Productivity is currently at <strong>${productivityPct}%</strong>. Focus on these tasks next to ensure success!
                    </div>
                </div>
            </div>
        `;
        
        tasksListContainer.innerHTML = '';
        activeHigh.forEach(task => {
            const item = document.createElement('div');
            item.className = 'focus-task-item';
            item.innerHTML = `
                <span>${escape(task.title)}</span>
                <div class="checkbox-container">
                    <input type="checkbox" class="checkbox-input">
                    <div class="checkbox-custom">
                        <svg viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>
            `;
            item.querySelector('.checkbox-input').addEventListener('change', () => {
                onToggleTask(task.id);
            });
            tasksListContainer.appendChild(item);
        });
    } else {
        alertContainer.innerHTML = `
            <div class="priority-alert-box success">
                <i data-lucide="check-circle2"></i>
                <div>
                    <div class="priority-alert-title">High Priority Safe!</div>
                    <div class="priority-alert-desc">
                        Outstanding! All high-priority tasks are completed. 
                        Productivity is currently at <strong>${productivityPct}%</strong>. Feel free to proceed with other tasks or take a break!
                    </div>
                </div>
            </div>
        `;
        tasksListContainer.innerHTML = `
            <div class="empty-state" style="border: none;">
                <i data-lucide="award" style="color: var(--success);"></i>
                <p>No remaining high-priority tasks!</p>
            </div>
        `;
    }
}

export function profileStats(tasks, history) {
    const totalCreated = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const ratio = totalCreated > 0 ? Math.round((completedCount / totalCreated) * 100) : 0;
    const streakVal = streak(history);

    document.getElementById('profile-stat-total').innerText = totalCreated;
    document.getElementById('profile-stat-completed').innerText = completedCount;
    document.getElementById('profile-stat-ratio').innerText = `${ratio}%`;
    document.getElementById('profile-stat-streak').innerText = streakVal;

    let level = 1;
    let levelTitle = "Productivity Apprentice";
    if (completedCount >= 50) {
        level = 5;
        levelTitle = "Unstoppable Flow Master";
    } else if (completedCount >= 25) {
        level = 4;
        levelTitle = "Task Guru";
    } else if (completedCount >= 10) {
        level = 3;
        levelTitle = "Focus Professional";
    } else if (completedCount >= 3) {
        level = 2;
        levelTitle = "Action Taker";
    }

    document.getElementById('profile-level-text').innerText = `Lvl ${level}`;
    document.getElementById('profile-level-title').innerText = levelTitle;
}

function streak(history) {
    let count = 0;
    let checkDate = new Date();
    
    while (true) {
        const dateStr = getDateStr(checkDate);
        if (history[dateStr] && history[dateStr] > 0) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            const isToday = getDateStr(new Date()) === dateStr;
            if (isToday) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = getDateStr(yesterday);
                if (history[yesterdayStr] && history[yesterdayStr] > 0) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
            }
            break;
        }
    }
    return count;
}

export function tick() {
    const clockElement = document.getElementById('real-time-clock');
    if (!clockElement) return;

    function update() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('en-US', options);
        const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clockElement.innerText = `${dateStr} • ${timeStr}`;
    }
    
    update();
    setInterval(update, 1000);
}

export function setDarkMode(darkMode) {
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}
