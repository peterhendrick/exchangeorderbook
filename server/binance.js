'use strict';

const binance = require('node-binance-api'),
    combineOrderBooks = require('./combined'),
    _ = require('lodash');

module.exports = {
    subscribeToBinance: subscribeToBinance,
    processResponse: processResponse
};

/**
 * Connect to binance websocket and format the data to be combined with other exchange data and sent to the client.
 * @param io {Server} Websocket server to be passed along and emit messages to the client.
 */
function subscribeToBinance(io) {
    binance.websockets.depthCache(['ETHBTC', 'BCCBTC'], (symbol, depth) => {
        symbol = _formatSymbol(symbol);
        let formattedData = processResponse(symbol, depth, io);
        combineOrderBooks(io, symbol, null, null, formattedData);
    });
}

function _formatSymbol(symbol) {
    if(symbol === 'ETHBTC') return 'BTC_ETH';
    if(symbol === 'BCCBTC') return 'BTC_BCH';
}

function processResponse(symbol, depth) {
    let bids = binance.sortBids(depth.bids);
    let asks = binance.sortAsks(depth.asks);
    let formattedData = _formatData(bids, asks, symbol);
    if(formattedData.asks.length > 100) formattedData.asks = _.slice(formattedData.asks, 0, 100);
    if(formattedData.bids.length > 100) formattedData.bids = _.slice(formattedData.bids, 0, 100);
    return formattedData;
}

function _formatData(bids, asks, symbol) {
    let formattedBids = _.map(bids, (value, key) => _createItemObject(value, key, symbol));
    let formattedAsks = _.map(asks, (value, key) => _createItemObject(value, key, symbol));
    return {bids: formattedBids, asks: formattedAsks};
}

function _createItemObject(volume, price, symbol) {
    return {
        price: price,
        volume: volume.toString(),
        exchange: 'Binance',
        market: symbol,
        highlight: false
    };
}