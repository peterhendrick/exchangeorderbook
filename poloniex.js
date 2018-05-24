'use strict';

const Poloniex = require('poloniex-api-node');
const _ = require('lodash');

module.exports = subscribeToPoloniex;

function subscribeToPoloniex(io) {
    let poloniex = new Poloniex();
    poloniex.subscribe('BTC_ETH');
    poloniex.on('message', (channelName, response, seq) => {
        if (channelName === 'BTC_ETH') {
            let formattedBTCETHData = _formatData(response, seq, channelName);
            // io.emit('poloniex order book', formattedBTCETHData);
            io.emit('poloniex order book', 'success');
        }
    });
    poloniex.on('error', error => {
        console.log(`An error has occurred: ${error}`);
    });

    poloniex.openWebSocket({version: 2});
}

function _formatData(response, seq, market) {
    let book = response[0];
    let asks = _.chain(book.data.asks)
        .map((value, key) => {
            return {
                price: key,
                volume: value,
                exchange: 'Poloniex',
                seq: seq,
                market: market
            };
        })
        .orderBy(['price'], ['asc'])
        .value();
    let bids = _.chain(book.data.bids)
        .map((value, key) => {
            return {
                price: key,
                volume: value,
                exchange: 'Poloniex',
                seq: seq,
                market: market
            };
        })
        .orderBy(['price'], ['desc'])
        .value();
    return {bids: bids, asks: asks};
}
