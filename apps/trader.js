var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var parseError = require('parse-error');
var execSync = require('child_process').execSync;
var tools = require(__dirname + '/../util/tools.js');
var inMemory = {
    orderFailed : []
};

var firebaseService = require(__dirname + '/../services/firebase.js');
var processorService = require(__dirname + '/../services/processor.js');
var loggingservice = require(__dirname + '/../services/loggingservice.js');
var tradingadvisor = require(__dirname + '/../services/advisor.js');
var exchangeapiService = require(__dirname + '/../services/exchangeapi.js');
var agentService = require(__dirname + '/../services/agent.js');
var candyThinkOBJ = require(__dirname + '/../indicator/candyThink.js');
var candyRefreshOBJ = require(__dirname + '/../indicator/candyRefresh.js');
var reportService = require(__dirname + '/../services/reporter.js');

var config = require(__dirname + '/../config.js');
var config = config.init();
var setting = require('../setting.js');

var logger = new loggingservice('trader');
var candyThink = new candyThinkOBJ(setting);
var candyRefresh = new candyRefreshOBJ(setting); 
var advisor = new tradingadvisor(candyThink, candyRefresh ,logger, setting);
var firebase = new firebaseService(config, setting);
var exchangeapi = new exchangeapiService(config, logger, setting);
var agent = new agentService(firebase, setting);
var reporter = new reportService(firebase, setting, logger, inMemory);
var processor = new processorService(advisor, logger, inMemory, reporter);

//for test
var quoine = require(__dirname + '/../exchanges/quoine.js');
var quoine_access = new quoine(config, logger, setting);

var trader = function(){

    firebase.on('systemStream',function(system){
        if(system == 'stop'){
            logger.lineNotification("緊急停止が選択されました。システムを停止します", function(finished){
                finished();
                var result =  execSync('forever stop arbitrage.js');
            });
        }else if(system == 'running'){
            logger.lineNotification("取引を開始します", function(finished){
                firebase.trading();
                firebase.orderFailedConnection();
                firebase.orderFailedCount();
                firebase.requestConnection();
                finished();
            });
            
        }else{
            throw "不正なモードが選択されています";
        }
    });

    firebase.on('lineRequest', function(request){
        _.each(setting.sequence,function(sequence,key){
            var action = {
                action : 'not set',
                getBalanceRetry : true
            };
            action = _.extend(action, setting.pair[key]);
            if(request.request == 'getBalance'){
                exchangeapi.getBalance(action, true, function(balances){
                    reporter.reportBalance(action, balances);
                });
            }
        }.bind(this));
    })


    firebase.on('orderFailedStream', function(orderFailed){
        var action = {
            action : 'orderFailed',
            getBalanceRetry : true,
            getBoardRetry : true
        };
        action = _.extend(action, setting.pair[orderFailed.formatedpair]);
        processor.orderFailedVacuum(action, orderFailed, exchangeapi, processor.process);
    });

    firebase.on('tradeStream', function(tradeStatus){

        var action = {
            action : 'not set',
            getBalanceRetry : true,
            getBoardRetry : false
        };
        
        if(moment().diff(tradeStatus.time, 'seconds') < 60){
            if(tradeStatus.system == 'think'){
                action.action = 'refresh';
                action = _.extend(action, setting.pair[tradeStatus.pair]);
                processor.process(action, null, exchangeapi);
            }else if(tradeStatus.system == 'refresh'){
                action.action = 'think';
                action = _.extend(action, setting.pair[setting.sequence[tradeStatus.pair]]);
                processor.process(action, null, exchangeapi);
            }else{
                throw "想定外のtradeStatus : " + tradeStatus.system + "を検知したため、システムを停止します"
            }

        }else{
            logger.lineNotification("status :" + tradeStatus.system + "を検知しましたが、\n" +
                "登録時刻:" + tradeStatus.time + "が\n" +
                "現在時刻:" + moment().format("YYYY-MM-DD HH:mm:ss") + "\n" + 
                "と一分以上ずれがあるため、実行しません" , function(finished){
                finished();
            });
        }
    })

    processor.on('orderStream', function(order){
        agent.order(order);
    });

    advisor.on('status', function(action){
        firebase.statusUpdate(action);
    })

    process.on('uncaughtException', function (err) {
        var errMsg = "";
        _.each(parseError(err), function(msg, key){ errMsg += "\n" + key + ":" + msg;});
        logger.lineNotification("リカバリ不可のエラーが発生しました。システムを強制終了します\n" + errMsg, function(finished){
            var result =  execSync('forever stop candy.js');
        });
    });

    process.on('exit', function (code) {
        console.log('exit code : ' + code);
    });

    _.bindAll(this, 'start');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(trader, EventEmitter);
//---EventEmitter Setup

trader.prototype.start = function() {
    firebase.systemConnection();
};

var traderApp = new trader();

module.exports = traderApp;

