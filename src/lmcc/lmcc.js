const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs')



/*

--------CONFIG INITIALIZATION--------

*/

const CONFIG = JSON.parse(fs.readFileSync('../config.json'));

const HOST = CONFIG['LMCC']['HOST'];
const PORT_WEB = CONFIG['LMCC']['PORT_WEB'];

// the gateway and LMCC will be on the same machine
const GATEWAY_HOST = '0.0.0.0';
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
app.use(express.json());
const server = http.createServer(app);
app.use(express.static('public'))

//store local data
let LOCAL_DATA = {}
LOCAL_DATA["GEOPINS"] = {};
LOCAL_DATA["BREADCRUMBS"] = {};
const ws = new WebSocket('ws://' + GATEWAY_HOST + ':' + GATEWAY_PORT);

ws.onmessage = function (event) {
	let message = JSON.parse(event.data)
	let message_type = message["type"];
 	console.log('Received ' + message_type + ' from ' + message["sender"]);
	console.log(message)
 	if (message_type == "GEOPIN") {
 		console.log(message["content"])
 		let npins = Object.keys(LOCAL_DATA["GEOPINS"]).length
 		LOCAL_DATA["GEOPINS"][npins] = message["content"]
 	}

	if (message_type == "BREADCRUMBS") {
		console.log(message["content"])
 		let ncrumbs = Object.keys(LOCAL_DATA["BREADCRUMBS"]).length
 		LOCAL_DATA["BREADCRUMBS"][ncrumbs] = message["content"]
	}


};

ws.onopen = function (event) {
  console.log('WebSocket connection established');
};


/*

--------FUNCTION DEFS--------

*/

async function createGeoPin(data) {
	// TODO: Ask NASA about how to properly pull GeoData. The TSS
	// is being a bit annoying

    let postData;

    // If user provides data, use it directly
    if (data && Object.keys(data).length > 0) {
        postData = {
			content: {
				coords: data.coords,
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
	// var georeq = new XMLHttpRequest();
	// georeq.open("GET", GEO_ENDPOINT)
	// georeq.onreadystatechange = function() {
	// 	if (this.readyState == 4 && this.status == 200) {
	// 		var reqdata = this.responseText;
	// 		var reqdata_json = JSON.parse(reqdata);

	// 		var data = {};
	// 		var content = {"EVA1" : {
	// 				"x" : reqdata_json["imu"]["eva1"]["posx"], 
	// 				"y" : reqdata_json["imu"]["eva1"]["posy"]
	// 			}, 
	// 			"EVA2" : {
	// 				"x" : reqdata_json["imu"]["eva2"]["posx"], 
	// 				"y" : reqdata_json["imu"]["eva2"]["posy"]
	// 			},
	// 			"desc" : description
	// 		};

	// 		data["sender"] = USER;
	// 		data["type"] = "GEOPIN"
	// 		data["content"] = content;

	// 		ws.send(JSON.stringify(data))
		
	// 	}
	// }
	// georeq.send()


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

app.post('/geopins', async (req, res) => {
	console.log(req.body)
    await createGeoPin(req.body); // Assuming `createGeoPin` handles both custom and TSS data
    res.sendStatus(201); // Indicate resource creation
});


app.get('/localdata/:item', (req, res) => {
	res.send(LOCAL_DATA[req.params.item]);
})

// create api endpoint 


server.listen(PORT_WEB, HOST, () => console.log(`Server running on port ${PORT_WEB}`));
