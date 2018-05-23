$(function () {
    let socket = io();

    socket.on('poloniex order book', function(orderBook) {
        $('#stockprice').text(orderBook);
    });
    socket.on('bittrex order book', function(data) {
        $('#test').text(data);
    });

});