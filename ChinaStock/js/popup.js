var CS = (function () {
    var config = {
        refreshTime: 3000,
        apiDataUrl: function (stocks) {
            return "http://hq.sinajs.cn/list=" + stocks;
        },
        apiSearchUrl: function (key) {
            return "http://suggest3.sinajs.cn/suggest/key=" + key;
        },
        apiChartTimelineUrl: function (stock) {
            return "http://image.sinajs.cn/newchart/min/n/" + stock + ".gif";
        },
        defaultStocks: "sh000001,sz399001,sz399006",
        stocksDataKey: "stocks"
    };
    var parsePriceData = function (data) {
        var result = [];
        if (typeof data === "string" && data.length > 0) {
            var dataArray = data.split(";");
            for (var i = 0; i < dataArray.length; i++) {
                var sDataResult = parseSinglePriceData(dataArray[i]);
                if (sDataResult !== null) {
                    result.push(sDataResult);
                }
            }
        }
        return result;
    };
    var parseSinglePriceData = function (data) {
        var result = null;
        var values = data.split(/_|="|,|"/);
        if (values.length > 35) {
            result = {
                id: values[2],
                name: values[3], // 名字
                todayOpeningPrice: parseFloat(values[4]), // 今日开盘价
                yesterdayClosingPrice: parseFloat(values[5]), // 昨日收盘价
                currentPrice: parseFloat(values[6]), // 当前价格
                date: values[33], // 日期
                time: values[34] // 时间
            };
            result.ad = (100 * (result.currentPrice - result.yesterdayClosingPrice) / result.yesterdayClosingPrice).toFixed(2) + "%"; // 当日涨跌幅
        }
        return result;
    };
    var parseSearchData = function (data) {
        var result = [];
        if (typeof data === "string" && data.length > 0) {
            var searchList = data.split(/"|;/);
            for (var i = 0; i < searchList.length; i++) {
                var sSearchResult = parseSingleSearchData(searchList[i]);
                if (sSearchResult !== null) {
                    result.push(sSearchResult);
                }
            }
        }
        return result;
    };
    var parseSingleSearchData = function (data) {
        var result = null;
        var values = data.split(/,/);
        if (values.length >= 6) {
            result = {
                id: values[3],
                name: values[4]
            };
        }
        return result;
    };
    var showPrice = function () {
        var url = config.apiDataUrl(getStocks());
        $.ajax({
            url: url,
            success: function (data) {
                var priceData = parsePriceData(data);
                for (var i = 0; i < priceData.length; i++) {
                    var item = priceData[i];
                    var uiItem = $("#" + item.id);
                    if (uiItem.length > 0) {
                        $(uiItem).find("td").each(function (i, o) {
                            if (i === 2) {
                                $(o).html(item.currentPrice);
                            } else if (i === 3) {
                                $(o).html(item.ad);
                            } else if (i === 4) {
                                $(o).html(item.time);
                            }
                        });
                    } else {
                        $("#stock_table tbody").append('<tr id="' + item.id + '"><td>' + item.id + '</td><td>' + item.name + '</td><td>' + item.currentPrice + '</td><td>' + item.ad + '</td><td>' + item.time + '</td><td><a href="javascript:void(0);">删除</a></td></tr>');
                        $("#" + item.id + " a").click(function () {
                            var deleteItem = $(this).parent().parent();
                            deleteStock($(deleteItem).attr("id"));
                            $(deleteItem).remove();
                        });
                    }
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // pass
            }
        });
        setTimeout(showPrice, config.refreshTime);
    };
    var showSearch = function () {
        var url = config.apiSearchUrl(encodeURI($("#stock_table_filter input").val().trim()));
        $.ajax({
            url: url,
            success: function (data) {
                var searchData = parseSearchData(data);
                $("#searchResult").show().html("");
                for (var i = 0; i < searchData.length; i++) {
                    var item = searchData[i];
                    $("#searchResult").append('<div stockId="' + item.id + '">' + item.id + ' ' + item.name + '</div>');
                }
                $("#searchResult div").click(function () {
                    addStock($(this).attr("stockId"));
                    showPrice();
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // pass
            }
        });
    };
    var hideSearch = function () {
        $("#searchResult").html("").hide();
    };
    var addStock = function (stock) {
        if (typeof stock === "string" && stock.length > 0) {
            var stocks = getStocks();
            var stockArray = stocks.split(",");
            var isExist = false;
            for (var i = 0; i < stockArray.length; i++) {
                if (stock === stockArray[i]) {
                    isExist = true;
                }
            }
            if (!isExist) {
                if (stockArray.length === 1 && stockArray[0] === "") {
                    stocks = stock;
                } else {
                    stocks = stocks + "," + stock;
                }
                localStorage.setItem(config.stocksDataKey, stocks);
            }
        }
    };
    var deleteStock = function (stock) {
        if (typeof stock === "string" && stock.length > 0) {
            var stocks = getStocks();
            var stockArray = stocks.split(",");
            var isExist = false;
            for (var i = 0; i < stockArray.length; i++) {
                if (stock === stockArray[i]) {
                    stockArray.splice(i, 1);
                    isExist = true;
                    break;
                }
            }
            if (isExist) {
                stocks = stockArray.join(",");
                localStorage.setItem(config.stocksDataKey, stocks);
            }
        }
    };
    var getStocks = function () {
        var stocks = localStorage.getItem(config.stocksDataKey);
        if (typeof stocks !== "string") {
            stocks = "";
        }
        return stocks;
    };
    var setStocks = function (stocks) {
        if (typeof stocks === "string" && stocks.length > 0) {
            localStorage.setItem(config.stocksDataKey, stocks);
        }
    };

    return {
        getStocks: getStocks,
        setStocks: setStocks,
        defaultStocks: config.defaultStocks,
        showPrice: showPrice,
        showSearch: showSearch,
        hideSearch: hideSearch
    };
})();

$(document).ready(function () {
    if (CS.getStocks() === "") {
        CS.setStocks(CS.defaultStocks);
    }
    CS.showPrice();
    $("#stock_table_filter input").keyup(function () {
        CS.showSearch();
    });
    $("#stock_table_filter input").blur(function () {
        setTimeout(function () {
            CS.hideSearch();
        }, 500);
    });
});
