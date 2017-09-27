var _ = require('underscore');
var async = require('async');
var kraken = require(__dirname + '/../exchanges/kraken.js');
var bitflyer = require(__dirname + '/../exchanges/bitflyer.js');
var poloniex = require(__dirname + '/../exchanges/poloniex.js');
var quoine = require(__dirname + '/../exchanges/quoine.js');

var api = function(config, logger, setting){

    var kraken_access = new kraken(config, logger, setting);
    var bitflyer_access = new bitflyer(config, logger, setting);
    var poloniex_access = new poloniex(config, logger, setting);
    var quoine_access = new quoine(config, logger, setting);

    this.exchangesAccess = [
        {
            api:kraken_access, 
            name:"kraken"
        },
        {
            api:bitflyer_access, 
            name:"bitflyer"
        },
        {
            api:quoine_access, 
            name:"quoine"
        },
        {
            api:poloniex_access, 
            name:"poloniex"
        }
    ];

    _.bindAll(this, 
        'getBalance', 
        'getBoards'
    );

};

api.prototype.getBalance = function(action, retry, cb, exchange){

    var exchangesAccess = exchange === undefined ? this.exchangesAccess : _.filter(this.exchangesAccess, function(exchangeAccess){
        return exchangeAccess.name == exchange;
    });

    exchangesAccess = _.filter(this.exchangesAccess, function(exchangeAccess){
        return (
            _.contains(action.exchange, exchangeAccess.name)
        )
    });

    async.map(exchangesAccess, function(exchangeAccess, next){
        balance = exchangeAccess.api.getBalance(action, retry, next);
    }, function(err, balances){

        if(err){
            throw err;
        }

        cb(balances);

    });
};

api.prototype.getBoards = function(action, retry, cb, exchange){

    var exchangesAccess = exchange === undefined ? this.exchangesAccess : _.filter(this.exchangesAccess, function(exchangeAccess){
        return exchangeAccess.name == exchange;
    });

    exchangesAccess = _.filter(this.exchangesAccess, function(exchangeAccess){
        return (
            _.contains(action.exchange, exchangeAccess.name)
        )
    });

    async.map(exchangesAccess, function(exchangeAccess, next){
        board = exchangeAccess.api.getBoard(action, retry, next);
    }, function(err, boards){
        if(err){
            throw err;
        }
        cb(boards);
    });

}

module.exports = api;
