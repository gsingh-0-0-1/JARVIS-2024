const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs')
const XMLHttpRequest = require('xhr2');


/*

--------CONFIG INITIALIZATION--------

*/

const CONFIG = JSON.parse(fs.readFileSync('../config.json'));

const HOST = CONFIG['LMCC']['HOST'];
const PORT_WEB = CONFIG['LMCC']['PORT_WEB'];

// the gateway and LMCC will be on the same machine
var GATEWAY_HOST = process.argv.slice(2)[0]; //'localhost';
if (GATEWAY_HOST == '' || GATEWAY_HOST == undefined) {
	GATEWAY_HOST = '0.0.0.0'
}
const GATEWAY_PORT = CONFIG['GATEWAY']['PORT_SOC'];

const TSS_PORT = CONFIG['TSS']['PORT_WEB'];
const TSS_ADDR = CONFIG['TSS']['HOST'];

const USER = "LMCC";

const TSS_FULL_HTTP = "http://" + TSS_ADDR + ":" + TSS_PORT
const GEO_ENDPOINT = TSS_FULL_HTTP + "/json_data/IMU.json"
const CHECK_STATUIA = TSS_FULL_HTTP + "/json_data/UIA.json"
const TELEMTRY = 	TSS_FULL_HTTP + "/json_data/teams/0/TELEMETRY.json"
const CHECK_STATDCU = TSS_FULL_HTTP + "/json_data/DCU.json"


/*

--------SERVER & SOCKET INITIALIZATION--------

*/

const app = express();
app.use(express.json());
const server = http.createServer(app);
app.use(express.static('public'))

//store local data
let LOCAL_DATA = {}
LOCAL_DATA["GEOPINS"] = [];
LOCAL_DATA["BREADCRUMBS1"] = [];
LOCAL_DATA["BREADCRUMBS2"] = [];

LOCAL_DATA["TASKS"] = [];
LOCAL_DATA["BIOMETRICS"] = {};
LOCAL_DATA["TIMERS"] = {};
LOCAL_DATA["ALERTS"] = {};
const ws = new WebSocket('ws://' + GATEWAY_HOST + ':' + GATEWAY_PORT);

ws.onmessage = function (event) {
    let message = JSON.parse(event.data);
    let message_type = message["type"];
    console.log('LMCC: Received ' + message_type + ' from ' + message["sender"]);
    console.log(message); // Log the full message only once

    if (message_type == "GEOPIN") {
        LOCAL_DATA["GEOPINS"].push(message);
    } else if (message_type == "BREADCRUMBS1") {
        LOCAL_DATA["BREADCRUMBS1"].push(message);
	}else if (message_type == "BREADCRUMBS2") {
		LOCAL_DATA["BREADCRUMBS2"].push(message);
	} else if (message_type == "TASKS")
	LOCAL_DATA["TASKS"].push(message);

};


ws.onopen = function (event) {

 // should create WARNINGS indicating a switch using timestamps ~ (brainstorm)
 // the function calls with each console.log was used for testing, doesnt necessarily need to be kept.
 // alot of these switches (based on the task list) require specific timing. I think it would be a great idea to incorporate if statements/ timing warnings to aid the astronaut
 // organization is important 

 //START OF TESTING
  console.log('WebSocket connection established');
  // Usage
  /*
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
  */

	console.log('test');

	const filePath = 'tasks/task1.txt';

	try {
		fs.readFile(filePath, (error, data) => {
		  if (error) {
			console.error(`Got an error trying to read the file: ${error.message}`);
			return;
		  }

		  const lines = data.toString().split('\n')
		  const lastLine = lines.pop().split(', ');
		  const remainingContent = lines.join('\n')
		  
		  console.log("Last line:", lastLine);
		  console.log("Remaining content:\n", remainingContent);

		});
	  } catch (error) {
		console.error(`Got an error trying to read the file: ${error.message}`);
	  }
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
	DCU_EVA(function(eva1_battstat, eva2_battstat, eva1_oxyfill, eva2_oxyfill, eva1_pump, eva2_pump, eva1_co2, eva2_co2, eva1_comm, eva2_comm, eva1_fan, eva2_fan) { //can add stats to this function to save room?
		switchdictionary["eva1_battstat"] = eva1_battstat
		switchdictionary["eva2_battstat"] = eva2_battstat
		switchdictionary["eva1_oxyfill"] = eva1_oxyfill
		switchdictionary["eva2_oxyfill"] = eva2_oxyfill
		switchdictionary["eva1_pump"] = eva1_pump
		switchdictionary["eva2_pump"] = eva2_pump
		switchdictionary["eva1_co2"] = eva1_co2
		switchdictionary["eva2_co2"] = eva2_co2
		switchdictionary["eva1_comm"] = eva1_comm
		switchdictionary["eva2_comm"] = eva2_comm
		switchdictionary["eva1_fan"] = eva1_fan
		switchdictionary["eva2_fan"] = eva2_fan

		console.log(Object.keys(switchdictionary))
		Switches(switchdictionary); // would need to call switches function HERE 
	  });
	});

