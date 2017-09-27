var _ = require('underscore');
var async = require('async');
var moment = require("moment");
var quoine = require(__dirname + '/../library/quoine.js');

var exchange = function(config, logger, setting) {

    this.quoine = new quoine(config.quoine.apiKey, config.quoine.secret);
    
    this.q = async.queue(function (task, callback) {
        this.logger.debug('Added ' + task.name + ' API call to the queue.');
        this.logger.debug('There are currently ' + this.q.running() + ' running jobs and ' + this.q.length() + ' jobs in queue.');
        task.func(function() { setTimeout(callback, 3100); });
    }.bind(this), 1);

    this.logger = logger;

    _.bindAll(this, 
        'retry', 
        'errorHandler', 
        'getBalance', 
        'getTransactionFee',
        'getBoard'
    );
};

// using variadic functions to bind
exchange.prototype.retry = function(method, args) {

    var self = this;

    _.each(args, function(arg, i) {
        if(_.isFunction(arg)){
            args[i] = _.bind(arg, self);
        }
    });

    setTimeout(function() {
        method.apply(self, args);
    }, 1000*31);
};

exchange.prototype.errorHandler = function(caller, receivedArgs, retryAllowed, callerName, handler, finished){

    return function(err, result){
        var args = _.toArray(receivedArgs);
        var parsedError = null;

        finished();

        if(err) {

            if(JSON.stringify(err) === '{}' && err.message) {
                parsedError = err.message;
            } else {
                parsedError = JSON.stringify(err);
            }

            if(parsedError === '["EQuery:Unknown asset pair"]') {

                this.logger.error(callerName + ': quoine API returned Unknown asset pair error, exiting!');
                return process.exit();

            } else {

                this.logger.lineNotification(callerName + ': quoine API がエラーです。リトライ： ' + retryAllowed + '\n' + parsedError.substring(0,99));

                if(retryAllowed) {

                    this.logger.error('Retrying in 31 seconds!');
                    return this.retry(caller, args);
                    
                }
            }

        }else{

            this.logger.debug(callerName + ': quoine API Call Result (Substring)!');
            this.logger.debug(JSON.stringify(result).substring(0,99));

        }

        handler(parsedError, result);

    }.bind(this);

};

exchange.prototype.getBalance = function(action, retry, cb){

    var args = arguments;

    var wrapper = function(finished){

        var asset = action.quoine.asset;
        var currency = action.quoine.currency;

        var handler = function(err, data){

            if(!err){

                var assetValue;
                var currencyValue;

                data.forEach(function(value){
                
                    if(value.currency == asset){
                        assetValue = value.balance;
                    }else if(value.currency == currency){
                        currencyValue = value.balance;
                    }
                
                });

                if(!assetValue) {
                    assetValue = 0;
                }
                if(!currencyValue) {
                    currencyValue = 0;
                }
                this.getTransactionFee(action, retry, function(err, result) {
                    cb(null, {
                        quoine : {
                            currencyAvailable: currencyValue, 
                            assetAvailable: assetValue, 
                            fee: result.quoine.fee
                        }
                    });
                });

            } else {

                cb(err, null);

            }
        }.bind(this);
        this.quoine.api('getBalance', null, null, null, this.errorHandler(this.getBalance, args, retry, 'getBalance', handler, finished));
    }.bind(this);
    this.q.push({name: 'getBalance', func: wrapper});
};

exchange.prototype.getTransactionFee = function(action, retry, cb) {

    var args = arguments;

    var wrapper = function(finished) {
        var productid = action.quoine.productid

        var handler = function(err, data) {
            if (!err) {
                var fee = parseFloat(data.taker_fee) * 100;
                cb(null, {
                    quoine : {
                        fee: fee
                    }
                });
            } else {
                cb(err, null);
            }
        };

        this.quoine.api('getproduct', {eachid:productid}, null, null, this.errorHandler(this.getTransactionFee, args, retry, 'getTransactionFee', handler, finished));
    }.bind(this);
    this.q.push({name: 'getTransactionFee', func: wrapper});

};

exchange.prototype.getBoard = function(action, retry, cb) {

    var args = arguments;

    var wrapper = function(finished) {
        var productid = action.quoine.productid

        var handler = function(err, data) {

            if (!err) {
                var board = {
                    exchange : 'quoine',
                    time: moment().format("YYYY-MM-DD HH:mm:ss"),
                    bids: data.buy_price_levels,
                    asks: data.sell_price_levels
                };
                cb(null, board);
            } else {
                cb(null, null);
            }
        };

        this.quoine.api('getboard', {eachid:productid}, {full:2}, null, this.errorHandler(this.getBoard, args, retry, 'getboard', handler, finished));
    }.bind(this);
    this.q.push({name: 'getboard', func: wrapper});

};


module.exports = exchange;
