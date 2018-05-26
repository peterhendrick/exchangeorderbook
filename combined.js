'use strict';

const _ = require('lodash');
let poloniexBTCETH = {bids: [], asks: []},
    poloniexBTCBCH = {bids: [], asks: []},
    bittrexBTCETH = {bids: [], asks: []},
    bittrexBTCBCH = {bids: [], asks: []},
    binanceBTCETH = {bids: [], asks: []},
    binanceBTCBCH = {bids: [], asks: []};

module.exports = combineOrderBooks;

/**
 * Combines order books from multiple exchanges and emits event and data to the client
 * @param io: [Server] socket.io to send results to the client.
 * @param channelName: [String] String representing the market pair.
 * @param poloniexOrderBook: [Object] Formatted order book from the Poloniex Exchange
 * @param bittrexOrderBook: [Object] Formatted order book from the Bittrex Exchange
 * @param binanceOrderBook: [Object] Formatted order book from the Binance Exchange
 */
function combineOrderBooks(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook) {
    if(channelName === 'BTC_ETH') _formatAndEmitBTCETH(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook)
    if(channelName === 'BTC_BCH') _formatAndEmitBTCBCH(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook)
}

function _formatAndEmitBTCETH(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook) {
    if(poloniexOrderBook) poloniexBTCETH = poloniexOrderBook;
    if(bittrexOrderBook) bittrexBTCETH = bittrexOrderBook;
    if(binanceOrderBook) binanceBTCETH = binanceOrderBook;
    let combinedAsks = _.chain(bittrexBTCETH.asks)
        .concat(poloniexBTCETH.asks)
        .concat(binanceBTCETH.asks)
        .orderBy(['price'], ['asc'])
        .value();
    let combinedBids = _.chain(poloniexBTCETH.bids)
        .concat(bittrexBTCETH.bids)
        .concat(binanceBTCETH.bids)
        .orderBy(['price'], ['desc'])
        .value();
    console.log(`Bids: ${combinedBids.length}   Asks: ${combinedAsks.length}`);
    let combinedOrderBook = {bids: combinedBids.slice(0, 50), asks: combinedAsks.slice(0, 50)};
    io.emit(`combined ${channelName} books`, combinedOrderBook);
}

function _formatAndEmitBTCBCH(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook) {
    if(poloniexOrderBook) poloniexBTCBCH = poloniexOrderBook;
    if(bittrexOrderBook) bittrexBTCBCH = bittrexOrderBook;
    if(binanceOrderBook) binanceBTCBCH = binanceOrderBook;
    let combinedAsks = _.chain(bittrexBTCBCH.asks)
        .concat(poloniexBTCBCH.asks)
        .concat(binanceBTCBCH.asks)
        .orderBy(['price'], ['asc'])
        .value();
    let combinedBids = _.chain(poloniexBTCBCH.bids)
        .concat(bittrexBTCBCH.bids)
        .concat(binanceBTCBCH.bids)
        .orderBy(['price'], ['desc'])
        .value();
    console.log(`Bids: ${combinedBids.length}   Asks: ${combinedAsks.length}`);
    let combinedOrderBook = {bids: combinedBids.slice(0, 50), asks: combinedAsks.slice(0, 50)};
    io.emit(`combined ${channelName} books`, combinedOrderBook);
}
