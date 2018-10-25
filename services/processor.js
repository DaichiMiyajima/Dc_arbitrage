var _ = require('underscore');
var moment = require('moment');
var async = require('async');

var processor = function(advisor, logger, inMemory, reporter){

    this.logger = logger;
    this.advisor = advisor;
    this.inMemory = inMemory;
    this.reporter = reporter;

    this.q = async.queue(function (task, callback) {
        this.logger.debug('Added ' + task.name + ' call to the process queue.');
        this.logger.debug('There are currently ' + this.q.running() + ' running jobs and ' + this.q.length() + ' jobs in queue.');
        task.func(function() { 
            setTimeout(callback, 1000 * 45); 
        });
    }.bind(this), 1);

    _.bindAll(this, 'process', 'orderFailedVacuum');

};

processor.prototype.process = function(action, orderFailed, exchangeapi) {

    var wrapper = function(finished){
        exchangeapi.getBalance(action, action.getBalanceRetry, function(balances){
            if(action.action != 'orderFailed') this.reporter.retainBalance(action, balances);
            exchangeapi.getBoards(action, action.getBoardRetry, function(board){
                this.advisor.update(action, board, balances, orderFailed);
                finished();
            }.bind(this));
        }.bind(this));
    }.bind(this);

    if(action == 'orderFailed'){
        this.q.unshift({name: 'unshiftProcess', func: wrapper});
    }else{
        this.q.push({name: 'process', func: wrapper});
    }
};

processor.prototype.orderFailedVacuum = function(action, orderFailed, exchangeapi, process){

    this.inMemory.orderFailed.push(orderFailed);

    if(this.inMemory.orderFailed.length == 1){
        setTimeout(function(){
            process(action, this.inMemory.orderFailed, exchangeapi);
            this.inMemory.orderFailed = [];
        }.bind(this), 1000 * 50);
    }

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(processor, EventEmitter);
//---EventEmitter Setup

module.exports = processor;