// Creating a dict for bio data
let biodictionary = {};

EVA_BIO(function(batt_time_left, batt_time_left2, oxy_pri_storage, oxy_pri_storage2, oxy_sec_storage, oxy_sec_storage2, oxy_pri_pressure, oxy_pri_pressure2, oxy_sec_pressure, oxy_sec_pressure2, oxy_time_left, oxy_time_left2, heart_rate, heart_rate2, oxy_consumption, oxy_consumption2, co2_production, co2_production2, suit_pressure_oxy, suit_pressure_oxy2, suit_pressure_co2,suit_pressure_co22, suit_pressure_other, suit_pressure_other2, suit_pressure_total, suit_pressure_total2, fan_pri_rpm, fan_pri_rpm2, fan_sec_rpm, fan_sec_rpm2, helmet_pressure_co2, helmet_pressure_co22, scrubber_a_co2_storage, scrubber_a_co2_storage2, scrubber_b_co2_storage, scrubber_b_co2_storage2, temperature, temperature2, coolant_ml, coolant_ml2, coolant_gas_pressure, coolant_gas_pressure2, coolant_liquid_pressure, coolant_liquid_pressure2){
biodictionary['eva1_batteryTime'] = batt_time_left
biodictionary['eva2_batteryTime'] = batt_time_left2
biodictionary['eva1_oxy_pri_storage'] = oxy_pri_storage
biodictionary['eva2_oxy_pri_storage'] = oxy_pri_storage2
biodictionary['eva1_oxy_sec_storage'] = oxy_sec_storage
biodictionary['ava2_oxy_sec_storage'] = oxy_sec_storage2
biodictionary['eva1_oxy_pri_pressure'] = oxy_pri_pressure
biodictionary['eva2_oxy_pri_pressure'] = oxy_pri_pressure2
biodictionary['eva1_oxy_sec_pressure'] = oxy_sec_pressure
biodictionary['eva2_oxy_sec_pressure'] = oxy_sec_pressure2
biodictionary['eva1_oxy_time_left'] = oxy_time_left
biodictionary['eva2_oxy_time_left'] = oxy_time_left2
biodictionary['eva1_heart_rate'] = heart_rate
biodictionary['eva2_heart_rate'] = heart_rate2
biodictionary['eva1_oxy_consumption'] = oxy_consumption
biodictionary['eva2_oxy_consumption'] = oxy_consumption2
biodictionary['eva1_co2_production'] = co2_production
biodictionary['eva2_co2_production'] = co2_production2
biodictionary['eva1_suit_pressure_oxy'] = suit_pressure_oxy
biodictionary['eva2_suit_pressure_oxy'] = suit_pressure_oxy2
biodictionary['eva1_suit_pressure_co2'] = suit_pressure_co2
biodictionary['eva2_suit_pressure_co2'] = suit_pressure_co22
biodictionary['eva1_suit_pressure_other'] = suit_pressure_other
biodictionary['eva2_suit_pressure_other'] = suit_pressure_other2
biodictionary['eva1_suit_pressure_total'] = suit_pressure_total
biodictionary['eva2_suit_pressure_total'] = suit_pressure_total2
biodictionary['eva1_fan_pri_rpm'] = fan_pri_rpm
biodictionary['eva2_fan_pri_rpm'] = fan_pri_rpm2
biodictionary['eva1_fan_sec_rpm'] = fan_sec_rpm
biodictionary['eva2_fan_sec_rpm'] = fan_sec_rpm2
biodictionary['eva1_helmet_pressure_co2'] = helmet_pressure_co2
biodictionary['eva2_helmet_pressure_co2'] = helmet_pressure_co22
biodictionary['ava1_scrubber_a_co2_storage'] = scrubber_a_co2_storage
biodictionary['eva2_scrubber_a_co2_storage'] = scrubber_a_co2_storage2
biodictionary['eva1_scrubber_b_co2_storage'] = scrubber_b_co2_storage
biodictionary['eva2_scrubber_b_co2_storage'] = scrubber_b_co2_storage2
biodictionary['eva1_temperature'] = temperature
biodictionary['eva2_temperature'] = temperature2
biodictionary['eva1_coolant_ml'] = coolant_ml
biodictionary['eva2_coolant_ml'] = coolant_ml2
biodictionary['eva1_coolant_gas_pressure'] = coolant_gas_pressure
biodictionary['eva2_coolant_gas_pressure'] = coolant_gas_pressure2
biodictionary['eva1_coolant_liquid_pressure'] = coolant_liquid_pressure
biodictionary['eva2_coolant_liquid_pressure'] = coolant_liquid_pressure2
//BIO_Switches (biodictionary);
});
//--------FUNCTION DEFS--------

