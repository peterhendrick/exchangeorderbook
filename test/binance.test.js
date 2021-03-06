const processResponse = require('../server/binance').processResponse,
    expectedData = require('./expectedData.js')('Binance'),
    mockResponse = require('./json/binanceResponse.json'),
    assert = require('assert');

describe('Binance response handler', function () {
    it('should process response properly', function (done) {
        let formattedData = processResponse('BTC_BCH', mockResponse);
        assert.deepEqual(formattedData, expectedData);
        done();
    });
});