'use strict';

const _ = require('lodash');
let poloniex = {bids: [], asks: []};
let poloniexAskHead = {};
let poloniexBidHead = {};
let bittrex = {bids: [], asks: []};
let bittrexAskHead = {};
let bittrexBidHead = {};

module.exports = combineOrderBooks;

function combineOrderBooks(io, poloniexOrderBook, bittrexOrderBook) {
    if(poloniexOrderBook !== null) {
        poloniex = poloniexOrderBook;
        poloniexAskHead = _.head(poloniex.asks);
        poloniexBidHead = _.head(poloniex.bids);
    }
    if(bittrexOrderBook !== null) {
        bittrex = bittrexOrderBook;
        bittrexAskHead = _.head(bittrex.asks);
        bittrexBidHead = _.head(bittrex.bids);
    }
    let combinedAsks = _.chain(bittrex.asks)
        .concat(poloniex.asks)
        .orderBy(['price'], ['asc'])
        .value();
    let combinedBids = _.chain(bittrex.bids)
        .concat(poloniex.bids)
        .orderBy(['price'], ['desc'])
        .value();
    console.log(combinedBids.length);
    let combinedOrderBook = {bids: combinedBids, asks: combinedAsks};
    // io.emit('combined books', 'success');
    // io.emit('combined books', combinedOrderBook);

}