function UIA_EVA(callback) {
    fetch(CHECK_STATUIA)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const powerStat = data["uia"]["eva1_power"];
            const powerStat2 = data["uia"]["eva2_power"];
            const depress = data["uia"]["depress"];
            const oxyvent = data["uia"]["oxy_vent"];
            const oxysupply = data["uia"]["eva1_oxy"];
            const oxysupply2 = data["uia"]["eva2_oxy"];
            const eva1water_waste = data["uia"]["eva1_water_waste"];
            const eva2water_waste = data["uia"]["eva2_water_waste"];
            const eva1water_supply = data["uia"]["eva1_water_supply"];
            const eva2water_supply = data["uia"]["eva2_water_supply"];
            callback(powerStat, powerStat2, depress, oxyvent, oxysupply, oxysupply2, eva1water_waste, eva2water_waste, eva1water_supply, eva2water_supply);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function DCU_EVA(callback) {
    fetch(CHECK_STATDCU)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const eva1_battstat = data["dcu"]["eva1"]["batt"];
            const eva2_battstat = data["dcu"]["eva2"]["batt"];
            const eva1_oxyfill = data["dcu"]["eva1"]["oxy"];
            const eva2_oxyfill = data["dcu"]["eva2"]["oxy"];
            const eva1_pump = data["dcu"]["eva1"]["pump"];
            const eva2_pump = data["dcu"]["eva2"]["pump"];
			const eva1_co2 = data["dcu"]["eva1"]["co2"];
			const eva2_co2 = data["dcu"]["eva2"]["co2"];
			const eva1_comm = data["dcu"]["eva1"]["comm"];
			const eva2_comm = data["dcu"]["eva2"]["comm"];
			const eva1_fan = data["dcu"]["eva1"]["fan"];
			const eva2_fan = data["dcu"]["eva2"]["fan"];
            callback(eva1_battstat, eva2_battstat, eva1_oxyfill, eva2_oxyfill, eva1_pump, eva2_pump, eva1_co2, eva2_co2, eva1_comm, eva2_comm, eva1_fan, eva2_fan);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


function Switches(switchdictionary){
	//can access each switch in the dictionary
	//How will we send??
}

//end of my addition

function EVA_BIO(callback){
	fetch (TELEMTRY)
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}batt_time_left
			return response.json();
		})
		.then(data => {
			const batt_time_left = data['eva1']['batt_time_left'];
			const batt_time_left2 = data['eva2']['batt_time_left'];
			const oxy_pri_storage = data['eva1']['oxy_pri_storage'];
			const oxy_pri_storage2 = data['eva2']['oxy_pri_storage'];
			const oxy_sec_storage = data['eva1']['oxy_sec_storage']['value'];
			const oxy_sec_storage2 = data['eva2']['oxy_sec_storage']['value'];
			const oxy_pri_pressure = data['eva1']['oxy_pri_pressure'];
			const oxy_pri_pressure2 = data['eva2']['oxy_pri_pressure'];
			const oxy_sec_pressure = data['eva1']['oxy_sec_pressure']['value'];
			const oxy_sec_pressure2 = data['eva2']['oxy_sec_pressure']['value'];
			const oxy_time_left = data['eva1']['oxy_time_left'];
			const oxy_time_left2 = data['eva2']['oxy_time_left'];
			const heart_rate = data['eva1']['heart_rate']['value'];
			const heart_rate2 = data['eva2']['heart_rate']['value'];
			const oxy_consumption = data['eva1']['oxy_consumption'];
			const oxy_consumption2 = data['eva2']['oxy_consumption2'];
			const co2_production = data['eva1']['co2_production'];
			const co2_production2 = data['eva2']['co2_production'];
			const suit_pressure_oxy = data['eva1']['suit_pressure_oxy'];
			const suit_pressure_oxy2 = data['eva2']['suit_pressure_oxy'];
			const suit_pressure_co2 = data['eva1']['suit_pressure_co2'];
			const suit_pressure_co22 = data['eva2']['suit_pressure_co2'];
			const suit_pressure_other = data['eva1']['suit_pressure_other']['value'];
			const suit_pressure_other2 = data['eva2']['suit_pressure_other']['value'];
			const suit_pressure_total = data['eva1']['suit_pressure_total'];
			const suit_pressure_total2 = data['eva2']['suit_pressure_total'];
			const fan_pri_rpm = data['eva1']['fan_pri_rpm']['vaule'];
			const fan_pri_rpm2 = data['eva2']['fan_pri_rpm']['value'];
			const fan_sec_rpm = data['eva1']['fan_sec_rpm']['value'];
			const fan_sec_rpm2 = data['eva2']['fan_sec_rpm']['value'];
			const helmet_pressure_co2 = data['eva1']['helmet_pressure_co2'];
			const helmet_pressure_co22 = data['eva2']['helmet_pressure_co2'];
			const scrubber_a_co2_storage = data['eva1']['scrubber_a_co2_storage']['value'];
			const scrubber_a_co2_storage2 = data['eva2']['scrubber_a_co2_storage']['value'];
			const scrubber_b_co2_storage = data['eva1']['scrubber_b_co2_storage'];
			const scrubber_b_co2_storage2 = data['eva2']['scrubber_b_co2_storage'];
			const temperature = data['eva1']['temperature']['value'];
			const temperature2 = data['eva2']['temperature']['value'];
			const coolant_ml = data['eva1']['coolant_ml'];
			const coolant_ml2 = data['eva2']['coolant_ml'];
			const coolant_gas_pressure = data['eva1']['coolant_gas_pressure']['value'];
			const coolant_gas_pressure2 = data['eva2']['coolant_gas_pressure']['value'];
			const coolant_liquid_pressure = data['eva1']['coolant_liquid_pressure'];
			const coolant_liquid_pressure2 = data['eva2']['coolant_liquid_pressure'];
			callback(batt_time_left, batt_time_left2, oxy_pri_storage, oxy_pri_storage2, oxy_sec_storage, oxy_sec_storage2, oxy_pri_pressure, oxy_pri_pressure2, oxy_sec_pressure, oxy_sec_pressure2, oxy_time_left, oxy_time_left2, heart_rate, heart_rate2, oxy_consumption, oxy_consumption2, co2_production, co2_production2, suit_pressure_oxy, suit_pressure_oxy2, suit_pressure_co2,suit_pressure_co22, suit_pressure_other, suit_pressure_other2, suit_pressure_total, suit_pressure_total2, fan_pri_rpm, fan_pri_rpm2, fan_sec_rpm, fan_sec_rpm2, helmet_pressure_co2, helmet_pressure_co22, scrubber_a_co2_storage, scrubber_a_co2_storage2, scrubber_b_co2_storage, scrubber_b_co2_storage2, temperature, temperature2, coolant_ml, coolant_ml2, coolant_gas_pressure, coolant_gas_pressure2, coolant_liquid_pressure, coolant_liquid_pressure2)
		})
		.catch(error => {
			console.error('There was a problem with the fetch operation:', error);
	});
}

