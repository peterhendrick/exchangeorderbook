'use strict';

const Bittrex = require('node-bittrex-api'),
    combineOrderBooks = require('./combined'),
    bluebird = require('bluebird'),
    _ = require('lodash');

module.exports = {
    subscribeToBittrex: subscribeToBittrex,
    formatOrderBook: formatOrderBook
};

let orderbookPromise = bluebird.promisify(Bittrex.getorderbook);

/**
 * Subscribe to the Bittrex websocket
 * @param io: {Server} passes socket.io to be used by the combineOrderBooks module
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
 * @param io: {Server} passes socket.io to be used by the combineOrderBooks module
 */
async function connect(io) {
    let formattedETHData;
    let formattedBCHData;
    await _updateBaseData();

    // Setting interval to replace initial order book every minute in order to remove stale records.
    setInterval(async function () {
        await _updateBaseData();
    }, 60000);
    Bittrex.websockets.subscribe(['BTC-ETH', 'BTC-BCC'], function(data) {
        if(data.A[0].MarketName === 'BTC-ETH') {
            formattedETHData = formatOrderBook(data, formattedETHData, io);
            combineOrderBooks(io, 'BTC_ETH', null, formattedETHData, null);
        }
        if(data.A[0].MarketName === 'BTC-BCC') {
            formattedBCHData = formatOrderBook(data, formattedBCHData, io);
            combineOrderBooks(io, 'BTC_BCH', null, formattedBCHData, null);
        }
    });

    async function _updateBaseData() {
        let [ethOrderBook, bchOrderBook] = await Promise.all([
            // The Bittrex module breaks nodejs convention and returns success as first callback parameter
            // bluebird treats this first parameter as an error so need to catch and return the error.
            orderbookPromise({ market : 'BTC-ETH', type : 'both' }).catch(err => err),
            orderbookPromise({ market : 'BTC-BCC', type : 'both' }).catch(err => err)
        ]);
        formattedETHData = _formatInitialData(ethOrderBook.result, 'BTC_ETH');
        combineOrderBooks(io, 'BTC_ETH', null, formattedETHData, null);
        formattedBCHData = _formatInitialData(bchOrderBook.result, 'BTC_BCH');
        combineOrderBooks(io, 'BTC_BCH', null, formattedBCHData, null);
    }
}

/**
 * Formats data from the REST Api call to get or reset the initial order book
 * @param book {Object} The result property from the Bittrex REST API call.
 * @param market {String} Cryptocurrency market pair.
 * @returns {Object} Bids and asks to be combined with other exchanges and sent to the client.
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
 * Updates the existing order book data based on updates from the websocket.
 * @param data {Object} Raw data response from the bittrex websocket
 * @param formattedData {Object} Existing formatted data already in memory from previous REST and websocket results.
 * @returns {Object} Updated formatted data to be combined with other exchanges to be sent to the client.
 */
function formatOrderBook(data, formattedData) {
    if (data.M === 'updateExchangeState') {
        let symbol = _formatSymbol(data.A[0].MarketName);
        try{
            let orderBookUpdates = data.A[0];
            formattedData.bids = _updateItems(formattedData.bids, orderBookUpdates.Buys, 'desc', symbol);
            formattedData.asks = _updateItems(formattedData.asks, orderBookUpdates.Sells, 'asc', symbol);

            formattedData.asks = _.slice(formattedData.asks, 0, 100);
            formattedData.bids = _.slice(formattedData.bids, 0, 100);
            return formattedData;
        } catch (err) {
            console.log('Error in bittrex response');
        }
    }
}

function _formatSymbol(symbol) {
    if(symbol === 'BTC-ETH') return 'BTC_ETH';
    if(symbol === 'BTC-BCC') return 'BTC_BCH';
}

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
        baseArray = _.filter(baseArray, initialItem => initialItem.price !== item.price);
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
