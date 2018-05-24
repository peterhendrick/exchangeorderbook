'use strict';

const Poloniex = require('poloniex-api-node'),
    combineOrderBooks = require('./combined'),
    _ = require('lodash');

module.exports = subscribeToPoloniex;

function subscribeToPoloniex(io) {
    let poloniex = new Poloniex();
    let formattedBTCETHData;
    poloniex.subscribe('BTC_ETH');
    poloniex.on('message', (channelName, response, seq) => {
        if (channelName === 'BTC_ETH') {
            if(response[0].type === 'orderBook'){
                formattedBTCETHData = _formatInitialData(response[0], seq, channelName);
            }
            if(response[0].type === 'orderBookModify') {
                formattedBTCETHData = _addItem(response[0].data, seq, formattedBTCETHData, channelName);
            }
            if(response[0].type === 'orderBookRemove') {
                formattedBTCETHData = _removeItem(response[0].data, seq, formattedBTCETHData, channelName);
            }
            combineOrderBooks(io, formattedBTCETHData, null);
            // io.emit('poloniex', formattedBTCETHData);
        }
    });
    poloniex.on('error', error => {
        console.log(`An error has occurred: ${error}`);
    });

    poloniex.openWebSocket({version: 2});
}

function _formatItems(items, market, order) {
    return _.chain(items)
        .map((value, key) => {
            return {
                price: key,
                volume: value,
                exchange: 'Poloniex',
                market: market
            };
        })
        .orderBy(['price'], [order])
        .value();
}

function _formatInitialData(book, seq, market) {
    let asks = _formatItems(book.data.asks, market, 'asc');
    let bids = _formatItems(book.data.bids, market, 'desc');
    return {bids: bids, asks: asks, seq: seq};
}

function _addItem(data, seq, formattedData, market) {
    let addAskItem = data.type === 'ask' ? createItemObject(data, market) : null;
    let addBidItem = data.type === 'bid' ? createItemObject(data, market) : null;
    formattedData.asks = _.chain(formattedData.asks).concat(addAskItem).compact().value();
    formattedData.bids = _.chain(formattedData.bids).concat(addBidItem).compact().value();
    formattedData.seq = seq;
    return formattedData;
}

function _removeItem(data, seq, formattedData, market) {
    let removeAskItem = data.type === 'ask' ? createItemObject(data, market) : null;
    let removeBidItem = data.type === 'bid' ? createItemObject(data, market) : null;
    if(removeAskItem) formattedData.asks = _.filter(formattedData.asks, ask => ask.price !== removeAskItem.price && ask.volume !== removeAskItem.volume);
    if(removeBidItem) formattedData.bids = _.filter(formattedData.bids, bid => bid.price !== removeBidItem.price && bid.volume !== removeBidItem.volume);
    formattedData.seq = seq;
    return formattedData;
}

function createItemObject(data, market) {
    return {
        price: data.rate,
        volume: data.amount,
        exchange: 'Poloniex',
        market: market
    };
}
