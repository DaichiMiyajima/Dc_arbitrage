var _ = require('underscore');
var async = require('async');
var moment = require("moment");

var Kraken = require(__dirname + '/../library/kraken.js');

var exchange = function(config, logger, setting) {

    this.kraken = new Kraken(config.kraken.apiKey, config.kraken.secret, config.kraken.otp);
    
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

            try {
                parsedError = JSON.parse(err.message);
            } catch (e) {
                parsedError = err;
            }

            if(parsedError === '["EQuery:Unknown asset pair"]') {

                this.logger.error(callerName + ': Kraken API returned Unknown asset pair error, exiting!');
                return process.exit();

            } else {

                if(parsedError.code != "ESOCKETTIMEDOUT"){
                    this.logger.lineNotification(callerName + ': kraken API がエラーです。リトライ : ' + retryAllowed + '\n' + parsedError);
                }
                
                if(retryAllowed) {

                    this.logger.error('Retrying in 31 seconds!');
                    return this.retry(caller, args);
                    
                }
            }

        }else{

            this.logger.debug(callerName + ': Kraken API Call Result (Substring)!');
            this.logger.debug(JSON.stringify(result).substring(0,99));

        }

        handler(parsedError, result);

    }.bind(this);

};

exchange.prototype.getBalance = function(action, retry, cb){

    var args = arguments;

    var wrapper = function(finished){

        var asset = action.kraken.asset;
        var currency = action.kraken.currency;

        var handler = function(err, data){

            if(!err){

                var assetValue = _.find(data.result, function(value, key) {
                    return key === asset;
                });
                var currencyValue = _.find(data.result, function(value, key) {
                    return key === currency;
                });
                if(!assetValue) {
                    assetValue = 0;
                }
                if(!currencyValue) {
                    currencyValue = 0;
                }
                this.getTransactionFee(action, retry, function(err, result) {
                    cb(null, {
                        kraken : 
                            {
                                currencyAvailable: currencyValue, 
                                assetAvailable: assetValue, 
                                fee: result.kraken.fee
                            }
                    }
                    );
                });

            } else {

                cb(err, null);

            }
        }.bind(this);
        this.kraken.api('Balance', {}, this.errorHandler(this.getBalance, args, retry, 'getBalance', handler, finished));
    }.bind(this);
    this.q.push({name: 'getBalance', func: wrapper});
};

exchange.prototype.getTransactionFee = function(action, retry, cb) {

    var args = arguments;

    var wrapper = function(finished) {
        var pair = action.kraken.pair;

        var handler = function(err, data) {

            if (!err) {
                var fee = parseFloat(_.find(data.result.fees, function (value, key) {
                    return key === pair;
                }).fee);
                cb(null, {
                    kraken: {
                        fee: fee
                    }
                });
            } else {
                cb(err, null);
            }
        };

        this.kraken.api('TradeVolume', {"pair": pair}, this.errorHandler(this.getTransactionFee, args, retry, 'getTransactionFee', handler, finished));
    }.bind(this);
    this.q.push({name: 'getTransactionFee', func: wrapper});

};

exchange.prototype.getBoard = function(action, retry, cb) {

    var args = arguments;

    var wrapper = function(finished) {
        var pair = action.kraken.pair;

        var handler = function(err, data) {

            if (!err) {
                var board = {
                    exchange : 'kraken',
                    time: moment().format("YYYY-MM-DD HH:mm:ss"),
                    asks: data.result[action.kraken.pair].asks,
                    bids: data.result[action.kraken.pair].bids
                };
                cb(null, board);
            } else {
                cb(null, null);
            }
        };

        this.kraken.api('Depth', {"pair": pair, "count" : 10000}, this.errorHandler(this.getBoard, args, retry, 'getboard', handler, finished));
    }.bind(this);
    this.q.push({name: 'getboard', func: wrapper});

};

module.exports = exchange;
