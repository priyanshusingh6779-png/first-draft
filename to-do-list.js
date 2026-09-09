const taskBtn = document.getElementById("addTaskBtn");

taskBtn.addEventListener("click", () => { 
    const name = document.getElementById("taskName").value.trim();
    const points = Number(document.getElementById("taskPoints").value);

    if (!name || points === 0) return;

    const data = getTodayData();
    data.tasks.push({ name, points });
    data.totalScore += points;
    

    saveTodayData(data);
    renderTasks();
    updateScore();
});

function renderTasks() {
    const list = document.getElementById("taskList");
    const data = getTodayData();
    list.innerHTML = "";

    data.tasks.forEach(t => {
        const div = document.createElement("div");
        div.textContent = `${t.name} (${t.points > 0 ? "+" : ""}${t.points})`;
        list.appendChild(div);
    });
}

function updateScore() {
    const data = getTodayData();
    const scoreBox = document.getElementById("dailyScore");
    scoreBox.textContent = data.totalScore;
    scoreBox.parentElement.classList.toggle("negative", data.totalScore < 0);
}

renderTasks();
updateScore();
