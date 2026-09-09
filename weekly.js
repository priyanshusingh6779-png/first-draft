function getWeeklyScore() {
    let total = 0;

    for (let key in localStorage) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
            const day = JSON.parse(localStorage.getItem(key));
            total += day.totalScore || 0;
        }
    }
    return total;
}

document.getElementById("weeklyScore").textContent = getWeeklyScore();
