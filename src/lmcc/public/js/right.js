function defineWebSocketHandlers() {
    ws.onmessage = async function (event, isBinary) {
        var data = await event.data.text();
        var message = JSON.parse(data);
        var message_type = message["type"];
        console.log('Received ' + message_type + ' from ' + message["sender"]);

        if (message_type == "GEOPIN") {
            //alert("we got a geopin");
            // console.log(message["content"]);
            addGeoPin(message["content"]);
        } else if (message_type == "BREADCRUMBS1") {
            // Display the list of breadcrumbs
            // breadcrumbList.innerHTML = '';
            // console.log(message.content)
            // message.content.forEach(breadcrumb => {
            addBreadCrumb(message.content, 1)
            /*
            var li = document.createElement('li');
            var coords = message.content.coords;
            var desc = message.content.desc;
            li.textContent = `${desc}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
            breadcrumbList.appendChild(li);
            */
            // });
        } else if (message_type == "BREADCRUMBS2") {
            addBreadCrumb(message.content, 2)

        } else if (message_type == "ROVERPOS") {
            addBreadCrumb(message.content, 3)
        }
    };
}

defineWebSocketHandlers();


var LOCAL_DATA = {}
LOCAL_DATA["GEOPINS"] = [];
LOCAL_DATA["BREADCRUMBS1"] = [];
LOCAL_DATA["BREADCRUMBS2"] = [];
LOCAL_DATA["ROVERPOS"] = []

const TOP_LEFT_EASTING = 298305;
const TOP_LEFT_NORTHING = 3272438;

const BOT_RIGHT_EASTING = 298405;
const BOT_RIGHT_NORTHING = 3272330;

const ROCKYARD_WIDTH = BOT_RIGHT_EASTING - TOP_LEFT_EASTING;
const ROCKYARD_HEIGHT = TOP_LEFT_NORTHING - BOT_RIGHT_NORTHING;

var this_sender = "LMCC"// + String(new Date().getTime())

var geo_pin_list = document.getElementById("geo_pin_list")

function modifyGeoPinDesc(timestamp, element) {
    fetch('/modifygeopin/' + timestamp + "/" + element.value, {
        method: 'GET'
    })   
}

