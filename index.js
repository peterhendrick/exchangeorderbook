'use strict';

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let subscribeToPoloniex = require('./poloniex');
let subscribeToBittrex = require('./bittrex');


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/public', express.static(__dirname + '/public'));

http.listen(8000, function() {
    console.log('Listening on *:8000');
});

subscribeToPoloniex(io);
subscribeToBittrex(io);
