$(function () {
    let socket = io();
    let BTC_ETHOrderBook;
    let BTC_BCHOrderBook;
    let BTC_ETHTicker;
    let BTC_BCHTicker;

    let bidDT = _initializeDataTable('#bidTable', 'desc');
    let askDT = _initializeDataTable('#askTable', 'asc');

    $('#BTC_ETH').on('click', function() {
        $('#ticker').text(BTC_ETHTicker + ' BTC / ETH');
        _updateTables(BTC_ETHOrderBook);
    }).click();

    $('#BTC_BCH').on('click', function() {
        $('#ticker').text(BTC_BCHTicker + ' BTC / BCH');
        _updateTables(BTC_BCHOrderBook);
    });

    socket.on('combined BTC_ETH books', function(orderBook) {
        BTC_ETHOrderBook = orderBook;
        if(orderBook.ticker) BTC_ETHTicker = orderBook.ticker;
        if($('#BTC_ETH').is(':checked')) {
            $('#ticker').text(BTC_ETHTicker + ' BTC / ETH');
            _updateTables(BTC_ETHOrderBook);
        }
    });

    socket.on('combined BTC_BCH books', function (orderBook) {
        BTC_BCHOrderBook = orderBook;
        if(orderBook.ticker) BTC_BCHTicker = orderBook.ticker;
        if($('#BTC_BCH').is(':checked')) {
            $('#ticker').text(BTC_BCHTicker + ' BTC / BCH');
            _updateTables(BTC_BCHOrderBook);
        }
    });

    function _initializeDataTable(id, sortOrder) {
        return $(id).DataTable({
            paging: false,
            searching: false,
            order: [[ 0, sortOrder ]],
            lengthChange: false,
            info: false,
            autoWidth: false,
            columnDefs: [{
                'targets': '_all',
                'createdCell': function (td) {
                    $(td).css('padding', '10px');
                }
            }]
        });
    }

    function _updateTables(orderBook) {
        if(!orderBook) return;
        _setHighlights(orderBook);
        _createTable(orderBook.bids, bidDT, 'bids');
        _createTable(orderBook.asks, askDT, 'asks');
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

    function _createTable(orderBook, dataTable, type) {
        dataTable.clear();
        orderBook.forEach(order => {
            let row;
            if(order.highlight && type === 'bids') {
                row = $('<tr class="bids">');
            } else if(order.highlight && type === 'asks') {
                row = $('<tr class="asks">');
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

});