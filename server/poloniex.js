'use strict';

const Poloniex = require('poloniex-api-node'),
    combineOrderBooks = require('./combined'),
    _ = require('lodash');

module.exports = {
    subscribeToPoloniex: subscribeToPoloniex,
    processResponse: processResponse,
    formatRESTResponse: formatRESTResponse
};

/**
 * Subscribes to Poloniex and processes response
 * @param io: passes socket.io to the combineOrderBooks module
 */
async function subscribeToPoloniex(io) {
    let poloniex = new Poloniex();
    let formattedBTCETHData = {asks: [], bids: []};
    let formattedBTCBCHData = {asks: [], bids: []};
    let BTC_ETHTicker;
    let BTC_BCHTicker;

    poloniex.subscribe('BTC_ETH');
    poloniex.subscribe('BTC_BCH');
    try {
        let tickers = await poloniex.returnTicker();
        BTC_ETHTicker = tickers.BTC_ETH.last;
        BTC_BCHTicker = tickers.BTC_BCH.last;
    } catch (err) {
        console.log(err);
    }
    // Poloniex orders were becoming stale due to missed removes or updates, this setInterval function will
    // refresh the base data every 60 seconds to ensure removal of stale orders.
    setInterval(async function () {
        let BTC_ETHResponse = await poloniex.returnOrderBook('BTC_ETH', 100);
        let BTC_BCHResponse = await poloniex.returnOrderBook('BTC_BCH', 100);
        let tickers = await poloniex.returnTicker();
        BTC_ETHTicker = tickers.BTC_ETH.last;
        BTC_BCHTicker = tickers.BTC_BCH.last;
        BTC_ETHResponse = formatRESTResponse(BTC_ETHResponse);
        BTC_BCHResponse = formatRESTResponse(BTC_BCHResponse);
        processResponse('BTC_ETH', BTC_ETHResponse, formattedBTCETHData);
        processResponse('BTC_BCH', BTC_BCHResponse, formattedBTCBCHData);
        combineOrderBooks(io, 'BTC_ETH', formattedBTCETHData, null, null);
        combineOrderBooks(io, 'BTC_BCH', formattedBTCBCHData, null, null);
    }, 60000);
    poloniex.on('message', (channelName, response, seq) => {
        try{
            if(channelName === 'BTC_ETH') {
                formattedBTCETHData = processResponse(channelName, response, formattedBTCETHData);
                formattedBTCETHData.ticker = BTC_ETHTicker;
                combineOrderBooks(io, channelName, formattedBTCETHData, null, null);
            } else if(channelName === 'BTC_BCH') {
                formattedBTCBCHData = processResponse(channelName, response, formattedBTCBCHData);
                formattedBTCBCHData.ticker = BTC_BCHTicker;
                combineOrderBooks(io, channelName, formattedBTCBCHData, null, null);
            }
        } catch (err) {
            console.log('Error in Poloniex Response');
        }
    });
    poloniex.on('error', error => console.log(`An error has occurred: ${error}`));

    poloniex.openWebSocket({version: 2});

}

/**
 * Processes raw response from Poloniex and formats the data then calls combinedOrderBooks module
 * @param io: [Server] Socket.io to be passed to the combineOrderBooks module
 * @param channelName: [String] Cryptocurrency pair
 * @param response: [Array] Array of one object containing the order book
 * @param seq: [Number] Sequence sent with the response from Poloniex
 * @private
 */
function processResponse(channelName, response, formattedData) {
    if(response[0].type === 'orderBook'){
        formattedData = _formatInitialData(response[0], channelName);
    }
    if(response[0].type === 'orderBookModify') {
        formattedData = _addItem(response[0].data, formattedData, channelName);
    }
    if(response[0].type === 'orderBookRemove') {
        formattedData = _removeItem(response[0].data, formattedData, channelName);
    }
    if(formattedData.asks.length > 100) formattedData.asks = _.slice(formattedData.asks, 0, 100);
    if(formattedData.bids.length > 100) formattedData.bids = _.slice(formattedData.bids, 0, 100);
    return formattedData;
}

function formatRESTResponse(getOrderBookResponse) {
    let formattedResponse = {asks: {}, bids: {}};
    getOrderBookResponse.asks.forEach(ask => {
        let askObject = _.fromPairs([ask]);
        _.assign(formattedResponse.asks, askObject);
    });
    getOrderBookResponse.bids.forEach(bid => {
        let bidObject = _.fromPairs([bid]);
        _.assign(formattedResponse.bids, bidObject);
    });
    return [
        {
            data: formattedResponse,
            type: 'orderBook'
        }
    ]
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
function _formatInitialData(book, market) {
    let asks = _formatItems(book.data.asks, market, 'asc');
    let bids = _formatItems(book.data.bids, market, 'desc');
    return {bids: bids, asks: asks};
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
function _addItem(data, formattedData, market) {
    let addAskItem = data.type === 'ask' ? _createItemObject(data, market) : null;
    let addBidItem = data.type === 'bid' ? _createItemObject(data, market) : null;
    if(addAskItem) formattedData.asks = _filterArray(formattedData.asks, addAskItem);
    if(addBidItem) formattedData.bids = _filterArray(formattedData.bids, addBidItem);
    formattedData.asks = _.chain(formattedData.asks).concat(addAskItem).orderBy(['price'], ['asc']).compact().value();
    formattedData.bids = _.chain(formattedData.bids).concat(addBidItem).orderBy(['price'], ['desc']).compact().value();
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
function _removeItem(data, formattedData, market) {
    let removeAskItem = data.type === 'ask' ? _createItemObject(data, market) : null;
    let removeBidItem = data.type === 'bid' ? _createItemObject(data, market) : null;
    if(removeAskItem) formattedData.asks = _filterArray(formattedData.asks, removeAskItem);
    if(removeBidItem) formattedData.bids = _filterArray(formattedData.bids, removeBidItem);
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
    return _.filter(array, item => item.price !== filterItem.price);
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