async function createGeoPin(data) {
	// TODO: Ask NASA about how to properly pull GeoData. The TSS
	// is being a bit annoying

    let postData;

    // If user provides data, use it directly
    if (data && Object.keys(data).length > 0) {
        postData = {
			content: {
				coords: data.content.coords,
				desc: data.desc
			},
			sender: data.sender || "LMCC",
			type: data.type,
            timestamp: new Date().toISOString()
		}

		ws.send(JSON.stringify(postData));

    } else {
        // Fetching from TSS and sending TSS data
		try {
			const response = await fetch(GEO_ENDPOINT);
			if (!response.ok) throw new Error('Failed to fetch data from TSS');
			const reqdata = await response.json();



	
			const TSSpin = {
				content: {
					"EVA1": {
						"x": reqdata["imu"]["eva1"]["posx"], 
						"y": reqdata["imu"]["eva1"]["posy"]
					},
					"EVA2": {
						"x": reqdata["imu"]["eva2"]["posx"], 
						"y": reqdata["imu"]["eva2"]["posy"]
					},
					"desc": description,
				},
				"sender": USER,
				"type": "GEOPIN",
				"time": new Date().toISOString()
			};
	
			ws.send(JSON.stringify(TSSpin));
		} catch (error) {
			console.error('Error fetching and posting TSS data:', error);
		}

		ws.send(JSON.stringify(TSSpin));

    }

};


