'use strict';

const binance = require('node-binance-api'),
    combineOrderBooks = require('./combined'),
    _ = require('lodash');

module.exports = subscribeToBinance;

function subscribeToBinance(io) {
    binance.websockets.depthCache(['ETHBTC', 'BCCBTC'], (symbol, depth) => {
        symbol = _formatSymbol(symbol);
        let bids = binance.sortBids(depth.bids);
        let asks = binance.sortAsks(depth.asks);
        let formattedData = _processResponse(bids, asks, symbol);
        if(formattedData.asks.length > 100) formattedData.asks = _.slice(formattedData.asks, 0, 100);
        if(formattedData.bids.length > 100) formattedData.bids = _.slice(formattedData.bids, 0, 100);
        combineOrderBooks(io, symbol, null, null, formattedData);
    });
}

function _formatSymbol(symbol) {
    if(symbol === 'ETHBTC') return 'BTC_ETH';
    if(symbol === 'BCCBTC') return 'BTC_BCH';
}

function _processResponse(bids, asks, symbol) {
    let formattedBids = _.map(bids, (value, key) => {
        return {
            price: key,
            volume: value.toString(),
            exchange: 'Binance',
            market: symbol,
            highlight: false
        };
    });
    let formattedAsks = _.map(asks, (value, key) => {
        return {
            price: key,
            volume: value.toString(),
            exchange: 'Binance',
            market: symbol,
            highlight: false
        };
    });
    return {bids: formattedBids, asks: formattedAsks};
}