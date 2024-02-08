const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs')
var XMLHttpRequest = require('xhr2');


/*

--------CONFIG INITIALIZATION--------

*/

const CONFIG = JSON.parse(fs.readFileSync('../config.json'));

const HOST = CONFIG['LMCC']['HOST'];
const PORT_WEB = CONFIG['LMCC']['PORT_WEB'];

// the gateway and LMCC will be on the same machine
const GATEWAY_HOST = 'localhost';
const GATEWAY_PORT = CONFIG['GATEWAY']['PORT_SOC'];

const TSS_PORT = CONFIG['TSS']['PORT_WEB'];
const TSS_ADDR = CONFIG['TSS']['HOST'];

const USER = "LMCC";

const TSS_FULL_HTTP = "http://" + TSS_ADDR + ":" + TSS_PORT
const GEO_ENDPOINT = TSS_FULL_HTTP + "/json_data/IMU.json"


/*

--------SERVER & SOCKET INITIALIZATION--------

*/

const app = express();
const server = http.createServer(app);
app.use(express.static('public'))


var LOCAL_DATA = {}
LOCAL_DATA["GEOPINS"] = {};
const ws = new WebSocket('ws://' + GATEWAY_HOST + ':' + GATEWAY_PORT);

ws.onmessage = function (event) {
	var message = JSON.parse(event.data)
	var message_type = message["type"];
 	console.log('Received ' + message_type + ' from ' + message["sender"]);
 	if (message_type == "GEOPIN") {
 		console.log(message["content"])
 		let npins = Object.keys(LOCAL_DATA["GEOPINS"]).length
 		LOCAL_DATA["GEOPINS"][npins] = message["content"]
 	}
};

ws.onopen = function (event) {
  console.log('WebSocket connection established');
};


/*

--------FUNCTION DEFS--------

*/

function createGeoPin(description = '') {
	// TODO: Ask NASA about how to properly pull GeoData. The TSS
	// is being a bit annoying

	// Just going to load up some sample random content for now

	var georeq = new XMLHttpRequest();
	georeq.open("GET", GEO_ENDPOINT)
	georeq.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var reqdata = this.responseText;
			var reqdata_json = JSON.parse(reqdata);

			var data = {};
			var content = {"EVA1" : {
					"x" : reqdata_json["imu"]["eva1"]["posx"], 
					"y" : reqdata_json["imu"]["eva1"]["posy"]
				}, 
				"EVA2" : {
					"x" : reqdata_json["imu"]["eva2"]["posx"], 
					"y" : reqdata_json["imu"]["eva2"]["posy"]
				},
				"desc" : description
			};

			data["sender"] = USER;
			data["type"] = "GEOPIN"
			data["content"] = content;

			ws.send(String(JSON.stringify(data)))
		
		}
	}
	georeq.send()
}

function simulateGeoPinCreation() {
	console.log("Simulating geopin creation...")
	createGeoPin("default geo pin")
}


/*

--------ROUTES AND SUCH--------

*/


app.get('/', (req, res) => {
	res.sendFile("public/templates/main.html", {root: __dirname});
});

app.get('/creategeopin', (req, res) => {
	simulateGeoPinCreation()
	// resource created
	res.sendStatus(201);
});

app.get('/localdata/:item', (req, res) => {
	res.send(LOCAL_DATA[req.params.item]);
})


server.listen(PORT_WEB, HOST, () => console.log(`Server running on port ${PORT_WEB}`));
