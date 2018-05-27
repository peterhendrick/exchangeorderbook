const processResponse = require('../server/poloniex.js').processResponse,
    processRESTResponse = require('../server/poloniex.js').formatRESTResponse,
    formattedResponseObject = require('./json/formattedDataObject.json'),
    expectedData = require('./expectedData.js')('Poloniex'),
    mockWebsocketResponse = require('./json/poloniexResponse.json').websocket,
    mockRESTResponse = require('./json/poloniexResponse.json').REST,
    assert = require('assert');


describe('Poloniex response handler', function () {
    it('should process websocket response properly', function (done) {
        let formattedData = processResponse('BTC_BCH', mockWebsocketResponse, formattedResponseObject);
        assert.deepEqual(formattedData, expectedData);
        done();
    });
    it('should process REST response properly', function (done) {
        let responseData = processRESTResponse(mockRESTResponse);
        let formattedData = processResponse('BTC_BCH', responseData, formattedResponseObject);
        assert.deepEqual(formattedData, expectedData);
        done();
    });
});