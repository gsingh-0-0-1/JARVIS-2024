// beginCall("lmcc_left", "lmcc_right")
// initPeer("lmcc_left")

function createTask() {
    var activeTask = document.getElementById('taskSelector').value;
    var taskName = document.getElementById(activeTask).textContent;
    var taskString = document.getElementById('task_description').value;

    taskString = taskString + "\n" + document.getElementById("task_tss_vars").value

    //alert(taskString)

    fetch('/createTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: activeTask,
        taskContent: taskString })
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
		document.getElementById("task_description").value = data.split("\n").slice(0, -1).join("\n")
		document.getElementById("task_tss_vars").value = data.split("\n").slice(-1)
	})
    .catch(error => console.error('Error creating task:', error));
}

fetchAllTasks()

function displayTelemetry(){
    fetch('/localdata/TELEMETRY')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch telemetry');
        return response.text()
    })
	.then(data => {
        jsonObjects = JSON.parse(data)

        var items = Object.keys(jsonObjects).map(function (key) {
            return [key, jsonObjects[key]];
        });

        var evas = ['eva1', 'eva2'];
        for (let eva of evas) {
            let result_telemetry = ''
            let result_value = ''

            for (var i = 0; i < items.length; i++) {
                const item = items[i][1]
                if (item['eva'] == eva) {
                    result_telemetry += `<span class="${item['color']}">
                    ${item['name']}
                    </span><br>`;
                    result_value += `<span class="${item['color']}">
                    ${item['val']} ${item['unit']}
                    </span><br>`;
                }
            }

            document.getElementById(`${eva}_telemetry`).innerHTML = result_telemetry
            document.getElementById(`${eva}_value`).innerHTML = result_value
        }
	})
    .catch(error => console.error('Error creating telemetry:', error));

}


displayTelemetry()
window.setInterval(displayTelemetry, 1000)

function displayErrors(){
    fetch('/localdata/ERRORS')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch errors');
        return response.text()
    })
	.then(data => {
        jsonObjects = JSON.parse(data)

        var items = Object.keys(jsonObjects).map(function (key) {
            return [key, jsonObjects[key]];
        });


        result_name = ''
        result_value = ''

        for (var i = 0; i < items.length; i++) {
            const item = items[i][1]
            var name = item['name'].split('_').join(' ')

            // https://stackoverflow.com/a/4878800/10693624
            name = name.toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ');
            result_name += `<span class="${item['color']}">
                ${name}
                </span><br>`;
            result_value += `<span class="${item['color']}">
                ${item['val']}
                </span><br>`;
        }

        document.getElementById(`error_name`).innerHTML = result_name
        document.getElementById(`error_value`).innerHTML = result_value
	})
    .catch(error => console.error('Error creating error:', error));

}

displayErrors()
window.setInterval(displayErrors, 1000)


function toggleHelpPanel() {
    var panel = document.getElementById('helpPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
    }
}

document.getElementById('helpBtn').addEventListener('click', toggleHelpPanel);
