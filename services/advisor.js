var _ = require('underscore');
var async = require('async');
var tools = require(__dirname + '/../util/tools.js');

var advisor = function(candyThink,candyRefresh, logger, setting) {

    this.logger = logger;
    this.indicator = {};
    this.indicator.arbitrage = candyThink;
    this.indicator.refresh = candyRefresh;
    this.setting = setting;

  _.bindAll(this, 'update');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(advisor, EventEmitter);
//---EventEmitter Setup

advisor.prototype.update = function(action, boards, balance, orderfaileds) {

    // orderfailed can be left out
    if(typeof orderfaileds == "function") { 
        callback = orderfaileds;
        orderfailed = null;
    }

    // convert data with candyThink way.
    // ******************************************************************
    var candyThinkWay = convert(action, boards, balance, this.setting);
    // ******************************************************************
    
    if(orderfaileds){
        _.each(orderfaileds, function(orderfailed){
            this.indicator.arbitrage.orderRecalcurate(action, candyThinkWay.boards, candyThinkWay.balance, candyThinkWay.fee, orderfailed);
        }.bind(this));
    }else if(action.action == 'think'){
        this.indicator.arbitrage.arbitrage(action, candyThinkWay.boards, candyThinkWay.balance, candyThinkWay.fee);
    }else if(action.action == 'refresh'){
        this.indicator.refresh.refresh(action, candyThinkWay.boards, candyThinkWay.balance, candyThinkWay.fee, action.pair);
    }else{
        throw "status形式に誤りがあります";
    }
};

var convert = function(action, groupedBoards, balances, setting){

    var candyThinkWay = {
    
        balance : [],
        boards : [],
        fee : []

    };

    var exchange_type_count = 1;

    balances.forEach(function(balance){
        var key = Object.keys(balance)[0];
        candyThinkWay.balance.push({
            exchange_type : exchange_type_count,
            exchange : key,
            currency_code : action.currency,
            //amount : Number(balance[key].currencyAvailable)
            amount : 50000000
        });

        candyThinkWay.balance.push({
            exchange_type : exchange_type_count,
            exchange : key,
            currency_code : action.asset,
            //amount : Number(balance[key].assetAvailable)
            amount : 5000000000
        });

        candyThinkWay.fee.push({
            exchange_type:exchange_type_count,
            exchange: key,
            fee: balance[key].fee
        });
        exchange_type_count++;
    });

    var candyThinkBoards = [];
    var no = 0;

    groupedBoards.forEach(function(board){
        _.each(_.pick(board, 'asks', 'bids'),function(orders, ask_bid){
            if(orders){
                orders.forEach(function(order){
                    if(board.exchange === 'bitflyer'){
                        candyThinkWay.boards.push({
                            no : no++,
                            exchange_type : 1,
                            exchange : board.exchange,
                            ask_bid : ask_bid.substr(0,3),
                            num : order.size,
                            amount : Number(order.price),
                            actualAmount : Number(order.price),
                            product_code : action.pair,
                            specific_product_code : action[board.exchange].pair,
                            time : board.time
                        })
                        
                    }else if(board.exchange === 'kraken'){
                        candyThinkWay.boards.push({
                            no : no++,
                            exchange_type : 2,
                            exchange : board.exchange,
                            ask_bid : ask_bid.substr(0,3),
                            num : order[1],
                            amount : Number(order[0]),
                            actualAmount : Number(order[0]),
                            product_code : action.pair,
                            specific_product_code : action[board.exchange].pair,
                            time : board.time
                        })
                        
                    }else if(board.exchange === 'poloniex'){
                        candyThinkWay.boards.push({
                            no : no++,
                            exchange_type : 3,
                            exchange : board.exchange,
                            ask_bid : ask_bid.substr(0,3),
                            num : order[1],
                            amount : Number(order[0]),
                            actualAmount : Number(order[0]),
                            product_code : action.pair,
                            specific_product_code : action[board.exchange].pair,
                            time : board.time
                        })
                    }else if(board.exchange === 'quoine'){
                        candyThinkWay.boards.push({
                            no : no++,
                            exchange_type : 4,
                            exchange : board.exchange,
                            ask_bid : ask_bid.substr(0,3),
                            num : order[1],
                            amount : Number(order[0]),
                            actualAmount : Number(order[0]),
                            product_code : action.pair,
                            specific_product_code : action[board.exchange].productid,
                            time : board.time
                        })
                    }
               });
           }else{
               console.log("Boardの取得に失敗しました");
           }
        });
    });
    return candyThinkWay;
};

module.exports = advisor;

