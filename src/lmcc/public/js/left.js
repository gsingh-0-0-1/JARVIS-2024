// beginCall("lmcc_left", "lmcc_right")
// initPeer("lmcc_left")

function createTask() {
    var activeTask = document.getElementById('taskSelector').value;
    var taskName = document.getElementById(activeTask).textContent;

    fetch('/createTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: activeTask })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create task');
        }
        else {
            document.getElementById("task_confirmation").innerHTML = `EV's have been sent task ${taskName}.`
        }
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
            var formattedTaskName = capitalizeFirstLetter(this_task_cat) + " " + task.split("_")[1].split(".")[0]
			el.textContent = formattedTaskName;
            el.id = el.value;
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
            var val = jsonObject[key].replace("s", "")
            
            var hour = Math.floor(Number(val / 3600))
            var minute = Math.floor((Number(val) - (hour * 3600)) / 60)
            var second = val - (hour * 3600) - (minute * 60)

            if (String(minute).length == 1) {
                minute = '0' + minute
            }

            if (String(second).length == 1) {
                minute = '0' + minute
            }
    
            var str = hour + ":" + minute + ":" + second

            result += `${key}: ${str}<br>`
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
        jsonObjects = JSON.parse(data)

        var items = Object.keys(jsonObjects).map(function (key) {
            return [key, jsonObjects[key]];
        });

        items.sort(function (first, second) {
            if (first[1]['color'] == 'red-text') {
                return -1
            }
            if (second[1]['color'] == 'red-text') {
                return 1
            }
            return 0
        });

        console.log(items)

        let result = ''

        for (var i = 0; i < items.length; i++) {
            const item = items[i]
            result += `<span class="${item[1]['color']}">${item[0]}: ${item[1]['val']}</span><br>`;
        }

		document.getElementById("alerts").innerHTML = result
	})
    .catch(error => console.error('Error creating task:', error));

}

displayAlerts()
window.setInterval(displayAlerts, 1000)