function generateBreadcrumbs() {
    setInterval(() => {
        // Fetch IMU data from TSS
        fetch(GEO_ENDPOINT)
            .then(response => response.json())
            .then(data => {
                // Create a breadcrumb based on the IMU data
                const eva1breadcrumb = {
                    content: {
                        coords: {
                            x: data["imu"]["eva1"]["posx"],
                            y: data["imu"]["eva1"]["posy"]
                        },
						desc: "Eva1",

                    },
                    sender: "LMCC",
                    type: "BREADCRUMBS1",
                    timestamp: new Date().toISOString()
                };

				const eva2breadcrumb = {
                    content: {
                        coords: {
                            x: data["imu"]["eva2"]["posx"],
                            y: data["imu"]["eva2"]["posy"]
                        },
						desc: "Eva2",

                    },
                    sender: "LMCC",
                    type: "BREADCRUMBS2",
                    timestamp: new Date().toISOString()
                };


             	// Add the breadcrumb to LOCAL_DATA and send it via WebSocket
                //LOCAL_DATA["BREADCRUMBS"].push(breadcrumb);
                ws.send(JSON.stringify(eva1breadcrumb));
				ws.send(JSON.stringify(eva2breadcrumb));

            })
            .catch(error => console.error('Error generating breadcrumb:', error));
    }, 4000); // 2 seconds interval
}





async function createTask(taskName) {
	const filePath = `public/tasks/${taskName}.txt`;

	try {
		const data = fs.readFileSync(filePath, 'utf8');
		const lines = data.split('\n');
		const tssInfo = lines.pop().split(', ');
		const taskDesc = lines.join('\n');

		const taskJson = {
			content: {
				taskName: taskName,
				taskDesc: taskDesc,
				tssInfo: tssInfo,
				status: "Not started"
			},
			sender: "LMCC",
			type: "TASK",
			timestamp: new Date().toISOString()
		};

		ws.send(JSON.stringify(taskJson));
	} catch (error) {
		console.error(`Got an error trying to read the file: ${error.message}`);
	}
}


function isNominal(metricName, metric) {
	if (metricName == 'batt_time_left') {
		return 3600 <= metric && metric <= 10800
	}
	else if (metricName == 'oxy_pri_storage') {
		return 20 <= metric && metric <= 100
	}
	else if (metricName == 'oxy_sec_storage') {
		return 20 <= metric && metric <= 100
	}
	else if (metricName == 'oxy_pri_pressure') {
		return 600 <= metric && metric <= 3000
	}
	else if (metricName == 'oxy_sec_pressure') {
		return 600 <= metric && metric <= 3000
	}
	else if (metricName == 'oxy_time_left') {
		return 3600 <= metric && metric <= 21600
	}
	else if (metricName == 'heart_rate') {
		return 50 <= metric && metric <= 160
	}
	else if (metricName == 'oxy_consumption') {
		return 0.05 <= metric && metric <= 0.15
	}
	else if (metricName == 'co2_production') {
		return 0.05 <= metric && metric <= 0.15
	}
	else if (metricName == 'suit_pressure_oxy') {
		return 3.5 <= metric && metric <= 4.1
	}
	else if (metricName == 'suit_pressure_co2') {
		return 0 <= metric && metric <= 0.1
	}
	else if (metricName == 'suit_pressure_other') {
		return 0 <= metric && metric <= 0.5
	}
	else if (metricName == 'suit_pressure_total') {
		return 3.5 <= metric && metric <= 4.5
	}
	else if (metricName == 'helmet_pressure_co2') {
		return 0 <= metric && metric <= 0.15
	}
	else if (metricName == 'fan_pri_rpm') {
		return 20000 <= metric && metric <= 30000
	}
	else if (metricName == 'fan_sec_rpm') {
		return 20000 <= metric && metric <= 30000
	}
	else if (metricName == 'scrubber_a_co2_storage') {
		return 0 <= metric && metric <= 60
	}
	else if (metricName == 'scrubber_b_co2_storage') {
		return 0 <= metric && metric <= 60
	}
	else if (metricName == 'temperature') {
		return 50 <= metric && metric <= 90
	}
	else if (metricName == 'coolant_liquid_pressure') {
		return 100 <= metric && metric <= 700
	}
	else if (metricName == 'coolant_gas_pressure') {
		return 0 <= metric && metric <= 700
	}
}



