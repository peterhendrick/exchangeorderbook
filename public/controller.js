$(function () {
    let socket = io();
    let BTC_ETHHOrderBook;
    let BTC_BCHOrderBook;
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
    $('#radio_1').on('click', function() {
        _updateTables(BTC_ETHHOrderBook);
    }).click();
    $('#radio_2').on('click', function() {
        _updateTables(BTC_BCHOrderBook);
    });

    socket.on('combined BTC_ETH books', function(orderBook) {
        BTC_ETHHOrderBook = orderBook;
        if($('#radio_1').is(':checked')) {
            _updateTables(BTC_ETHHOrderBook);
        }
    });

    socket.on('combined BTC_BCH books', function (orderBook) {
        BTC_BCHOrderBook = orderBook;
        if($('#radio_2').is(':checked')) {
            _updateTables(BTC_BCHOrderBook);
        }
    });

    function _updateTables(orderBook) {
        if(!orderBook) return;
        _setHighlights(orderBook);
        _createTable(orderBook.bids, bidDT, 'bids');
        _createTable(orderBook.asks, askDT, 'asks');
    }

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