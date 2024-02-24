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

 // should create WARNINGS indicating a switch using timestamps ~ (brainstorm)
 // the function calls with each console.log was used for testing, doesnt necessarily need to be kept.
 // alot of these switches (based on the task list) require specific timing. I think it would be a great idea to incorporate if statements/ timing warnings to aid the astronaut
 // organization is important 

 //START OF TESTING
  console.log('WebSocket connection established');
  // Usage
  UIA_EVA(function(powerStat, powerStat2, depress, oxyvent) {
    console.log('EVA1 Umbilical activated on UIA side: ' + powerStat + '\nEVA2 Umbilical activated on UIA side: ' + powerStat2) // This will log the powerStat value retrieved from the server
	console.log('Both Suits Depress Complete: ' + depress)
	console.log('Both suits oxygen ventilation status: ' + oxyvent)
  });


  DCU_EVA(function(eva1_battstat, eva2_battstat) { //can add stats to this function to save room?
    console.log('EVA1 Umbilical activated on DCU side: ' + eva1_battstat + '\nEVA2 Umbilical activated on DCU side: ' + eva2_battstat);
	//log multiple DCU EVA values HERE.
  });

  DCU_EVA(function(eva1_oxyfill, eva2_oxyfill) {
	console.log('Oxygen Fill - Primary Tank is active: ' + eva1_oxyfill)
	console.log('Oxygen Fill - Secondary Tank is active: ' + eva2_oxyfill)
	if(eva1_oxyfill == true) //a if statement could be useful wherever this information is displayed... to ensure that the correct tank is ACTIVE
	{
		UIA_EVA(function(oxysupply){
			console.log('EVA1 oxygen supply status: ' + oxysupply)

		})
	}
	if(eva2_oxyfill == true)
	{
		UIA_EVA(function(oxysupply2){
			console.log('EVA2 oxygen supply status: ' + oxysupply2)

		})
	}
  });

  DCU_EVA(function(eva1_pump, eva2_pump) {
	console.log('Primary Tank Pump is ON: ' + eva1_pump)
	console.log('Secondary Tank Pump is ON: ' + eva2_pump)
	//ensure pumps are active,
	UIA_EVA(function(eva1water_waste, eva2water_waste, eva1water_supply, eva2water_supply) {
		console.log('EVA1 coolant flushing: ' + eva1water_waste + '\nEVA2 coolant flushing: ' + eva2water_waste)
		console.log('EVA1 coolant is being supplied: ' + eva1water_supply + '\nEVA2 coolant is being supplied: ' + eva2water_supply)
	});
  }); 
};
//END OF TESTING

//creating a dictionary to store and place all of the switches
 // Usage
 let switchdictionary = {};

 UIA_EVA(function(powerStat, powerStat2, depress, oxyvent, oxysupply, oxysupply2, eva1water_waste, eva2water_waste, eva1water_supply, eva2water_supply) {
	switchdictionary["eva1power"] =  powerStat
	switchdictionary["eva2power"] =  powerStat2
	switchdictionary["depressstat"] = depress
	switchdictionary["oxy_vent"] = oxyvent
	switchdictionary["eva1_oxygen"] = oxysupply
	switchdictionary["eva2_oxygen"] = oxysupply2
	switchdictionary["eva1_waterwaste"] = eva1water_waste
	switchdictionary["eva2_waterwaste"] = eva2water_waste
	switchdictionary["eva1_watersupply"] = eva1water_supply
	switchdictionary["eva2_watersupply"] = eva2water_supply
	DCU_EVA(function(eva1_battstat, eva2_battstat, eva1_oxyfill, eva2_oxyfill, eva1_pump, eva2_pump) { //can add stats to this function to save room?
		switchdictionary["eva1_battstat"] = eva1_battstat
		switchdictionary["eva2_battstat"] = eva2_battstat
		switchdictionary["eva1_oxyfill"] = eva1_oxyfill
		switchdictionary["eva2_oxyfill"] = eva2_oxyfill
		switchdictionary["eva1_pump"] = eva1_pump
		switchdictionary["eva2_pump"] = eva2_pump

		console.log(Object.keys(switchdictionary))
		Switches(switchdictionary); // would need to call switches function HERE 
	  });
	});

//--------FUNCTION DEFS--------

function UIA_EVA(callback) {
    var georeq = new XMLHttpRequest();
    georeq.open("GET", CHECK_STATUIA)
    georeq.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var reqdata = this.responseText;
            var reqdata_json = JSON.parse(reqdata);
			var powerStat = reqdata_json["uia"]["eva1_power"]
			var powerStat2 = reqdata_json["uia"]["eva2_power"]
			var depress = reqdata_json["uia"]["depress"]
			var oxyvent = reqdata_json["uia"]["oxy_vent"]
			var oxysupply = reqdata_json["uia"]["eva1_oxy"]
			var oxysupply2 = reqdata_json["uia"]["eva2_oxy"]
			var eva1water_waste = reqdata_json["uia"]["eva1_water_waste"]
			var eva2water_waste = reqdata_json["uia"]["eva2_water_waste"]
			var eva1water_supply = reqdata_json["uia"]["eva1_water_supply"]
			var eva2water_supply = reqdata_json["uia"]["eva2_water_supply"]
			callback(powerStat, powerStat2, depress, oxyvent, oxysupply, oxysupply2, eva1water_waste, eva2water_waste, eva1water_supply, eva2water_supply);
            
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
			var eva1_battstat = reqdata_json["dcu"]["eva1"]["batt"]
			var eva2_battstat = reqdata_json["dcu"]["eva2"]["batt"]
			var eva1_oxyfill = reqdata_json["dcu"]["eva1"]["oxy"]
			var eva2_oxyfill = reqdata_json["dcu"]["eva2"]["oxy"]
			var eva1_pump = reqdata_json["dcu"]["eva1"]["pump"]
			var eva2_pump = reqdata_json["dcu"]["eva2"]["pump"]
            callback(eva1_battstat, eva2_battstat, eva1_oxyfill, eva2_oxyfill, eva1_pump, eva2_pump);
        }
    }
    georeq.send();
}

function Switches(switchdictionary){
	//can access each switch in the dictionary
	//How will we send??
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
