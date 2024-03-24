var LOCAL_DATA = {}
LOCAL_DATA["GEOPINS"] = [];
LOCAL_DATA["BREADCRUMBS"] = [];

var geo_pin_list = document.getElementById("geo_pin_list")

// we need to keep this port value fixed, I guess
const ws = new WebSocket('ws://' + "0.0.0.0" + ':' + "4761");

function requestGeoPinCreation() {
    const x = document.getElementById('pinX').value;
    const y = document.getElementById('pinY').value;
    const desc = document.getElementById('pindesc').value;

    const geopinData = {
        content: {
            coords: { x: x || undefined, y: y || undefined },
        }, // Will be ignored if undefined
        desc: desc,
        sender: "LMCC", // Automatically set; adjust if needed for HMD
        type: "GEOPIN",
        timestamp: new Date().toISOString()
    };

    // console.log(geopinData)

    // Use fetch to send data
    fetch('/geopins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geopinData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to create geopin');
        // return response.json(); // Or handle the response appropriately
    })
    .then(data => console.log('Geopin created:', data))
    .catch(error => console.error('Error creating geopin:', error));
}


var breadcrumbList = document.getElementById("breadcrumb_list");
var breadcrumbsVisible = true;

function toggleBreadcrumbs() {
    var breadcrumbList = document.getElementById("breadcrumb_list");
    var toggleCheckbox = document.getElementById("breadcrumbToggle");
  
    if (toggleCheckbox.checked) {
        /*
		fetch('/breadcrumbs')
			.then(response => response.json())
			.then(breadcrumbs => {
				breadcrumbList.innerHTML = '';
				breadcrumbs.forEach(breadcrumb => {
					var li = document.createElement('li');
					var coords = breadcrumb.coords;
					var desc = breadcrumb.desc;
					li.textContent = `${desc}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
					breadcrumbList.appendChild(li);
				});
				toggleButton.classList.add("active");
			})
			.catch(error => console.error('Error fetching breadcrumbs:', error));
            */
        breadcrumbList.style.display = "block"
	} else {
        breadcrumbList.style.display = "none"
		//breadcrumbList.innerHTML = '';
		// toggleButton.classList.remove("active");
	}

}


var MAPDOTS = []

function addBreadCrumb(content) {
    LOCAL_DATA["BREADCRUMBS"].push(content);

    var li = document.createElement('li');
    var coords = content.coords;
    var desc = content.desc;
    li.textContent = `${desc}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
    breadcrumbList.appendChild(li);

    var dot = document.createElement("span");
    dot.classList.add("mapdot", "current-dot"); // Add "current-dot" class to the new dot
    dot.style.left = String(100 * coords.x.toFixed(2) / 4251) + "%";
    dot.style.top = String(100 * coords.y.toFixed(2) / 3543) + "%";
    

    // Add the new dot to the beginning of the array
    MAPDOTS.unshift(dot);
    document.getElementById("panel_minimap").appendChild(dot);

    // Update the appearance of existing dots
    for (let i = 0; i < MAPDOTS.length; i++) {
        let opacity;
        if (i <= 5) {
            // Rapidly decrease opacity for the first 5 dots
            opacity = 1 - (i * 0.12);
        } else {
            // Set a low, fixed opacity for the trailing dots
            opacity = 0.4;
        }
        MAPDOTS[i].style.opacity = opacity;

        // Remove the "current-dot" class from the trailing dots
        if (i > 0) {
            MAPDOTS[i].classList.remove("current-dot");
        }
    }
}






function addGeoPin(content) {
    LOCAL_DATA["GEOPINS"].push(content)

    var li = document.createElement('li');

    var EVA1_x = Math.round(Number(content["coords"]["x"]) * 100) / 100
    var EVA1_y = Math.round(Number(content["coords"]["y"]) * 100) / 100

    li.appendChild(document.createTextNode(content["desc"]));
    li.appendChild(document.createElement("br"))
    li.appendChild(document.createTextNode("-: (" + EVA1_x + ", " + EVA1_y + ")"))

    geo_pin_list.appendChild(li)
}



//function toggleTaskState() {
    // Get the button element
    //var button = document.getElementById('button_task_toggle');

    // Check the current state
    //if (button.innerText === 'Task: Not Started') {
      //  button.innerText = 'Task: Ongoing';
        //button.classList.remove('not-started'); // Remove not-started class
     //   button.classList.add('ongoing'); // Add ongoing class
    //} else if (button.innerText === 'Task: Ongoing') {
     //   button.innerText = 'Task: Completed';
      //  button.classList.remove('ongoing'); // Remove ongoing class
       // button.classList.add('completed'); // Add completed class
    //} else {
     //   button.innerText = 'Task: Not Started';
      //  button.classList.remove('completed'); // Remove completed class
       // button.classList.add('not-started'); // Add not-started class
    //}

    // make function call 
//}

ws.onmessage = async function (event, isBinary) {
	var data = await event.data.text();
	var message = JSON.parse(data);
	var message_type = message["type"];
	// console.log('Received ' + message_type + ' from ' + message["sender"]);

	if (message_type == "GEOPIN") {
		// console.log(message["content"]);
		addGeoPin(message["content"]);
	} else if (message_type == "BREADCRUMBS") {
		// Display the list of breadcrumbs
		// breadcrumbList.innerHTML = '';
        // console.log(message.content)
		// message.content.forEach(breadcrumb => {
        addBreadCrumb(message.content)
		/*
        var li = document.createElement('li');
		var coords = message.content.coords;
		var desc = message.content.desc;
		li.textContent = `${desc}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
		breadcrumbList.appendChild(li);
        */
		// });
	}
};


// when we load, check with the server for existing pins
fetch('/localdata/GEOPINS')
.then(response => {
    if (!response.ok) throw new Error('Failed to load existing geopins');
    return response.json();
})
.then(data => {
    for (let pin_num of Object.keys(data)) {
        console.log("load/creating geopin", data[pin_num])
        addGeoPin(data[pin_num]["content"]);
    }
})
.catch(error => console.error('Error loading existing geopins:', error));

// when we load, check with the server for existing breadcrumbs
fetch('/localdata/BREADCRUMBS')
.then(response => {
    if (!response.ok) throw new Error('Failed to load existing breadcrumbs');
    return response.json();
})
.then(data => {
    for (let pin_num of Object.keys(data)) {
        console.log("load/creating bcrumb", data[pin_num])
        addBreadCrumb(data[pin_num]["content"]);
    }
})
.catch(error => console.error('Error loading existing breadcrumbs:', error));


// initPeer("lmcc_right")

