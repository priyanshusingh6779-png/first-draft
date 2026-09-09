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

const score = getWeeklyScore();
let text = "";

if (score > 50)
    text = "Excellent week! Your habits are strongly positive.";
else if (score > 0)
    text = "Moderate performance. Try to stay consistent.";
else
    text = "Negative score detected. Review bad habits.";

document.getElementById("insightText").textContent = text;
