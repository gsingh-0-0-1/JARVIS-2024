const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

//initialize Express, HTTP Server, and socket io
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

//temp in-memory storage for pins
let pins = [];


//  a simple test page
app.get('/', (req, res) => {
  res.send('Hi! Testing Yay');
});

app.get('/client', (req, res) => {
  res.sendFile(__dirname + '/client.html');
});


// listens for new websocket connections
io.on('connection', (socket) => {
  console.log('A user connected');
// Send the current pins to the newly connected client
socket.emit('load_pins', pins);

// Listen for a new pin being added by a client
socket.on('add_pin', (pin) => {
  pins.push(pin); // Add the new pin to the array
  console.log('Pin added:', pin); // Log the added pin

  io.emit('pin_added', pin); // Broadcast the new pin to all clients

});

// Listen for a request to update a pin (assuming pins have unique IDs)
socket.on('update_pin', (updatedPin) => {
  pins = pins.map(pin => pin.id === updatedPin.id ? updatedPin : pin); // Update the pin in the array
  io.emit('pin_updated', updatedPin); // Broadcast the updated pin
});

// Listen for a pin being removed
socket.on('remove_pin', (pinId) => {
  pins = pins.filter(pin => pin.id !== pinId); // Remove the pin from the array
  io.emit('pin_removed', pinId); // Broadcast the removal
});



  socket.on('disconnect', () => {
    console.log('User disconnected');
  });



});


//Starting the server. Determines the port number on which the server will listen
const PORT = process.env.PORT || 3000;

//starts HTTPs erver listening on the port
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
