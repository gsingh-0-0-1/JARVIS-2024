const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs')
const socketIO = require('socket.io');


const CONFIG = JSON.parse(fs.readFileSync('../config.json'));

const PORT_SOC = CONFIG['GATEWAY']['PORT_SOC'];
const PORT_WEB = process.env.PORT || CONFIG['GATEWAY']['PORT_WEB'];
const HOST = CONFIG['GATEWAY']['HOST']


//initialize Express, HTTP Server, and socket io
const app = express();
const server = http.createServer(app);

const io = socketIO(server);

const wss = new WebSocket.Server({ port : PORT_SOC, host : HOST });

server.listen(PORT_WEB, HOST, () => console.log(`Server running on port ${PORT_WEB}`));

let subscribers = [];

wss.on('connection', function connection(ws) {
	subscribers.push(ws);

	ws.on('message', function incoming(message) {
		
		console.log("RECEIVED MESSAGE")
		try { 
            console.log(JSON.parse(message))
        } catch (error) {
            console.log("ERROR WITH MESSAGE:")
            console.log(message);
            console.log()
            console.log(error)
        }

        console.log()

		subscribers.forEach(function each(client) {
			
			//if (client !== ws && client.readyState === WebSocket.OPEN) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});
	});
});


// we don't really need a frontend for the gateway, but oh well, here it is
app.get('/', (req, res) => {
  res.send('JARVIS Inter-Device Gateway (what are you doing here?)');
});

/*
function convert(input, output, callback) {
    ffmpeg(input)
        .output(output)
        .on('end', function() {                    
            //console.log('conversion ended');
            callback(null);
        }).on('error', function(err){
            //console.log('error: ', err.code, err.msg);
            callback(err);
        }).run();
}


// Handle new socket connections
io.on('connection', (socket) => {
	console.log("voice conn")
	socket.broadcast.emit("connection")

    // Handle incoming audio stream
    socket.on('audioStream', (audioData) => {

    	//console.log(rawdata)

    	fs.writeFileSync("./input.webm", audioData.split("base64,")[1], 'base64')

    	
		convert('./input.webm', './output.wav', function(err){
			if(!err) {
				var file_content = fs.readFileSync('./output.wav', 'binary');
				//var headerbytes = 44
				//var int8a = new Int8Array(file_content.buffer, headerbytes, file_content.length - headerbytes);
				//var decoder = new TextDecoder('utf8');
				//var b64encoded = btoa(decoder.decode(int8a));
				var b64encoded = btoa(file_content);
				//console.log(b64encoded);
				socket.broadcast.emit('audioStream', b64encoded);
				//console.log(int16a)
		   		//var buf = new Buffer(fs.readFileSync('./output.wav', encoding1), encoding2);
		   		//console.log('conversion complete');
		   }
		   else {
		   	console.log(err)
		   }
		});
		
    	// console.log()
    	// console.log(audioData);
    	//console.log(audioData.length)
        //socket.broadcast.emit('audioStream', audioData);
    });

    socket.on('disconnect', () => {
    });
});
*/