function updateBiometrics(){
	setInterval(() => {
		fetch(TELEMTRY)
		.then(response => response.json())
		.then(data => {
//			console.log(data)
			LOCAL_DATA["BIOMETRICS"] = {
				'EV1 - Heart Rate' : {
					'val' : data['telemetry']['eva1']['heart_rate'] + " bpm",
					'color' : isNominal('heart_rate', data['telemetry']['eva1']['heart_rate']) ? 'green-text' : 'red-text'
				},
				'EV1 -  Temperature' : {
					'val' : String(Math.round(Number(data['telemetry']['eva1']['temperature']) * 100) / 100) + " F",
					'color' : isNominal('temperature', data['telemetry']['eva1']['temperature']) ? 'green-text' : 'red-text'
				},
				'EV2 - Heart Rate' : {
					'val' : data['telemetry']['eva2']['heart_rate'] + " bpm",
					'color' : isNominal('heart_rate', data['telemetry']['eva2']['heart_rate']) ? 'green-text' : 'red-text'
				},
				'EV2 -  Temperature' : {
					'val' : String(Math.round(Number(data['telemetry']['eva2']['temperature']) * 100) / 100) + " F",
					'color' : isNominal('temperature', data['telemetry']['eva2']['temperature']) ? 'green-text' : 'red-text'
				},
			}
		})
		.catch(error => console.error('Error generating biometrics:', error));
    }, 1000); // 1 second interval
}

function updateTimers(){
	setInterval(() => {
		fetch(TELEMTRY)
		.then(response => response.json())
		.then(data => {
//			console.log(data)
			LOCAL_DATA["TIMERS"] = {
				'EV1: O2 left' : data['telemetry']['eva1']['oxy_time_left'] + "s",
				'EV1: Battery' : Math.round(Number(data['telemetry']['eva1']['batt_time_left'])) + "s",
				'EV2: O2 left' : data['telemetry']['eva2']['oxy_time_left'] + "s",
				'EV2: Battery' : Math.round(Number(data['telemetry']['eva2']['batt_time_left'])) + "s",
			}
		})
		.catch(error => console.error('Error generating biometrics:', error));
    }, 1000); // 1 second interval
}


var alert_keys_yellow = ['batt_time_left', 
    'oxy_pri_storage',
    'oxy_sec_storage',
    'oxy_pri_pressure', 
    'oxy_sec_pressure', 
    'oxy_time_left', 
    'oxy_consumption', 
    'co2_production', 
    'coolant_liquid_pressure', 
    'coolant_gas_pressure']

var alerts_pretty = {
    'batt_time_left' : 'Battery Left',
    'oxy_pri_storage' : 'Primary O2 Storage',
    'oxy_sec_storage' : 'Secondary O2 Storage',
    'oxy_pri_pressure' : 'Primary O2 Pressure',
    'oxy_sec_pressure' : 'Secondary O2 Pressure',
    'oxy_time_left' : 'O2 Time Left',
    'oxy_consumption' : 'O2 Consumption',
    'co2_production' : 'CO2 Production',
    'coolant_liquid_pressure' : 'Coolant Liquid Pressure',
    'coolant_gas_pressure' : 'Coolant Gas Pressure',
    'heart_rate' : 'Heart Rate',
    'suit_pressure_oxy' : 'Suit O2 Pressure', 
    'suit_pressure_co2' : 'Suit CO2 Pressure',
    'suit_pressure_cO2' : 'Suit CO2 Pressure',
    'suit_pressure_other' : 'Suit Pressure (Other)', 
    'suit_pressure_total' : 'Suit Total Pressure', 
    'helmet_pressure_co2' : 'Helmet CO2 Pressure', 
    'fan_pri_rpm' : 'Primary Fan RPM',
    'fan_sec_rpm' : 'Secondary Fan RPM', 
    'scrubber_a_co2_storage' : 'Scrubber A CO2 Storage', 
    'scrubber_b_co2_storage' : 'Scrubber B CO2 Storage', 
    'temperature' : 'Temperature',
    'coolant_ml' : 'Coolant ML'
}

