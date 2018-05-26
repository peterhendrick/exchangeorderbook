'use strict';

const express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    subscribeToBinance = require('./binance'),
    subscribeToPoloniex = require('./poloniex'),
    subscribeToBittrex = require('./bittrex');


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use('/scripts', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/scripts', express.static(__dirname + '/node_modules/datatables/media/js/'));
app.use('/scripts', express.static(__dirname + '/node_modules/lodash/'));
app.use('/public', express.static(__dirname + '/public'));

http.listen((process.env.PORT || 8000), function() {
    console.log(`Listening on port ${process.env.PORT || 8000}`);
});

// subscribeToPoloniex(io);
subscribeToBittrex(io);
// subscribeToBinance(io);
