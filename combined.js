'use strict';

const _ = require('lodash');
let poloniex = {bids: [], asks: []},
    poloniexBidHead = {},
    poloniexAskHead = {},
    bittrex = {bids: [], asks: []},
    bittrexBidHead = {},
    bittrexAskHead = {},
    binance = {bids: [], asks: []},
    binanceBidHead = {},
    binanceAskHead = {};

module.exports = combineOrderBooks;

/**
 * Combines order books from multiple exchanges and emits event and data to the client
 * @param io: [Server] socket.io to send results to the client.
 * @param poloniexOrderBook: [Object] Formatted order book from the Poloniex Exchange
 * @param bittrexOrderBook: [Object] Formatted order book from the Bittrex Exchange
 */
function combineOrderBooks(io, poloniexOrderBook, bittrexOrderBook, binanceOrderBook) {
    if(poloniexOrderBook !== null) {
        poloniex = poloniexOrderBook;
        poloniexBidHead = _.head(poloniex.bids);
        poloniexAskHead = _.head(poloniex.asks);
    }
    if(bittrexOrderBook !== null) {
        bittrex = bittrexOrderBook;
        bittrexBidHead = _.head(bittrex.bids);
        bittrexAskHead = _.head(bittrex.asks);
    }
    if(binanceOrderBook !== null) {
        binance = binanceOrderBook;
        binanceBidHead = _.head(binance.bids);
        binanceAskHead = _.head(binance.asks);
    }
    let highestBid = _getMax(Number(poloniexBidHead.price), Number(bittrexBidHead.price), Number(binanceBidHead.price));
    let lowestAsk = _getMin(Number(poloniexAskHead.price), Number(bittrexAskHead.price), Number(binanceAskHead.price));
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
    if(highestBid > lowestAsk) {
        combinedOrderBook.bids = _setHighlightProperties(combinedOrderBook.bids, lowestAsk, 'bids');
        combinedOrderBook.asks = _setHighlightProperties(combinedOrderBook.asks, highestBid, 'asks');
    }

    io.emit('combined books', combinedOrderBook);

}

function _setHighlightProperties(book, comparison, type) {
    if(type === 'bids') {
        book.forEach(order => {
            if(Number(order.price) > comparison) order.highlight = true;
        });
    } else if(type === 'asks') {
        book.forEach(order => {
            if(Number(order.price) < comparison) order.highlight = true;
        });
    }
    return book;
}

function _getMax(num1, num2, num3) {
    let array = _.compact([num1, num2, num3]);
    return Math.max(...array);
}

function _getMin(num1, num2, num3) {
    let array = _.compact([num1, num2, num3]);
    return Math.min(...array);
}