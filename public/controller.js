$(function () {
    let socket = io();
    let bidTable;
    let askTable;
    let dtBid = $('#bidTable').DataTable({
        show: false,
        search: false
    });
    let dtAsk = $('#askTable').DataTable({
        show: false,
        search: false
    });

    socket.on('combined books', function(orderBook) {
        let asks = orderBook.asks;
        let bids = orderBook.bids;
        _createTable(bids, '#bidTable', dtBid);
        _createTable(asks, '#askTable', dtAsk);
    });

    function _createTable(orderBook, tableId, dataTable) {
        dataTable.clear();
        orderBook.forEach(order => {
            let row = $('<tr>');
            row.append($('<td>', {html: order.price}))
                .append($('<td>', {html: order.volume}))
                .append($('<td>', {html: order.exchange}))
                .append($('<td>', {html: order.market}));
            dataTable.rows.add(row);
        });
        dataTable.draw();
    }

});