function updateAlerts(){
	setInterval(() => {
		fetch(TELEMTRY)
		.then(response => response.json())
		.then(data => {

			alerts = {}

			const evas = ['eva1', 'eva2'];

			// coolant_storage doesn't exist


			for (const eva of evas) {
                for (var key of Object.keys(data['telemetry'][eva])) {
                    let value = data['telemetry'][eva][key]
                    if (!isNominal(key, value)) {
                        var color = 'red-text';
                        if (alert_keys_yellow.includes(key)) {
                            color = 'yellow-text'
                        }
                        if (alerts_pretty[key] == undefined) {
                            console.log(key)
                        }
                        alerts[`${eva.toUpperCase()}: ${alerts_pretty[key]}`] = {
                            'val' : value,
                            'color' : color
                        }
                    }
                }

                /*

				let batt_time_left = data['telemetry'][eva]['batt_time_left'];
				if (!isNominal('batt_time_left', batt_time_left)) {
					alerts[`${eva.toUpperCase()} - Batt Time Left`] = {
						'val': batt_time_left,
						'color': 'yellow-text'
					}
				}

				let oxy_pri_storage = data['telemetry'][eva]['oxy_pri_storage'];
				if (!isNominal('oxy_pri_storage', oxy_pri_storage)) {
					alerts[`${eva.toUpperCase()} - Oxy Pri Storage`] = {
						'val': oxy_pri_storage,
						'color': 'yellow-text'
					}
				}

				let oxy_sec_storage = data['telemetry'][eva]['oxy_sec_storage'];
				if (!isNominal('oxy_sec_storage', oxy_sec_storage)) {
					alerts[`${eva.toUpperCase()} - Oxy Sec Storage`] = {
						'val': oxy_sec_storage,
						'color': 'yellow-text'
					}
				}

				let oxy_pri_pressure = data['telemetry'][eva]['oxy_pri_pressure'];
				if (!isNominal('oxy_pri_pressure', oxy_pri_pressure)) {
					alerts[`${eva.toUpperCase()} - Oxy Pri Pressure`] = {
						'val': oxy_pri_pressure,
						'color': 'yellow-text'
					}
				}

				let oxy_sec_pressure = data['telemetry'][eva]['oxy_sec_pressure'];
				if (!isNominal('oxy_sec_pressure', oxy_sec_pressure)) {
					alerts[`${eva.toUpperCase()} - Oxy Sec Pressure`] = {
						'val': oxy_sec_pressure,
						'color': 'yellow-text'
					}
				}

				let oxy_time_left = data['telemetry'][eva]['oxy_time_left'];
				if (!isNominal('oxy_time_left', oxy_time_left)) {
					alerts[`${eva.toUpperCase()} - Oxy Time Left`] = {
						'val': oxy_time_left,
						'color': 'yellow-text'
					}
				}

				let heart_rate = data['telemetry'][eva]['heart_rate'];
				if (!isNominal('heart_rate', heart_rate)) {
					alerts[`${eva.toUpperCase()} - Heart Rate`] = {
						'val': heart_rate,
						'color': 'red-text'
					}
				}

				let oxy_consumption = data['telemetry'][eva]['oxy_consumption'];
				if (!isNominal('oxy_consumption', oxy_consumption)) {
					alerts[`${eva.toUpperCase()} - Oxy Consumption`] = {
						'val': oxy_consumption,
						'color': 'yellow-text'
					}
				}

				let co2_production = data['telemetry'][eva]['co2_production'];
				if (!isNominal('co2_production', co2_production)) {
					alerts[`${eva.toUpperCase()} - CO2 Production`] = {
						'val': co2_production,
						'color': 'yellow-text'
					}
				}

				let suit_pressure_oxy = data['telemetry'][eva]['suit_pressure_oxy'];
				if (!isNominal('suit_pressure_oxy', suit_pressure_oxy)) {
					alerts[`${eva.toUpperCase()} - Suit Pressure Oxy`] = {
						'val': suit_pressure_oxy,
						'color': 'red-text'
					}
				}

				let suit_pressure_co2 = data['telemetry'][eva]['suit_pressure_co2'];
				if (!isNominal('suit_pressure_co2', suit_pressure_co2)) {
					alerts[`${eva.toUpperCase()} - Suit Pressure CO2`] = {
						'val': suit_pressure_co2,
						'color': 'red-text'
					}
				}

				let suit_pressure_other = data['telemetry'][eva]['suit_pressure_other'];
				if (!isNominal('suit_pressure_other', suit_pressure_other)) {
					alerts[`${eva.toUpperCase()} - Suit Pressure Other`] = {
						'val': suit_pressure_other,
						'color': 'red-text'
					}
				}

				let suit_pressure_total = data['telemetry'][eva]['suit_pressure_total'];
				if (!isNominal('suit_pressure_total', suit_pressure_total)) {
					alerts[`${eva.toUpperCase()} - Suit Pressure Total`] = {
						'val': suit_pressure_total,
						'color': 'red-text'
					}
				}

				let helmet_pressure_co2 = data['telemetry'][eva]['helmet_pressure_co2'];
				if (!isNominal('helmet_pressure_co2', helmet_pressure_co2)) {
					alerts[`${eva.toUpperCase()} - Helmet Pressure CO2`] = {
						'val': helmet_pressure_co2,
						'color': 'red-text'
					}
				}

				let fan_pri_rpm = data['telemetry'][eva]['fan_pri_rpm'];
				if (!isNominal('fan_pri_rpm', fan_pri_rpm)) {
					alerts[`${eva.toUpperCase()} - Fan Pri RPM`] = {
						'val': fan_pri_rpm,
						'color': 'red-text'
					}
				}

				let fan_sec_rpm = data['telemetry'][eva]['fan_sec_rpm'];
				if (!isNominal('fan_sec_rpm', fan_sec_rpm)) {
					alerts[`${eva.toUpperCase()} - Fan Sec RPM`] = {
						'val': fan_sec_rpm,
						'color': 'red-text'
					}
				}

				let scrubber_a_co2_storage = data['telemetry'][eva]['scrubber_a_co2_storage'];
				if (!isNominal('scrubber_a_co2_storage', scrubber_a_co2_storage)) {
					alerts[`${eva.toUpperCase()} - Scrubber A CO2 Storage`] = {
						'val': scrubber_a_co2_storage,
						'color': 'red-text'
					}
				}

				let scrubber_b_co2_storage = data['telemetry'][eva]['scrubber_b_co2_storage'];
				if (!isNominal('scrubber_b_co2_storage', scrubber_b_co2_storage)) {
					alerts[`${eva.toUpperCase()} - Scrubber B CO2 Storage`] = {
						'val': scrubber_b_co2_storage,
						'color': 'red-text'
					}
				}

				let temperature = data['telemetry'][eva]['temperature'];
				if (!isNominal('temperature', temperature)) {
					alerts[`${eva.toUpperCase()} - Temperature`] = {
						'val': temperature,
						'color': 'red-text'
					}
				}

				let coolant_liquid_pressure = data['telemetry'][eva]['coolant_liquid_pressure'];
				if (!isNominal('coolant_liquid_pressure', coolant_liquid_pressure)) {
					alerts[`${eva.toUpperCase()} - Coolant Liquid Pressure`] = {
						'val': coolant_liquid_pressure,
						'color': 'yellow-text'
					}
				}

				let coolant_gas_pressure = data['telemetry'][eva]['coolant_gas_pressure'];
				if (!isNominal('coolant_gas_pressure', coolant_gas_pressure)) {
					alerts[`${eva.toUpperCase()} - Coolant Gas Pressure`] = {
						'val': coolant_gas_pressure,
						'color': 'yellow-text'
					}
				}
                */

			}


			LOCAL_DATA["ALERTS"] = alerts
		})
		.catch(error => console.error('Error generating biometrics:', error));
    }, 1000); // 1 second interval
}

