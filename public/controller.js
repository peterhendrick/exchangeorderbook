$(function () {
    let socket = io();
    let bidDT = $('#bidTable').DataTable({
        paging: false,
        pageLength: 50,
        searching: false,
        lengthChange: false
    });
    let askDT = $('#askTable').DataTable({
        paging: false,
        pageLength: 50,
        searching: false,
        lengthChange: false
    });

    socket.on('combined books', function(orderBook) {
        _createTable(orderBook.bids, bidDT);
        _createTable(orderBook.asks, askDT);
    });

    function _createTable(orderBook, dataTable) {
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