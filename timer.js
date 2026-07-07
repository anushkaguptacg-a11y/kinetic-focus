export let timer = {
    duration: 25 * 60,
    timeLeft: 25 * 60,
    intervalId: null,
    isRunning: false,
    currentMode: 'work'
};

export function changeMode(mode) {
    timer.currentMode = mode;
    if (mode === 'work') timer.duration = 25 * 60;
    else if (mode === 'short') timer.duration = 5 * 60;
    else if (mode === 'long') timer.duration = 15 * 60;
    resetClock();
}

export function startTimer(onTick, onEnd) {
    timer.isRunning = true;
    timer.intervalId = setInterval(() => {
        timer.timeLeft--;
        if (onTick) onTick(timer.timeLeft);
        if (timer.timeLeft <= 0) {
            clearInterval(timer.intervalId);
            timer.isRunning = false;
            if (onEnd) onEnd();
            resetClock();
        }
    }, 1000);
}

export function stopTimer() {
    clearInterval(timer.intervalId);
    timer.isRunning = false;
}

export function resetClock() {
    clearInterval(timer.intervalId);
    timer.isRunning = false;
    timer.timeLeft = timer.duration;
}
