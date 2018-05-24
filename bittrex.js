'use strict';

const Bittrex = require('node-bittrex-api');
const _ = require('lodash');

module.exports = subscribeToBittrex;

function subscribeToBittrex(io) {
    Bittrex.options({
        websockets: {
            onConnect: function() {
                console.log('Websocket connected');
                Bittrex.websockets.subscribe(['BTC-ETH'], function(data) {
                    if (data.M === 'updateExchangeState') {
                        Bittrex.getorderbook({ market : 'BTC-ETH', type : 'both' }, function(response) {
                            let formattedBTCETHData = _formatData(response.result, data.Nounce, data.MarketName);
                            console.log(data);
                        });
                        io.emit('bittrex order book', 'success');
                    }
                });
            }
        }
    });

    Bittrex.websockets.client();
}

function _formatData(book, seq, market) {
    let asks = _.chain(book.sell)
        .map(ask => {
            return {
                price: ask.Rate,
                volume: ask.Quantity,
                exchange: 'Bittrex',
                seq: seq,
                market: market
            }
        })
        .orderBy(['price'], ['asc'])
        .value();
    let bids = _.chain(book.buy)
        .map(bid => {
            return {
                price: bid.Rate,
                volume: bid.Quantity,
                exchange: 'Bittrex',
                seq: seq,
                market: market
            }
        })
        .orderBy(['price'], ['desc'])
        .value();
    return {bids: bids, asks: asks};
}
