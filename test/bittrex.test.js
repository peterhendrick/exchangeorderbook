const processResponse = require('../server/bittrex.js').formatOrderBook,
    formattedResponseObject = require('./json/formattedDataObject.json'),
    expectedData = require('./expectedData.js')('Bittrex'),
    mockResponse = require('./json/bittrexResponse.json'),
    assert = require('assert');


describe('Bittrex response handler', function () {
    it('should process response properly', function (done) {
        let formattedData = processResponse(mockResponse, formattedResponseObject);
        assert.deepEqual(formattedData, expectedData);
        done();
    });
});