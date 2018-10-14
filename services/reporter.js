var _ = require('underscore');
var moment = require('moment');
var tools = require(__dirname + '/../util/tools.js');

var reporter = function(firebase, setting, logger, inMemory){

    this.firebase = firebase;
    this.setting = setting;
    this.logger = logger;

    _.bindAll(this, 'reportBalance', 'retainBalance');

}

reporter.prototype.reportBalance = function(action,balances){

    balances.forEach(function(balance){
        var key = Object.keys(balance)[0];
        this.logger.lineNotification(key + "\n"+ action.currency + " : " + tools.round(balance[key].currencyAvailable, 8) + 
        "\n" + action.asset + " : " + tools.round(balance[key].assetAvailable, 8));
    }.bind(this));

}

reporter.prototype.retainBalance = function(action, balances){

    var total = {
        currency : 0,
        asset : 0,
        time : moment().format("YYYY-MM-DD HH:mm:ss")
    };

    balances.forEach(function(balance){
        var key = Object.keys(balance)[0];
        //currency
        this.firebase.referObjectLimit(this.setting.balancePass + "/" + key, action.currency, 1, function(object){
            if(object){
                _.each(object,function(lastbalance, lastbalancekey){
                    if(lastbalance.item !== tools.round(balance[key].currencyAvailable, 8)){
                        this.firebase.chartUpdate(this.setting.balancePass + "/" + key + "/" + action.currency , 
                            tools.round(balance[key].currencyAvailable, 8) ,moment().format("YYYY-MM-DD HH:mm:ss"));
                    }
                }.bind(this));
            }else{
                this.firebase.chartUpdate(this.setting.balancePass + "/" + key + "/" + action.currency , 
                    tools.round(balance[key].currencyAvailable, 8) ,moment().format("YYYY-MM-DD HH:mm:ss"));
            }
        }.bind(this));
        //Asset
        this.firebase.referObjectLimit(this.setting.balancePass + "/" + key, action.asset, 1, function(object){
            if(object){
                _.each(object,function(lastbalance, lastbalancekey){
                    if(lastbalance.item !== tools.round(balance[key].assetAvailable, 8)){
                        this.firebase.chartUpdate(this.setting.balancePass + "/" + key + "/" + action.asset , 
                            tools.round(balance[key].assetAvailable, 8) ,moment().format("YYYY-MM-DD HH:mm:ss"));
                    }
                }.bind(this));
            }else{
                this.firebase.chartUpdate(this.setting.balancePass + "/" + key + "/" + action.asset , 
                    tools.round(balance[key].assetAvailable, 8) ,moment().format("YYYY-MM-DD HH:mm:ss"));
            }
        }.bind(this));
    }.bind(this));

}


module.exports = reporter;
