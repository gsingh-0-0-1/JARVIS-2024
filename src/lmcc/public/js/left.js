// beginCall("lmcc_left", "lmcc_right")
// initPeer("lmcc_left")

function createTask() {
    var taskName = document.getElementById('taskSelector').value;

    fetch('/createTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: taskName })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to create task');
    })
    .catch(error => console.error('Error creating task:', error));
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function fetchAllTasks() {
	var taskCatSel = document.getElementById('taskCategorySelector');
	var taskSel = document.getElementById('taskSelector');

    fetch('/alltasks')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json()
    })
	.then(data => {
		console.log(data)
		taskSel.replaceChildren([]);
		for (var task of data) {
			if (task == '\n' || task == '') {
				continue
			}

			var el = document.createElement("option");
			el.value = task.split(".")[0];
			var this_task_cat = task.split("_")[0]
			el.textContent = capitalizeFirstLetter(this_task_cat) + " " + task.split("_")[1].split(".")[0]
			if ("cat_" + this_task_cat == taskCatSel.value) {
				taskSel.appendChild(el)
			}
		}

		displaySelectedTask()
	})
    .catch(error => console.error('Error creating task:', error));
}

function displaySelectedTask() {
	var task = document.getElementById('taskSelector').value.toLowerCase()

    fetch('/tasks/' + task + '.txt')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.text()
    })
	.then(data => {
		console.log(data)
		document.getElementById("task_description").innerHTML = data.split("\n").slice(0, -1).join("<br>")
	})
    .catch(error => console.error('Error creating task:', error));
}

fetchAllTasks()

function displayBiometrics(){
    fetch('/localdata/BIOMETRICS')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch biometrics');
        return response.text()
    })
	.then(data => {
        const jsonObject = JSON.parse(data)
        let result = ''
        for (const key in jsonObject) {
            result += `<span class="${jsonObject[key]['color']}">${key}: ${jsonObject[key]['val']}</span><br>`;
        }

		document.getElementById("biometrics").innerHTML = result

	})
    .catch(error => console.error('Error creating task:', error));

}

displayBiometrics()
window.setInterval(displayBiometrics, 1000)

function displayTimers(){
    fetch('/localdata/TIMERS')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch biometrics');
        return response.text()
    })
	.then(data => {
        const jsonObject = JSON.parse(data)
        let result = ''
        for (const key in jsonObject) {
            result += `${key}: ${jsonObject[key]}<br>`
        }
		document.getElementById("timers").innerHTML = result
	})
    .catch(error => console.error('Error creating task:', error));

}

displayTimers()
window.setInterval(displayTimers, 1000)

function displayAlerts(){
    fetch('/localdata/ALERTS')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch biometrics');
        return response.text()
    })
	.then(data => {
        const jsonObject = JSON.parse(data)
        let result = ''
        for (const key in jsonObject) {
            result += `<span class="${jsonObject[key]['color']}">${key}: ${jsonObject[key]['val']}</span><br>`;
        }
		document.getElementById("alerts").innerHTML = result
	})
    .catch(error => console.error('Error creating task:', error));

}

displayAlerts()
window.setInterval(displayAlerts, 1000)
