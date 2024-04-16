// beginCall("lmcc_left", "lmcc_right")
// initPeer("lmcc_left")
var TSS_ADDR;


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
            let result_telemetry_nominal = ''

            let result_value = ''
            let result_value_nominal = ''

            for (var i = 0; i < items.length; i++) {
                const item = items[i][1]
                if (item['eva'] == eva) {
                    if (item['color'] == 'red-text') {
						result_telemetry = `<span class="${item['color']}">
                    	${item['name']}
                    	</span><br>` + result_telemetry;

	                    result_value = `<span class="${item['color']}">
	                    ${item['val']} ${item['unit']}
	                    </span><br>` + result_value;
	                }
	                if (item['color'] == 'yellow-text') {
	                	result_telemetry += `<span class="${item['color']}">
                    	${item['name']}
                    	</span><br>`;

	                	result_value += `<span class="${item['color']}">
	                    ${item['val']} ${item['unit']}
	                    </span><br>`;
	                }
	                if (item['color'] == 'green-text') {
	                	result_telemetry_nominal += `<span class="${item['color']}">
                    	${item['name']}
                    	</span><br>`;

	                	result_value_nominal += `<span class="${item['color']}">
	                    ${item['val']} ${item['unit']}
	                    </span><br>`;
	                }
                }
            }

            document.getElementById(`${eva}_telemetry`).innerHTML = result_telemetry + result_telemetry_nominal
            document.getElementById(`${eva}_value`).innerHTML = result_value + result_value_nominal
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


        var result_name = ''
        var result_value = ''

        for (var i = 0; i < items.length; i++) {
            const item = items[i][1]
            var name = item['name'].split('_').join(' ')

            // https://stackoverflow.com/a/4878800/10693624
            name = name.toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ');

            var val = String(item['val'])
            if (item['val'] == true) {
            	val = 'ERROR'
            }
            else {
            	val = 'OK'
            }

            result_name += `<span class="${item['color']}">
                ${name}
                </span><br>`;
            result_value += `<span class="${item['color']}">
                ${val}
                </span><br>`;
        }

        document.getElementById(`error_name`).innerHTML = result_name
        document.getElementById(`error_value`).innerHTML = result_value
	})
    .catch(error => console.error('Error creating error:', error));

}

var comp_minerals = ['SiO2', 'TiO2', 'Al2O3', 'FeO', 'MnO', 'MgO', 'CaO', 'K2O', 'P2O3', 'other']
var sig_op = ['<', '>', '>', '>', '>', '>', '>', '>', '>', '>']
var sig_amt = [10, 1, 10, 29, 1, 20, 10, 1, 1.5, 50]


function setUpGeoPanel() {
	var evs = ['1', '2']
	var row_pos = [35, 75]

	var bre = document.createElement("br")
	document.getElementById("panel_geo_sampling").appendChild(bre)

	var y = 0;
	var x = 0;

	for (var ev of evs) {
		x = 0
		for (var min of comp_minerals) {
			var el = document.createElement("div")
			el.id = "geo_item_ev" + ev + "_" + min.toLowerCase()
			el.classList.add("geo_item")

			el.textContent = 0
			el.style.left = (100 * x / comp_minerals.length + 100 / (comp_minerals.length * 2)) + "%"
			el.style.top = (row_pos[y]) + "%"
			document.getElementById("panel_geo_sampling").appendChild(el)



			var cap = document.createElement("div")
			cap.id = "geo_item_ev" + ev + "_" + min.toLowerCase() + "_cap"
			cap.classList.add("geo_caption")

			cap.innerHTML = comp_minerals[x]
			cap.style.left = (100 * x / comp_minerals.length + 100 / (comp_minerals.length * 2)) + "%"
			cap.style.top = (row_pos[y] + 10) + "%"
			document.getElementById("panel_geo_sampling").appendChild(cap)

			x = x + 1
		}
		y = y + 1
	}

	setTimeout(fetchSpecData, 1000)
}


function fetchSpecData() {
	fetch('/specdata')
	.then(response => {
	    if (!response.ok) throw new Error('Failed to load spec data');
	    return response.json();
	})
	.then(data => {
		var spec_data = data['spec']
		for (var ev of ['1', '2']) {
			var mineral_data = spec_data["eva" + ev]["data"]
			var x = 0;
			for (var key of Object.keys(mineral_data)) {
				var el = document.getElementById("geo_item_ev" + ev + "_" + key.toLowerCase())
				var cap = document.getElementById("geo_item_ev" + ev + "_" + key.toLowerCase() + "_cap")
				var col = "#ff1111"
				el.textContent = mineral_data[key]
				if (sig_op[x] == '<') {
					if (Number(mineral_data[key]) < sig_amt[x]) {
						el.style.color = col
						cap.style.color = col
					}
				}
				if (sig_op[x] == '>') {
					if (Number(mineral_data[key]) > sig_amt[x]) {
						el.style.color = col
						cap.style.color = col
					}
				}
				x = x + 1
			}
		}
		setTimeout(fetchSpecData, 1000)
	})
	.catch(error => console.error('Error parsing spec data:', error));
}


fetch('/tsshost')
.then(response => {
    if (!response.ok) throw new Error('Failed to load tss address');
    return response.text();
})
.then(data => {
	TSS_ADDR = data
})
.catch(error => console.error('Error loading tss address:', error));

setUpGeoPanel()

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
