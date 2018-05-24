$(function () {
    let socket = io();

    socket.on('combined books', function(orderBook) {
        $('#stockprice').text(orderBook);
    });

});