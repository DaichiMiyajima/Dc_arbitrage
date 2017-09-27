var _ = require('underscore');
var async = require('async');
var moment = require("moment");
var bitflyer = require(__dirname + '/../library/bitflyer.js');

var exchange = function(config, logger, setting) {

    this.bitflyer = new bitflyer(config.bitflyer.apiKey, config.bitflyer.secret);
    
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

                this.logger.error(callerName + ': bitflyer API returned Unknown asset pair error, exiting!');
                return process.exit();

            } else {

                this.logger.lineNotification(callerName + ': bitflyer API がエラーです。リトライ： ' + retryAllowed + '\n' + parsedError.substring(0,99));

                if(retryAllowed) {

                    this.logger.error('Retrying in 31 seconds!');
                    return this.retry(caller, args);
                    
                }
            }

        }else{

            this.logger.debug(callerName + ': bitflyer API Call Result (Substring)!');
            this.logger.debug(JSON.stringify(result).substring(0,99));

        }

        handler(parsedError, result);

    }.bind(this);

};

exchange.prototype.getBalance = function(action, retry, cb){

    var args = arguments;

    var wrapper = function(finished){
        var asset = action.bitflyer.asset;
        var currency = action.bitflyer.currency;

        var handler = function(err, data){

            if(!err){

                var assetValue;
                var currencyValue;

                data.forEach(function(value){
                
                    if(value.currency_code == asset){
                        assetValue = value.available;
                    }else if(value.currency_code == currency){
                        currencyValue = value.available;
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
                        bitflyer : {
                            currencyAvailable: currencyValue, 
                            assetAvailable: assetValue, 
                            fee: result.bitflyer.fee
                        }
                    });
                });

            } else {

                cb(err, null);

            }
        }.bind(this);
        this.bitflyer.api('getbalance', null, null, this.errorHandler(this.getBalance, args, retry, 'getBalance', handler, finished));
    }.bind(this);
    this.q.push({name: 'getBalance', func: wrapper});
};

exchange.prototype.getTransactionFee = function(action, retry, cb) {

    var args = arguments;

    var wrapper = function(finished) {
        var pair = action.bitflyer.product_code;

        var handler = function(err, data) {

            if (!err) {
                var fee = parseFloat(data.commission_rate) * 100;
                cb(null, {
                    bitflyer : {
                        fee: fee
                    }
                });
            } else {
                cb(err, null);
            }
        };

        this.bitflyer.api('gettradingcommission', {"product_code": pair}, null, this.errorHandler(this.getTransactionFee, args, retry, 'getTransactionFee', handler, finished));
    }.bind(this);
    this.q.push({name: 'getTransactionFee', func: wrapper});

};

exchange.prototype.getBoard = function(action, retry, cb) {

    var args = arguments;

    var wrapper = function(finished) {
        var pair = action.bitflyer.product_code;

        var handler = function(err, data) {

            if (!err) {
                var board = {
                    exchange : 'bitflyer',
                    time: moment().format("YYYY-MM-DD HH:mm:ss"),
                    bids: data.bids,
                    asks: data.asks
                };
                cb(null, board);
            } else {
                cb(null, null);
            }
        };

        this.bitflyer.api('getboard', {"product_code": pair}, null, this.errorHandler(this.getBoard, args, retry, 'getboard', handler, finished));
    }.bind(this);
    this.q.push({name: 'getboard', func: wrapper});

};

module.exports = exchange;
