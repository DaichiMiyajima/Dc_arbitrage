var moment = require('moment');
var _ = require('underscore');
var winston = require('winston');
require('winston-daily-rotate-file');
var fs = require('fs');
var util = require('util');
var async = require('async');
var setting = require(__dirname + '/../setting.js');

var firebaseService = require(__dirname + '/../services/firebase.js');

var config = require(__dirname + '/../config.js');
var config = config.init();

var firebase = new firebaseService(config, setting);

var logger = function(app, setting) {

    this.q = async.queue(function (task, callback) {
        console.log('Added ' + task.name + ' API call to the queue.');
        console.log('There are currently ' + this.q.running() + ' running jobs and ' + this.q.length() + ' jobs in queue.');
        
        task.func(function() { setTimeout(callback, 2000); });
    }.bind(this), 1);

    this.debugEnabled = true;

    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }

    var myCustomLevels = {
        levels: {
            DEBUG: 0,
            INFO: 1,
            ERROR: 2
        }
    };

    var now = function() {
        var format = moment(new Date()).format('DD-MM-YYYY HH:mm:ss');
        return '[' + format + ']';
    };

    this.logger = new (winston.Logger)({
        levels: myCustomLevels.levels,
        transports: [
        new (winston.transports.Console)({
            'timestamp': now,
            level: 'INFO' }),
        new (winston.transports.DailyRotateFile)({
            'timestamp': now,
            datePattern: '_dd-MM-yyyy.log',
            filename: 'logs/' + app,
            level: 'DEBUG'})
        ]
    });
    
    _.bindAll(this, 'log', 'debug', 'error', 'linelog', 'lineNotification');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(logger, EventEmitter);
//---EventEmitter Setup

logger.prototype.lineNotification = function(message, callback){
    var wrapper = function(finished){
        firebase.lineNotification(message, finished, callback);
    }.bind(this);
    this.q.push({name: 'lineNotification', func: wrapper});
}


logger.prototype.log = function(message) {
    this.logger.log('INFO', util.inspect(message));
};

logger.prototype.debug = function(message) {
    if(this.debugEnabled) {
        this.logger.log('DEBUG', util.inspect(message));
    }
};

logger.prototype.error = function(message) {
    this.logger.log('ERROR', util.inspect(message));
};

logger.prototype.linelog = function(message){
    this.lineNotification(message);
};

module.exports = logger;
