'use strict';

const _ = require('lodash');
let poloniex = {bids: [], asks: []},
    bittrex = {bids: [], asks: []},
    binance = {bids: [], asks: []};

module.exports = combineOrderBooks;

/**
 * Combines order books from multiple exchanges and emits event and data to the client
 * @param io: [Server] socket.io to send results to the client.
 * @param poloniexOrderBook: [Object] Formatted order book from the Poloniex Exchange
 * @param bittrexOrderBook: [Object] Formatted order book from the Bittrex Exchange
 * @param binanceOrderBook: [Object] Formatted order book from the Binance Exchange
 */
function combineOrderBooks(io, poloniexOrderBook, bittrexOrderBook, binanceOrderBook) {
    if(poloniexOrderBook) poloniex = poloniexOrderBook;
    if(bittrexOrderBook) bittrex = bittrexOrderBook;
    if(binanceOrderBook) binance = binanceOrderBook;
    let combinedAsks = _.chain(bittrex.asks)
        .concat(poloniex.asks)
        .concat(binance.asks)
        .orderBy(['price'], ['asc'])
        .value();
    let combinedBids = _.chain(bittrex.bids)
        .concat(poloniex.bids)
        .concat(binance.bids)
        .orderBy(['price'], ['desc'])
        .value();
    console.log(`Bids: ${combinedBids.length}   Asks: ${combinedAsks.length}`);
    let combinedOrderBook = {bids: combinedBids.slice(0, 50), asks: combinedAsks.slice(0, 50)};
    io.emit('combined books', combinedOrderBook);
}
