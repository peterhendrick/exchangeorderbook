'use strict';

const Bittrex = require('node-bittrex-api');

module.exports = subscribeToBittrex;

function subscribeToBittrex(io) {
    Bittrex.options({
        websockets: {
            onConnect: function() {
                console.log('Websocket connected');
                Bittrex.websockets.subscribe(['BTC-ETH'], function(data) {
                    if (data.M === 'updateExchangeState') {
                        data.A.forEach(function(data_for) {
                            console.log('Market Update for '+ data_for.MarketName, data_for);
                        });
                        io.emit('bittrex order book', 'success')
                    }
                });
            },
            onDisconnect: function() {
                console.log('Websocket disconnected');
            }
        }
    });

    let websocketClient;
    Bittrex.websockets.client(function(client) {
        websocketClient = client;
    });
}
