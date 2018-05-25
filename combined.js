'use strict';

const _ = require('lodash');
let poloniex = {bids: [], asks: []},
    bittrex = {bids: [], asks: []};

module.exports = combineOrderBooks;

/**
 * Combines order books from multiple exchanges and emits event and data to the client
 * @param io: [Server] socket.io to send results to the client.
 * @param poloniexOrderBook: [Object] Formatted order book from the Poloniex Exchange
 * @param bittrexOrderBook: [Object] Formatted order book from the Bittrex Exchange
 */
function combineOrderBooks(io, poloniexOrderBook, bittrexOrderBook) {
    if(poloniexOrderBook !== null) poloniex = poloniexOrderBook;
    if(bittrexOrderBook !== null) bittrex = bittrexOrderBook;
    let combinedAsks = _.chain(bittrex.asks)
        .concat(poloniex.asks)
        .orderBy(['price'], ['asc'])
        .value();
    let combinedBids = _.chain(bittrex.bids)
        .concat(poloniex.bids)
        .orderBy(['price'], ['desc'])
        .value();
    console.log(`Bids: ${combinedBids.length}   Asks: ${combinedAsks.length}`);
    let combinedOrderBook = {bids: combinedBids, asks: combinedAsks};
    io.emit('combined books', combinedOrderBook);

}