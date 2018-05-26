'use strict';

const Poloniex = require('poloniex-api-node'),
    combineOrderBooks = require('./combined'),
    _ = require('lodash');

module.exports = subscribeToPoloniex;

/**
 * Subscribes to Poloniex and processes response
 * @param io: passes socket.io to the combineOrderBooks module
 */
function subscribeToPoloniex(io) {
    let poloniex = new Poloniex();
    let formattedData;

    poloniex.subscribe('BTC_ETH');
    poloniex.subscribe('BTC_BCH');
    poloniex.on('message', (channelName, response, seq) => {
        try{
            _proccessResponse(io, channelName, response, seq)
        } catch (err) {
            console.log(`Error in Poloniex Response`);
        }
    });
    poloniex.on('error', error => console.log(`An error has occurred: ${error}`));

    poloniex.openWebSocket({version: 2});

    /**
     * Processes raw response from Poloniex and formats the data then calls combinedOrderBooks module
     * @param io: [Server] Socket.io to be passed to the combineOrderBooks module
     * @param channelName: [String] Cryptocurrency pair
     * @param response: [Array] Array of one object containing the order book
     * @param seq: [Number] Sequence sent with the response from Poloniex
     * @private
     */
    function _proccessResponse(io, channelName, response, seq) {
        if(response[0].type === 'orderBook'){
            formattedData = _formatInitialData(response[0], seq, channelName);
        }
        if(response[0].type === 'orderBookModify') {
            formattedData = _addItem(response[0].data, seq, formattedData, channelName);
        }
        if(response[0].type === 'orderBookRemove') {
            formattedData = _removeItem(response[0].data, seq, formattedData, channelName);
        }
        if(formattedData.asks.length > 100) formattedData.asks = _.slice(formattedData.asks, 0, 100);
        if(formattedData.bids.length > 100) formattedData.bids = _.slice(formattedData.bids, 0, 100);
        combineOrderBooks(io, formattedData, null, null);
    }
}

/**
 * Formats ask and bid arrays from response
 * @param items: [Object] Collection of either ask or bid objects
 * @param market: [String] Cryptocurrency pair
 * @param sortOrder: [String] Sort order of the array to be returned
 * @returns [Array] Array of formatted objects, either ask or bid
 * @private
 */
function _formatItems(items, market, sortOrder) {
    return _.chain(items)
        .map((value, key) => _createItemObject({rate: key, amount: value}, market))
        .orderBy(['price'], [sortOrder])
        .value();
}

/**
 *
 * @param book: Raw order book data from Poloniex
 * @param seq: [Number] Sequence sent with the response from Poloniex
 * @param market
 * @returns {{bids: Array[], asks: Array[], seq: Number[]}}
 * @private
 */
function _formatInitialData(book, seq, market) {
    let asks = _formatItems(book.data.asks, market, 'asc');
    let bids = _formatItems(book.data.bids, market, 'desc');
    return {bids: bids, asks: asks, seq: seq};
}

/**
 * Add newly published ask or bid item to the current data
 * @param data [Object] Ask or bid item to be added to the current data
 * @param seq [Number] Sequence sent with the response from Poloniex
 * @param formattedData [Object] Contains bid and ask arrays of previously formatted data
 * @param market [String] Cryptocurrency pair
 * @returns [Object] Formatted data with the new addition
 * @private
 */
function _addItem(data, seq, formattedData, market) {
    let addAskItem = data.type === 'ask' ? _createItemObject(data, market) : null;
    let addBidItem = data.type === 'bid' ? _createItemObject(data, market) : null;
    formattedData.asks = _.chain(formattedData.asks).concat(addAskItem).orderBy(['price'], ['asc']).compact().value();
    formattedData.bids = _.chain(formattedData.bids).concat(addBidItem).orderBy(['price'], ['desc']).compact().value();
    formattedData.seq = seq;
    return formattedData;
}

/**
 * Add filled ask or bid item from the current data
 * @param data: [Object] Ask or bid item to be removed from the current data
 * @param seq: [Number] Sequence sent with the response from Poloniex
 * @param formattedData: [Object] Contains bid and ask arrays of previously formatted data
 * @param market: [String] Cryptocurrency pair
 * @returns {*}
 * @private
 */
function _removeItem(data, seq, formattedData, market) {
    let removeAskItem = data.type === 'ask' ? _createItemObject(data, market) : null;
    let removeBidItem = data.type === 'bid' ? _createItemObject(data, market) : null;
    if(removeAskItem) formattedData.asks = _filterArray(formattedData.asks, removeAskItem);
    if(removeBidItem) formattedData.bids = _filterArray(formattedData.bids, removeBidItem);
    formattedData.seq = seq;
    return formattedData;
}

/**
 * Filters array and returns new array with the filtered item removed
 * @param array [Array] Array to be filtered
 * @param filterItem [Object] Object to be removed from the array
 * @returns [Array] Filtered array
 * @private
 */
function _filterArray(array, filterItem) {
    return _.filter(array, item => item.price !== filterItem.price && item.volume !== filterItem.volume);
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
        price: data.rate,
        volume: data.amount,
        exchange: 'Poloniex',
        market: market,
        highlight: false
    };
}
