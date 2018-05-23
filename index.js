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



// setInterval(async function() {
//     // let poloniexOrderBook = await new Poloniex().returnOrderBook('BTC_ETH', 10);
//     console.log(poloniexOrderBook);
//     let stockprice = Math.floor(Math.random() * 1000);
//     io.emit('poloniex order book', poloniexOrderBook);
// }, 1000);
//
//
// connection.onopen = function (session) {
//     function marketEvent (args,kwargs) {
//         console.log(args);
//     }
//     function tickerEvent (args,kwargs) {
//         console.log(args);
//     }
//     function trollboxEvent (args,kwargs) {
//         console.log(args);
//     }
//     session.subscribe('BTC_ETH', marketEvent);
//     session.subscribe('ticker', tickerEvent);
//     session.subscribe('trollbox', trollboxEvent);
// };
//
// connection.onclose = function () {
//     console.log("Websocket connection closed");
// };
//
// connection.open();