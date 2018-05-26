$(function () {
    let socket = io();
    let bidDT = $('#bidTable').DataTable({
        paging: false,
        pageLength: 50,
        searching: false,
        order: [[ 0, 'desc' ]],
        lengthChange: false
    });
    let askDT = $('#askTable').DataTable({
        paging: false,
        pageLength: 50,
        searching: false,
        order: [[ 0, 'asc' ]],
        lengthChange: false
    });

    socket.on('combined books', function(orderBook) {
        _setHighlights(orderBook);
        _createTable(orderBook.bids, bidDT, 'bids');
        _createTable(orderBook.asks, askDT, 'asks');
    });

    function _createTable(orderBook, dataTable, type) {
        dataTable.clear();
        orderBook.forEach(order => {
            let row;
            if(order.highlight && type === 'bids') {
                row = $('<tr style="color: green">');
            } else if(order.highlight && type === 'asks') {
                row = $('<tr style="color: red">');
            } else {
                row = $('<tr>');
            }
            row.append($('<td>', {html: order.price}))
                .append($('<td>', {html: order.volume}))
                .append($('<td>', {html: order.exchange}))
                .append($('<td>', {html: order.market}));
            dataTable.rows.add(row);
        });
        dataTable.draw();
    }

    function _setHighlights(orderBook) {
        let highestBid = _.head(orderBook.bids);
        let lowestAsk = _.head(orderBook.asks);

        orderBook.bids.forEach(bid => {
            if(bid.price > lowestAsk.price) {
                bid.highlight = true;
            }
        });
        orderBook.asks.forEach(ask => {
            if(ask.price < highestBid.price) {
                ask.highlight = true;
            }
        });
    }
});