function requestGeoPinCreation() {
    var x = TOP_LEFT_EASTING + Number(document.getElementById('pinX').value);
    var y = TOP_LEFT_NORTHING - Number(document.getElementById('pinY').value);
    var desc = document.getElementById('pindesc').value;

    if (x == '' || y == '' || desc == '') {
        alert("Please enter a valid x-coord, y-coord, and description")
        return
    }

    const geopinData = {
        content: {
            coords: { x: x || undefined, y: y || undefined },
            timestamp: new Date().toISOString()
        }, // Will be ignored if undefined
        desc: desc,
        sender: this_sender, // Automatically set; adjust if needed for HMD
        type: "GEOPIN",
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
var MAPDOTS2 = []
var ROVERPOS = []

function addBreadCrumb(content, n) {
    if (n == 1) {
        LOCAL_DATA["BREADCRUMBS1"].push(content);
    }
    if (n == 2) {
        LOCAL_DATA["BREADCRUMBS2"].push(content);
    }
    if (n == 3) {
        LOCAL_DATA["ROVERPOS"].push(content);
    }


    var li1 = document.createElement('li');
    var coords = content.coords;
    li1.textContent = `(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
    // breadcrumbList1.prepend(li1);

    var dot;

    if (n == 1 || n == 2) {
        dot = document.createElement("span");
        dot.classList.add("mapdot" + String(n), "current-dot" + String(n)); // Add "current-dot" class to the new dot
    }
    if (n == 3) {
        dot = document.getElementById("roverdot");
    }

    var modified_x = coords.x - TOP_LEFT_EASTING;
    var modified_y = -1 * (coords.y - TOP_LEFT_NORTHING);
    dot.style.left = String(100 * modified_x.toFixed(2) / ROCKYARD_WIDTH) + "%";
    dot.style.top = String(100 * modified_y.toFixed(2) / ROCKYARD_HEIGHT) + "%";

    if (n == 1 || n == 2) {
        dot.appendChild(document.getElementById("EV" + String(n) + "_minimap_text"));
    }
    if (n == 3) {
        dot.appendChild(document.getElementById("rover_minimap_text"))
    }

    // Add the new dot to the beginning of the array
    if (n == 1 || n == 2) {
        document.getElementById("panel_minimap").appendChild(dot);
        if (n == 1) {
            MAPDOTS1.unshift(dot);
        }
        if (n == 2) {
            MAPDOTS2.unshift(dot)
        }
    }
    if (n == 3) {
        //ROVERPOS.unshift(dot);
    }


    var n_dots = 0;

    // Update the appearance of existing dots
    for (var dotlist of [MAPDOTS1, MAPDOTS2]) {
        for (let i = 0; i < dotlist.length; i++) {
            let opacity;
            if (i <= 10) {
                // Rapidly decrease opacity for the first 5 dots
                opacity = 1 - (i * 0.07);
            } else {
                // Set a low, fixed opacity for the trailing dots
                opacity = 0;
            }
            dotlist[i].style.opacity = opacity;

            // Remove the "current-dot" class from the trailing dots
            if (i > 0) {
                if (n == 1) {
                    dotlist[i].classList.remove("current-dot1");
                }
                if (n == 2) {
                    dotlist[i].classList.remove("current-dot2");
                }
            }

            if (i > 15) {
                //document.getElementById("panel_minimap").removeChild(dotlist[i])
            }
        }
    }
}

function addBreadCrumb1(content) {
    LOCAL_DATA["BREADCRUMBS1"].push(content);


    var li1 = document.createElement('li');
    var coords = content.coords;
    // var desc = content.desc;
    //${desc}:
    li1.textContent = `(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
    // breadcrumbList1.prepend(li1);

    var dot1 = document.createElement("span");
    dot1.classList.add("mapdot1", "current-dot1"); // Add "current-dot" class to the new dot
    var modified_x = coords.x - TOP_LEFT_EASTING;
    var modified_y = -1 * (coords.y - TOP_LEFT_NORTHING);
    dot1.style.left = String(100 * modified_x.toFixed(2) / ROCKYARD_WIDTH) + "%";
    dot1.style.top = String(100 * modified_y.toFixed(2) / ROCKYARD_HEIGHT) + "%";
    dot1.appendChild(document.getElementById("EV1_minimap_text"));

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

function addBreadCrumb2(content) {
    LOCAL_DATA["BREADCRUMBS2"].push(content);


    var li2 = document.createElement('li');
    var coords = content.coords;
    // var desc = content.desc;
    //${desc}:
    li2.textContent = `(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
    // breadcrumbList2.prepend(li2);

    var dot2 = document.createElement("span");
    dot2.classList.add("mapdot2", "current-dot2"); // Add "current-dot" class to the new dot
    
    var modified_x = coords.x - TOP_LEFT_EASTING;
    var modified_y = -1 * (coords.y - TOP_LEFT_NORTHING);
    dot2.style.left = String(100 * modified_x.toFixed(2) / ROCKYARD_WIDTH) + "%";
    dot2.style.top = String(100 * modified_y.toFixed(2) / ROCKYARD_HEIGHT) + "%";

    //dot2.style.left = String(100 * coords.x.toFixed(2) / 4251) + "%";
    //dot2.style.top = String(100 * coords.y.toFixed(2) / 3543) + "%";
    dot2.appendChild(document.getElementById("EV2_minimap_text"));

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


var select_color_timeout;
function blinkSelectedPin(n, color, el) {
    if (n == 0) {
        el.style.background = color;
        select_color_timeout = setTimeout(function() {
            el.style.background = 'rgba(200, 100, 100, 0.5)';
        }, 1500) 
        return
    }
    el.style.background = color;
    select_color_timeout = setTimeout(function() {
        el.style.background = '';
        select_color_timeout = setTimeout(function() {
            blinkSelectedPin(n - 1, color, el);
        }, 100)
    }, 100)
}

//custom Geopin
var MAPDOTSGEOPIN = []

var SELECTED_PIN_ELEMENT;

selectedPin = null;
function addGeoPin(content) {
    LOCAL_DATA["GEOPINS"].push(content)

    var li = document.createElement('li');

    // var x = Math.round(Number(content["coords"]["x"]) * 100) / 100
    // var y = Math.round(Number(content["coords"]["y"]) * 100) / 100

    var x = Number(content["coords"]["x"]).toFixed(2)
    var y = Number(content["coords"]["y"]).toFixed(2)

    var desc = document.createElement('input')
    desc.classList.add('geopin_desc_input')
    desc.value = content["desc"]

    li.appendChild(desc);
    li.appendChild(document.createElement("br"))
    li.appendChild(document.createTextNode("LOC: (" + x + ", " + y + ")"))
    li.setAttribute('data-coords', JSON.stringify({x: x, y: y}));
    li.setAttribute('timestamp', content["timestamp"]);

    desc.addEventListener('change', function () {
        modifyGeoPinDesc(content["timestamp"], desc)
    });

    geo_pin_list.prepend(li)

    var dot3 = document.createElement("img");
    dot3.src = "/images/geopin_3.png"
    dot3.style.zIndex = 2;
    dot3.width = String(document.getElementById("panel_minimap").clientHeight * 0.03)

    // we need the geo pin to have the bottom point be centered on the location
    // by default the position we give css/html will control the position of the top-left
    // corner of the image. thus we need to subtract the image height from the y
    // and half the image width from the x

    dot3.style.left = String(100 * (x - TOP_LEFT_EASTING) / ROCKYARD_WIDTH) + "%";
    dot3.style.top = String(-100 * (y - TOP_LEFT_NORTHING) / ROCKYARD_HEIGHT) + "%";
    dot3.style.position = "absolute"
    // dot3.style.width = "5%"
    // dot3.style.height = "5%"

    // dot.title = `${desc}: (${EVA1_x}, ${EVA1_y})`; // Tooltip text on hover

  

    // Add the new dot to the beginning of the array
    MAPDOTSGEOPIN.unshift(dot3);
    document.getElementById("panel_minimap").appendChild(dot3);

    dot3.onload = function() {
        var imgHeight = dot3.height;
        var imgWidth = dot3.width;

        console.log("height", imgHeight, imgWidth)

        dot3.style.left = String(100 * (x - TOP_LEFT_EASTING) / ROCKYARD_WIDTH) + "%";
        dot3.style.top = String(-100 * (y - TOP_LEFT_NORTHING) / ROCKYARD_HEIGHT) + "%";

    }

        // Add event listener for click event

    var listener = function() {
        clearTimeout(select_color_timeout)
        for (var child of geo_pin_list.children) {
            child.style.background = ''
        }
        // Highlight the corresponding list item
        var color = 'rgba(200, 255, 0, 0.5)'

        li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // document.getElementById('navigateButton').disabled = false;
        selectedPin = content;

        blinkSelectedPin(3, color, li);

        SELECTED_PIN_ELEMENT_DESC = desc;
    }
    dot3.addEventListener('click', listener);
    li.addEventListener('click', listener);

}

function sendNavTarget(content) {
    document.getElementById('selectedPin').innerText =
    `- Nav Target -
    < ${content['desc']} >
    x: ${content['coords']['x']}
    y: ${content['coords']['y']}
    `;

    content['type'] = "NAVTARGET";
    content['coords']['x'] = parseInt(content['coords']['x'])
    content['coords']['y'] = parseInt(content['coords']['y'])
    fetch('/navtarget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to send nav target');
        // return response.json(); // Or handle the response appropriately
    })
    .then(data => console.log('Nav target created:', data))
    .catch(error => console.error('Error creating nav target:', error));
}


//right click to make geopins
function createGeopinFromClick(x, y, desc) {
    if (!x || !y || !desc) {
        alert("Please enter a valid x-coord, y-coord, and description");
        return;
    }

    const geopinData = {
        content: {
            coords: { x: parseInt(x), y: parseInt(y) },
        },
        desc: desc,
        sender: this_sender,
        type: "GEOPIN",
        timestamp: new Date().toISOString()
    };

    fetch('/geopins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geopinData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to create geopin');
        console.log('Geopin created:', response);
        //alert('Geopin created successfully!');
    })
    .catch(error => console.error('Error creating geopin:', error));
}

//document.getElementById('navigateButton').disabled = true;
document.getElementById('navigateButton').addEventListener('click', function() {
    if (selectedPin == null) {
        return;
    }
    sendNavTarget(selectedPin);
    /*
    document.getElementById('selectedPin').innerText = 
    `SENT!
    x: ${selectedPin['coords']['x']}
    y: ${selectedPin['coords']['y']}
    Desc: ${selectedPin['desc']}
    `;
    */
});


// Right-click event listener for the minimap
document.getElementById('panel_minimap').addEventListener('contextmenu', function(event) {

    event.preventDefault(); // Prevent default context menu

    var rect = event.target.getBoundingClientRect();
        //alert(event.clientX + " " + event.clientY + " " + rect.left + " " + rect.top)

    var x = event.clientX - rect.left; // x position within the element.
    var y = event.clientY - rect.top;  // y position within the element.

    // var scaleX = 4251 / rect.width; // Adjust to your map's dimensions
    // var scaleY = 3543 / rect.height; // Adjust to your map's dimensions

    // var coordX = Math.round(x * scaleX);
    // var coordY = Math.round(y * scaleY);

    // Show the right-click menu at the mouse position

    var menu = document.getElementById('rightClickMenu');
    //menu.style.visibility = 'visible';
    //menu.style.position = 'absolute'
    var coordX = ROCKYARD_WIDTH * (event.clientX - rect.left) / rect.width
    var coordY = ROCKYARD_HEIGHT * (event.clientY - rect.top) / rect.height

    document.getElementById("pinX").value = Math.round(coordX)
    document.getElementById("pinY").value = Math.round(coordY)

    document.getElementById("pinCoords").textContent = "(" + Math.round(coordX) + ", " + Math.round(coordY) + ")"
});

// Event listener for submitting geopin from right-click
document.querySelector('#rightClickMenu button').addEventListener('click', function() {
    var x = document.getElementById('rightClickX').value;
    var y = document.getElementById('rightClickY').value;
    var desc = document.getElementById('rightClickDesc').value;

    if (!desc) {
        alert("Please enter a description.");
        return;
    }

    createGeopinFromClick(x, y, desc);

    // Hide the menu and clear inputs after submission
    document.getElementById('rightClickMenu').style.display = 'none';
    document.getElementById('rightClickDesc').value = '';
});

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



function addNewNote() {
    
}

// we need to keep this port value fixed, I guess
var EV1_IP = urlParams.get("ev1_addr");
var EV2_IP = urlParams.get("ev2_addr");

var hololens_feed_url = "https://HMD_ADDR/api/holographic/stream/live_low.mp4?holo=true&pv=true&mic=true&loopback=true&RenderFromCamera=true"

//document.getElementById("camfeed_1_src").src = hololens_feed_url.replaceAll("HMD_ADDR", EV1_IP)
document.getElementById("camfeed_2_src").src = hololens_feed_url.replaceAll("HMD_ADDR", EV2_IP)

//document.getElementById("camfeed_1_vid").load()
document.getElementById("camfeed_2_vid").load()

function clearNavTarget() {
    var clear_message = {
        content: {
            coords: { x: 0, y: 0 },
        },
        sender: this_sender, // Automatically set; adjust if needed for HMD
        type: "CLEARNAV",
    };

    document.getElementById("selectedPin").innerHTML = "- Nav Target -"

    ws.send(JSON.stringify(clear_message));
}

/*
fetch('/gatewayhost')
.then(response => {
    if (!response.ok) throw new Error('Failed to load gateway host');
    return response.text();
})
.then(data => {
    //ws = new WebSocket("ws://0.0.0.0:4761");
    defineWebSocketHandlers();
})
.catch(error => console.error('Error loading gateway host:', error));
*/

// when we load, check with the server for existing pins
fetch('/localdata/GEOPINS')
.then(response => {
    if (!response.ok) throw new Error('Failed to load existing geopins');
    return response.json();
})
.then(data => {
    for (let pin_num of Object.keys(data)) {
        console.log("load/creating geopin", data[pin_num])
        if (data[pin_num]["sender"] == this_sender) {
            addGeoPin(data[pin_num]["content"]);
        }
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
        //console.log("load/creating bcrumb", data[pin_num])
        addBreadCrumb(data[pin_num]["content"], 1);
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
        //console.log("load/creating bcrumb", data[pin_num])
        addBreadCrumb(data[pin_num]["content"], 2);
    }
})
.catch(error => console.error('Error loading existing breadcrumbs2:', error));

// initPeer("lmcc_right")
