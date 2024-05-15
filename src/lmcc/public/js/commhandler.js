var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);

var GATEWAY_IP = urlParams.get("gateway_ip");

if (GATEWAY_IP == undefined) {
    GATEWAY_IP = prompt("Enter Gateway IP")
}

var ws = new WebSocket("ws://" + GATEWAY_IP + ":4761");



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
}

defineWebSocketHandlers();