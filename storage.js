function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}

function getTodayData() {
    const key = getTodayKey();
    return JSON.parse(localStorage.getItem(key)) || {
        tasks: [],
        habits: [],
        totalScore: 0
    };
}

function saveTodayData(data) {
    const key = getTodayKey();
    localStorage.setItem(key, JSON.stringify(data));
}