ws.onopen = function (event) {
	generateBreadcrumbs()
	updateBiometrics()
	updateTimers()
	updateAlerts()
};


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

app.get('/eva1breadcrumbs', (req, res) => {
	for (let item of Object.values(LOCAL_DATA["BREADCRUMBS1"])) {
		console.log(item)
	}
    res.json(Object.values(LOCAL_DATA["BREADCRUMBS1"]));
});

app.get('/eva2breadcrumbs', (req, res) => {
	for (let item of Object.values(LOCAL_DATA["BREADCRUMBS2"])) {
		console.log(item)
	}
    res.json(Object.values(LOCAL_DATA["BREADCRUMBS2"]));
});

app.get('/alltasks', (req, res) => {
	var tasknames = fs.readdirSync("public/tasks");
	console.log(tasknames)
	// var resp = tasknames.join("\n")
	res.send(tasknames)
});


app.post('/geopins', async (req, res) => {
	console.log(req.body)
    await createGeoPin(req.body); // Assuming `createGeoPin` handles both custom and TSS data
    res.sendStatus(201); // Indicate resource creation
});

app.post('/createTask', (req, res) => {
    const taskName = req.body.taskName;
    createTask(taskName);
    res.sendStatus(201);
});




app.get('/localdata/:item', (req, res) => {
	/*
	for (let item of LOCAL_DATA[req.params.item]) {
		console.log(item)
	}
	*/
	res.send(LOCAL_DATA[req.params.item]);
})

app.get('/gatewayhost', (req, res) => {
	res.send(GATEWAY_HOST)
})

// create api endpoint 


server.listen(PORT_WEB, HOST, () => console.log(`Server running on port ${PORT_WEB}`));
