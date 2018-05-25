'use strict';

const binance = require('node-binance-api'),
    combineOrderBooks = require('./combined'),
    _ = require('lodash');

module.exports = subscribeToBinance;

function subscribeToBinance(io) {
    binance.websockets.depthCache(['ETHBTC'], (symbol, depth) => {
        let bids = binance.sortBids(depth.bids);
        let asks = binance.sortAsks(depth.asks);
        let formattedData = _processResponse(bids, asks, 'BTC_ETH');
        if(formattedData.asks.length > 100) formattedData.asks = _.slice(formattedData.asks, 0, 100);
        if(formattedData.bids.length > 100) formattedData.bids = _.slice(formattedData.bids, 0, 100);
        combineOrderBooks(io, null, null, formattedData);
    });
}

function _processResponse(bids, asks, symbol) {
    let formattedBids = _.map(bids, (value, key) => {
        return {
            price: key,
            volume: value.toString(),
            exchange: 'Binance',
            market: symbol
        };
    });
    let formattedAsks = _.map(asks, (value, key) => {
        return {
            price: key,
            volume: value.toString(),
            exchange: 'Binance',
            market: symbol
        };
    });
    return {bids: formattedBids, asks: formattedAsks};
}