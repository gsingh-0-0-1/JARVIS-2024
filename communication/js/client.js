const WebSocket = require('ws');

const HOST = '0.0.0.0';
const PORT = 14142;

if (process.argv.slice(2) == undefined) {
	console.log("Please specify user (HMD/LMCC) from command line argument!")
	console.log("Usage: node client.js <user>")
	process.exit(1)	
}
const USER = process.argv.slice(2);

const TSS_PORT = "14141"
const TSS_ADDR = "data.cs.purdue.edu"

const ws = new WebSocket('ws://' + HOST + ':' + String(PORT));

ws.onmessage = function (event) {
  console.log('Received message: ' + event.data);
  var data = JSON.parse(event.data)
  console.log(data["content"]["EVA1"]["x"])
};

ws.onopen = function (event) {
  console.log('WebSocket connection established');
};

function createGeoPin() {
	// TODO: Ask NASA about how to properly pull GeoData. The TSS
	// is being a bit annoying

	// Just going to load up some sample random content for now

	var data = {};
	var content = {"EVA1" : {
			"x" : 0, 
			"y" : 0
		}, 
		"EVA2" : {
			"x" : 0, 
			"y" : 0
		}
	};

	data["sender"] = USER;
	data["content"] = content;

	ws.send(JSON.stringify(data))
}

