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
    Bittrex.websockets.subscribe(['BTC-ETH'], function(data) {
        if (data.M === 'updateExchangeState') {
            Bittrex.getorderbook({ market : 'BTC-ETH', type : 'both' }, function(response, err) {
                let formattedData = _formatData(response.result, data.Nounce, data.MarketName);
                formattedData.asks = _.slice(formattedData.asks, 0, 50);
                formattedData.bids = _.slice(formattedData.bids, 0, 50);
                combineOrderBooks(io, null, formattedData);
                // io.emit('bittrex', formattedData);
                // io.emit('bittrex order book', 'success');
            });
        }
    });
}

/**
 * Format Bittrex Response
 * @param book: [Object] The first item in the array response from Bittrex.
 * @param seq: [Number] Sequence number included with the response
 * @param market: [String] Cryptocurrecny pair with bids or asks
 * @returns {{bids: *, asks: *}}: [Object] Formatted object to be combined with other exchange data.
 * @private
 */

function _formatData(book, seq, market) {
    let asks = _.chain(book.sell)
        .map(ask => _createItemObject(ask, market))
        .orderBy(['price'], ['asc'])
        .value();
    let bids = _.chain(book.buy)
        .map(bid => _createItemObject(bid, market))
        .orderBy(['price'], ['desc'])
        .value();
    return {bids: bids, asks: asks, seq: seq};
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
        price: data.Rate,
        volume: data.Quantity,
        exchange: 'Bittrex',
        market: market
    };
}
