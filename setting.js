var setting = {};
var env = process.argv[2];

setting.systemPass = env + '/common/system/running';
setting.lineNotificationPass = env + '/common/system/line';
setting.orderFailedPass = env + '/trade/orderfailed';
setting.orderPass = env + '/think/order/';
setting.balancePass = env + '/think/chart/balance/';
setting.statusPass = env + '/common/system/tradestatus'
setting.requestPass = env + '/common/system/Request/'
setting.profitPass = env + '/think/chart/profit/';
setting.orderCompletionPass = env + '/common/system/orderstatus';

setting.analysisPass = '/analysis/';

setting.space = 0.001;
setting.boardLimit = 1;

setting.minimumtrade = {
    poloniex : 0.0001,
    kraken : 0.001,
    bitflyer : 0.001,
    quoine : 0.01
}

setting.sequence = {
    //'ETH_BTC' : 'XRP_BTC'
    //'XRP_BTC' : 'ETH_BTC',
    //'ETH_BTC' : 'BTC_JPY',
    //'BTC_JPY' : 'BTC_JPY'
    //'ETH_JPY' : 'BTC_JPY'
    'ETH_BTC' : 'ETH_BTC'
}

setting.pair = {
    'ETH_BTC' : {
        currency : "BTC",
        asset : "ETH",
        pair : "ETH_BTC",
        exchange : ['bitflyer', 'kraken', 'quoine', 'poloniex'],
        bitflyer : {
            product_code : "ETH_BTC",
            pair : "ETH_BTC",
            currency : "BTC",
            asset : "ETH"
        },
        kraken : {
            pair: 'XETHXXBT',
            currency: 'XXBT',
            asset: 'XETH'
        },
        poloniex : {
            pair : "BTC_ETH",
            currency : "BTC",
            asset : "ETH"
        },
        quoine : {
            pair : "ETH_BTC",
            currency : "BTC",
            asset : "ETH",
            productid : "37"
        }
    },
    'XRP_BTC' : {
        currency : "BTC",
        asset : "XRP",
        pair : "XRP_BTC",
        exchange : ['kraken', 'poloniex'],
        kraken : {
            pair: 'XXRPXXBT',
            currency: 'XXBT',
            asset: 'XXRP'
        },
        poloniex : {
            pair : "BTC_XRP",
            currency : "BTC",
            asset : "XRP"
        }
    },
    'BTC_JPY' : {
        currency : "JPY",
        asset : "BTC",
        pair : "BTC_JPY",
        //exchange : ['kraken', 'bitflyer','quoine'],
        exchange : ['bitflyer','quoine'],
        bitflyer : {
            product_code : "BTC_JPY",
            pair : "BTC_JPY",
            currency : "JPY",
            asset : "BTC"
        },
        kraken : {
            pair: 'XXBTZJPY',
            currency: 'ZJPY',
            asset: 'XXBT'
        },
        quoine : {
            pair : "BTC_JPY",
            currency : "JPY",
            asset : "BTC",
            productid : "5"
        }
    },
    'ETH_JPY' : {
        currency : "JPY",
        asset : "ETH",
        pair : "ETH_JPY",
        exchange : ['kraken', 'quoine'],
        kraken : {
            pair: 'XETHZJPY',
            currency: 'ZJPY',
            asset: 'XETH'
        },
        quoine : {
            pair : "ETH_JPY",
            currency : "JPY",
            asset : "ETH",
            productid : "29"
        }
    }
}

setting.profit = {
    'ETH_BTC' : {
        profit_percentage : 1.0001,
        profit_sum : 0.000001
    },
    'XRP_BTC' : {
        profit_percentage : 1.006,
        profit_sum : 0.001
    },
    'BTC_JPY' : {
        profit_percentage : 1.006,
        profit_sum : 600
    },
    'ETH_JPY' : {
        profit_percentage : 1.006,
        profit_sum : 400
    }
};

setting.refresh = {
    'ETH_BTC' : {
        percentage_from : 1.0005,
        bal_amt_percentage : 0.7,
        allocate : {
            ETH : {
                kraken : 0.3,
                bitflyer : 0.4,
                poloniex : 0.3
            },
            BTC : {
                kraken : 0.3,
                bitflyer : 0.4,
                poloniex : 0.3
            }
        }
    },
    'XRP_BTC' : {
        percentage_from : 1.0005,
        bal_amt_percentage : 0.7,
        allocate : {
            XRP : {
                kraken : 0.3,
                bitflyer : 0.4,
                poloniex : 0.3
            },
            BTC : {
                kraken : 0.3,
                bitflyer : 0.4,
                poloniex : 0.3
            }
        }
    },
    'BTC_JPY' : {
        percentage_from : 1.0005,
        bal_amt_percentage : 0.7,
        allocate : {
            BTC : {
                kraken : 0,
                bitflyer : 0.5,
                quoine : 0.5
            },
            JPY : {
                kraken : 0,
                bitflyer : 0.5,
                quoine : 0.5
            }
        }
    },
    'ETH_JPY' : {
        percentage_from : 1.0005,
        bal_amt_percentage : 0.7,
        allocate : {
            ETH : {
                kraken : 0.5,
                quoine : 0.5
            },
            JPY : {
                kraken : 0.5,
                quoine : 0.5
            }
        }
    }
};

module.exports = setting;
