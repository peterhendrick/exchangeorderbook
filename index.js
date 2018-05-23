'use strict';

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let poloniex = require('./poloniex');
let bittrex = require('./bittrex');


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('A new WebSocket connection has been established');
});


http.listen(8000, function() {
    console.log('Listening on *:8000');
});

poloniex(io);
bittrex(io);
