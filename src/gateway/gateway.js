const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const PORT_SOC = 14142;
const PORT_WEB = process.env.PORT || 3000;
const HOST = '0.0.0.0'


//initialize Express, HTTP Server, and socket io
const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ port : PORT_SOC, host : HOST });

let subscribers = [];

wss.on('connection', function connection(ws) {
  subscribers.push(ws);

  ws.on('message', function incoming(message) {
    subscribers.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});


// Serve a simple test page
app.get('/', (req, res) => {
  res.send('JARVIS Inter-Device Gateway');
});

//starts HTTPs erver listening on the port
server.listen(PORT_WEB, HOST, () => console.log(`Server running on port ${PORT_WEB}`));