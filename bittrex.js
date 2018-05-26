'use strict';

const Bittrex = require('node-bittrex-api'),
    combineOrderBooks = require('./combined'),
    _ = require('lodash');

module.exports = subscribeToBittrex;

/**
 * Subscribe to the Bittrex websocket
 * @param io: passes socket.io to be used by the combineOrderBooks module
 */
function subscribeToBittrex(io) {
    Bittrex.options({
        websockets: {
            onConnect: connect(io)
        }
    });

    Bittrex.websockets.client();
}

/**
 * Connect to Bittrex, make call to get order book and format response
 * @param io: passes socket.io to be used by the combineOrderBooks module
 */
function connect(io) {
    Bittrex.getorderbook({ market : 'BTC-ETH', type : 'both' }, function(ethOrderBook) {
        let formattedETHData = ethOrderBook.result;
        formattedETHData = _formatInitialData(formattedETHData, 'BTC_ETH');
        combineOrderBooks(io, 'BTC_ETH', null, formattedETHData, null);
        Bittrex.getorderbook({ market: 'BTC-BCC', type: 'both'}, function (bchOrderBook) {
            let formattedBCHData = bchOrderBook.result;
            formattedBCHData = _formatInitialData(formattedBCHData, 'BTC_BCH');
            combineOrderBooks(io, 'BTC_BCH', null, formattedBCHData, null);
            Bittrex.websockets.subscribe(['BTC-ETH', 'BTC-BCC'], function(data) {
                if(data.A[0].MarketName === 'BTC-ETH') _formatOrderBook(data, formattedETHData, io);
                if(data.A[0].MarketName === 'BTC-BCC') _formatOrderBook(data, formattedBCHData, io);
            });
        })
    });
}

function _formatOrderBook(data, formattedData, io) {
    if (data.M === 'updateExchangeState') {
        // type: 0 = add, 1 = remove, 2 = update
        let symbol = _formatSymbol(data.A[0].MarketName);
        try{
            let orderBookUpdates = data.A[0];
            formattedData.bids = _updateItems(formattedData.bids, orderBookUpdates.Buys, 'desc', symbol);
            formattedData.asks = _updateItems(formattedData.asks, orderBookUpdates.Sells, 'asc', symbol);

            formattedData.asks = _.slice(formattedData.asks, 0, 100);
            formattedData.bids = _.slice(formattedData.bids, 0, 100);
            combineOrderBooks(io, symbol, null, formattedData, null);
        } catch (err) {
            console.log(`Error in bittrex response`);
        }
    }
}

function _formatSymbol(symbol) {
    if(symbol === 'BTC-ETH') return 'BTC_ETH';
    if(symbol === 'BTC-BCC') return 'BTC_BCH';
}

/**
 * Format Bittrex Response
 * @param book: [Object] The first item in the array response from Bittrex.
 * @param seq: [Number] Sequence number included with the response
 * @param market: [String] Cryptocurrecny pair with bids or asks
 * @returns {{bids: *, asks: *}}: [Object] Formatted object to be combined with other exchange data.
 * @private
 */

function _formatInitialData(book, market) {
    let asks = _.chain(book.sell)
        .map(ask => _createItemObject(ask, market))
        .orderBy(['price'], ['asc'])
        .value();
    let bids = _.chain(book.buy)
        .map(bid => _createItemObject(bid, market))
        .orderBy(['price'], ['desc'])
        .value();
    return {bids: bids, asks: asks};
}

/**
 * Creates a formatted object to be sent to the client
 * @param data: [Object] Ask or bid item to be formatted
 * @param market: [String] Cryptocurrency pair
 * @returns [Object] Formatted ask or bid object
 * @private
 */
function _createItemObject(data, market) {
    return {
        price: data.Rate.toString(),
        volume: data.Quantity.toString(),
        exchange: 'Bittrex',
        market: market,
        highlight: false
    };
}

function _updateItems(baseArray, updateArray, sortOrder, market) {
    let addItems = updateArray.filter(item => item.Type === 0);
    let removeItems = updateArray.filter(item => item.Type === 1);
    let updateItems = updateArray.filter(item => item.Type === 2);
    addItems = _.map(addItems, item => _createItemObject(item, market));
    removeItems = _.map(removeItems, item => _createItemObject(item, market));
    updateItems = _.map(updateItems, item => _createItemObject(item, market));

    baseArray = _.concat(baseArray, addItems);
    removeItems.forEach(item => {
        baseArray = _.filter(baseArray, initialItem => {
            return initialItem.price !== item.price && initialItem.volume !== item.volume;
        });
    });
    updateItems.forEach(item => {
        baseArray = _.filter(baseArray, initialItem => initialItem.price !== item.price);
    });
    baseArray = _.chain(baseArray)
        .concat(updateItems)
        .orderBy(['price'], [sortOrder])
        .value();
    return baseArray;
}
