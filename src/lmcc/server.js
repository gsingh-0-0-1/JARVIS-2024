const WebSocket = require('ws');

const PORT = 14142;
const HOST = '0.0.0.0'

const wss = new WebSocket.Server({ port : PORT, host : HOST });

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