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
 * @param channelName: [String] Cryptocurrency market pair.
 * @param poloniexOrderBook: [Object] Formatted order book from the Poloniex Exchange
 * @param bittrexOrderBook: [Object] Formatted order book from the Bittrex Exchange
 * @param binanceOrderBook: [Object] Formatted order book from the Binance Exchange
 */
function combineOrderBooks(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook) {
    if(channelName === 'BTC_ETH') _formatAndEmitBTCETH(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook);
    if(channelName === 'BTC_BCH') _formatAndEmitBTCBCH(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook);
}

function _formatAndEmitBTCETH(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook) {
    let ticker = poloniexOrderBook ? poloniexOrderBook.ticker : null;
    if(poloniexOrderBook) poloniexBTCETH = poloniexOrderBook;
    if(bittrexOrderBook) bittrexBTCETH = bittrexOrderBook;
    if(binanceOrderBook) binanceBTCETH = binanceOrderBook;
    let combinedAsks = _combinedArray(bittrexBTCETH.asks, poloniexBTCETH.asks, binanceBTCETH.asks, 'asc');
    let combinedBids = _combinedArray(poloniexBTCETH.bids, bittrexBTCETH.bids, binanceBTCETH.bids, 'desc');
    let combinedOrderBook = {ticker: ticker, bids: combinedBids.slice(0, 150), asks: combinedAsks.slice(0, 150)};
    io.emit(`combined ${channelName} books`, combinedOrderBook);
}

function _formatAndEmitBTCBCH(io, channelName, poloniexOrderBook, bittrexOrderBook, binanceOrderBook) {
    let ticker = poloniexOrderBook ? poloniexOrderBook.ticker : null;
    if(poloniexOrderBook) poloniexBTCBCH = poloniexOrderBook;
    if(bittrexOrderBook) bittrexBTCBCH = bittrexOrderBook;
    if(binanceOrderBook) binanceBTCBCH = binanceOrderBook;
    let combinedAsks = _combinedArray(bittrexBTCBCH.asks, poloniexBTCBCH.asks, binanceBTCBCH.asks, 'asc');
    let combinedBids = _combinedArray(poloniexBTCBCH.bids, bittrexBTCBCH.bids, binanceBTCBCH.bids, 'desc');
    let combinedOrderBook = {ticker: ticker, bids: combinedBids.slice(0, 150), asks: combinedAsks.slice(0, 150)};
    io.emit(`combined ${channelName} books`, combinedOrderBook);
}

function _combinedArray(arr1, arr2, arr3, sort) {
    return _.chain(arr1)
        .concat(arr2)
        .concat(arr3)
        .tap(combinedArray => _mergeMatchingPricePoints(combinedArray))
        .orderBy(['price'], [sort])
        .filter(item => !_.includes(item.price, 'e')) // Bittrex was returning weird trades that threw off highlighting
        .value();
}

function _mergeMatchingPricePoints(combinedArray) {
    combinedArray.forEach(order => {
        let dupPrices = _.filter(combinedArray, item => Number(order.price) === Number(item.price));
        if(dupPrices.length > 1) {
            _.remove(combinedArray, function(order) {
                return _.includes(dupPrices, order);
            });
            let combinedVolume = _.sumBy(dupPrices, order => Number(order.volume));
            combinedVolume = _.round(combinedVolume, 8).toString();
            let combinedExchangeArray = _.chain(dupPrices).map(order => order.exchange).uniq().value();
            let exchangesString = '';
            combinedExchangeArray.forEach((exchangeString, index) => {
                if(index === 0) exchangesString += exchangeString;
                if(index > 0) exchangesString += `, ${exchangeString}`;
            });
            combinedArray.push({
                price: dupPrices[0].price,
                volume: combinedVolume,
                exchange: exchangesString,
                market: dupPrices[0].market,
                highlight: dupPrices[0].highlight
            })
        }
    });
    return combinedArray;
}