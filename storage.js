export function saveData(state) {
    localStorage.setItem('kinetic_focus_state', JSON.stringify(state));
}

export function getData() {
    const stored = localStorage.getItem('kinetic_focus_state');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error(e);
        }
    }
    return null;
}
