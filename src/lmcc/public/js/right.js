var LOCAL_DATA = {}
LOCAL_DATA["GEOPINS"] = [];
LOCAL_DATA["BREADCRUMBS1"] = [];
LOCAL_DATA["BREADCRUMBS2"] = [];


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


var breadcrumbList1 = document.getElementById("eva1_breadcrumb_list");
var breadcrumbList2 = document.getElementById("eva2_breadcrumb_list");


var breadcrumbsVisible = true;

function toggleBreadcrumbs() {
    var breadcrumbList1 = document.getElementById("eva1_breadcrumb_list");
    var breadcrumbList2 = document.getElementById("eva2_breadcrumb_list");

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
        breadcrumbList1.style.display = "block"
        breadcrumbList2.style.display = "block"

	} else {
        breadcrumbList1.style.display = "none"
        breadcrumbList2.style.display = "none"

		//breadcrumbList.innerHTML = '';
		// toggleButton.classList.remove("active");
	}

}


var MAPDOTS1 = []

function addBreadCrumb1(content) {
    LOCAL_DATA["BREADCRUMBS1"].push(content);


    var li1 = document.createElement('li');
    var coords = content.coords;
    var desc = content.desc;
    li1.textContent = `${desc}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
    breadcrumbList1.prepend(li1);

    var dot1 = document.createElement("span");
    dot1.classList.add("mapdot1", "current-dot1"); // Add "current-dot" class to the new dot
    dot1.style.left = String(100 * coords.x.toFixed(2) / 4251) + "%";
    dot1.style.top = String(100 * coords.y.toFixed(2) / 3543) + "%";
    

    // Add the new dot to the beginning of the array
    MAPDOTS1.unshift(dot1);
    document.getElementById("panel_minimap").appendChild(dot1);

    // Update the appearance of existing dots
    for (let i = 0; i < MAPDOTS1.length; i++) {
        let opacity;
        if (i <= 10) {
            // Rapidly decrease opacity for the first 5 dots
            opacity = 1 - (i * 0.07);
        } else {
            // Set a low, fixed opacity for the trailing dots
            opacity = 0.3;
        }
        MAPDOTS1[i].style.opacity = opacity;

        // Remove the "current-dot" class from the trailing dots
        if (i > 0) {
            MAPDOTS1[i].classList.remove("current-dot1");
        }
    }
}


var MAPDOTS2 = []

function addBreadCrumb2(content) {
    LOCAL_DATA["BREADCRUMBS2"].push(content);


    var li2 = document.createElement('li');
    var coords = content.coords;
    var desc = content.desc;
    li2.textContent = `${desc}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
    breadcrumbList2.prepend(li2);

    var dot2 = document.createElement("span");
    dot2.classList.add("mapdot2", "current-dot2"); // Add "current-dot" class to the new dot
    dot2.style.left = String(100 * coords.x.toFixed(2) / 4251) + "%";
    dot2.style.top = String(100 * coords.y.toFixed(2) / 3543) + "%";
    

    // Add the new dot to the beginning of the array
    MAPDOTS2.unshift(dot2);
    document.getElementById("panel_minimap").appendChild(dot2);

    // Update the appearance of existing dots
    for (let i = 0; i < MAPDOTS2.length; i++) {
        let opacity;
        if (i <= 10) {
            // Rapidly decrease opacity for the first 5 dots
            opacity = 1 - (i * 0.07);
        } else {
            // Set a low, fixed opacity for the trailing dots
            opacity = 0.3;
        }
        MAPDOTS2[i].style.opacity = opacity;

        // Remove the "current-dot" class from the trailing dots
        if (i > 0) {
            MAPDOTS2[i].classList.remove("current-dot2");
        }
    }
}


//custom Geopin
var MAPDOTSGEOPIN = []


function addGeoPin(content) {
    LOCAL_DATA["GEOPINS"].push(content)

    var li = document.createElement('li');

    var EVA1_x = Math.round(Number(content["coords"]["x"]) * 100) / 100
    var EVA1_y = Math.round(Number(content["coords"]["y"]) * 100) / 100

    li.appendChild(document.createTextNode(content["desc"]));
    li.appendChild(document.createElement("br"))
    li.appendChild(document.createTextNode("-: (" + EVA1_x + ", " + EVA1_y + ")"))

    geo_pin_list.prepend(li)

    var dot3 = document.createElement("span");
    dot3.classList.add("mapdot3"); // Add "current-dot" class to the new dot
    dot3.style.left = String(100 * EVA1_x / 4251) + "%";
    dot3.style.top = String(100 * EVA1_y / 3543) + "%";

    // dot.title = `${desc}: (${EVA1_x}, ${EVA1_y})`; // Tooltip text on hover

  

      // Add the new dot to the beginning of the array
      MAPDOTSGEOPIN.unshift(dot3);
      document.getElementById("panel_minimap").appendChild(dot3);

        // Add event listener for click event
    dot3.addEventListener('click', function() {
        // Highlight the corresponding list item
        li.scrollIntoView({ behavior: 'smooth', block: 'center' });
        li.style.background = 'rgba(255, 255, 0, 0.5)'; // Yellow with 80% opacity

        setTimeout(() => li.style.background = '', 3000); // Remove highlight after 3 seconds
    });

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
	} else if (message_type == "BREADCRUMBS1") {
		// Display the list of breadcrumbs
		// breadcrumbList.innerHTML = '';
        // console.log(message.content)
		// message.content.forEach(breadcrumb => {
        addBreadCrumb1(message.content)
		/*
        var li = document.createElement('li');
		var coords = message.content.coords;
		var desc = message.content.desc;
		li.textContent = `${desc}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
		breadcrumbList.appendChild(li);
        */
		// });
	}  else if (message_type == "BREADCRUMBS2") {
        addBreadCrumb2(message.content)

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
fetch('/localdata/BREADCRUMBS1')
.then(response => {
    if (!response.ok) throw new Error('Failed to load existing breadcrumbs1');
    return response.json();
})
.then(data => {
    for (let pin_num of Object.keys(data)) {
        console.log("load/creating bcrumb", data[pin_num])
        addBreadCrumb1(data[pin_num]["content"]);
    }
})
.catch(error => console.error('Error loading existing breadcrumbs1:', error));




//EVA 2
// when we load, check with the server for existing breadcrumbs
fetch('/localdata/BREADCRUMBS2')
.then(response => {
    if (!response.ok) throw new Error('Failed to load existing breadcrumbs2');
    return response.json();
})
.then(data => {
    for (let pin_num of Object.keys(data)) {
        console.log("load/creating bcrumb", data[pin_num])
        addBreadCrumb2(data[pin_num]["content"]);
    }
})
.catch(error => console.error('Error loading existing breadcrumbs2:', error));


// initPeer("lmcc_right")

