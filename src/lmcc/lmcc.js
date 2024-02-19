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
const GATEWAY_HOST = '0.0.0.0'; //'localhost';
const GATEWAY_PORT = CONFIG['GATEWAY']['PORT_SOC'];

const TSS_PORT = CONFIG['TSS']['PORT_WEB'];
const TSS_ADDR = CONFIG['TSS']['HOST'];

const USER = "LMCC";

const TSS_FULL_HTTP = "http://" + TSS_ADDR + ":" + TSS_PORT
const GEO_ENDPOINT = TSS_FULL_HTTP + "/json_data/IMU.json"
const CHECK_STATUIA = TSS_FULL_HTTP + "/json_data/UIA.json"
const CHECK_STATDCU = TSS_FULL_HTTP + "/json_data/DCU.json"


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
  // Usage
  EVA1_powerstat(function(powerStat) {
    console.log('UIA EVA1 Power Complete: '+ powerStat); // This will log the powerStat value retrieved from the server
  });

  DCU_EVA(function(eva1_battstat) { //can add stats to this function to save room?
    console.log('DCU EVA1 Battery Complete: '+ eva1_battstat);
	//log multiple DCU EVA values HERE.
  });


};

//--------FUNCTION DEFS--------
//start of my addition

function EVA1_powerstat(callback) {
    var georeq = new XMLHttpRequest();
    georeq.open("GET", CHECK_STATUIA)
    georeq.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var reqdata = this.responseText;
            var reqdata_json = JSON.parse(reqdata);
			var powerStat = reqdata_json["uia"]["eva1_power"];
            callback(powerStat);
        }
    }
    georeq.send();
}

function DCU_EVA(callback) {
    var georeq = new XMLHttpRequest();
    georeq.open("GET", CHECK_STATDCU)
	georeq.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var reqdata = this.responseText;
            var reqdata_json = JSON.parse(reqdata);
			var eva1_battstat = reqdata_json["dcu"]["eva1"]["batt"];
            callback(eva1_battstat);
        }
    }
    georeq.send();
}
//end of my addition

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
	res.redirect("/right")
	//res.sendFile("public/templates/right.html", {root: __dirname});
});

app.get('/right', (req, res) => {
	res.sendFile("public/templates/right.html", {root: __dirname});
});

app.get('/left', (req, res) => {
	res.sendFile("public/templates/left.html", {root: __dirname});
});


app.get('/creategeopin/:desc', (req, res) => {
	createGeoPin(req.params.desc)
	// resource created
	res.sendStatus(201);
});

app.get('/localdata/:item', (req, res) => {
	res.send(LOCAL_DATA[req.params.item]);
})


server.listen(PORT_WEB, HOST, () => console.log(`Server running on port ${PORT_WEB}`));
