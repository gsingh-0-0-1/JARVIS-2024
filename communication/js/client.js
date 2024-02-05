const WebSocket = require('ws');
var XMLHttpRequest = require('xhr2');

const HOST = '0.0.0.0';
const PORT = 14142;

if (process.argv.slice(2) == undefined || process.argv.slice(2) == '') {
	console.log("Please specify user (HMD/LMCC) from command line argument!")
	console.log("Usage: node client.js <user>")
	process.exit(1)	
}
const USER = process.argv.slice(2);

const TSS_PORT = "14141"
const TSS_ADDR = "data.cs.purdue.edu"

const GEO_ENDPOINT = "http://" + TSS_ADDR + ":" + TSS_PORT + "/json_data/IMU.json"

const ws = new WebSocket('ws://' + HOST + ':' + String(PORT));

ws.onmessage = function (event) {
	var message = JSON.parse(event.data)
	var message_type = message["type"];
 	console.log('Received ' + message_type + ' from ' + message["sender"]);
 	if (message_type == "GEOPIN") {
 		console.log(message["content"])
 	}
};

ws.onopen = function (event) {
  console.log('WebSocket connection established');
};

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

			ws.send(JSON.stringify(data))
		
		}
	}
	georeq.send()
}

function simulateGeoPinCreation() {
	console.log("Simulating geopin creation...")
	createGeoPin("default geo pin")
}

setInterval(simulateGeoPinCreation, 2000)
