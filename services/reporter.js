var _ = require('underscore');
var moment = require('moment');
var tools = require(__dirname + '/../util/tools.js');

var reporter = function(firebase, setting, logger, inMemory){

    this.firebase = firebase;
    this.setting = setting;
    this.logger = logger;

    _.bindAll(this, 'reportBalance', 'retainBalance');

}

reporter.prototype.reportBalance = function(balances){

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
        total.currency += tools.round(balance[key].currencyAvailable, 8);
        total.asset += tools.round(balance[key].assetAvailable, 8);
    });
    
    this.firebase.referObjectLimit(this.setting.balancePass, action.currency, 1, function(object){
        _.each(object,function(lastbalance, key){
            if(lastbalance.item !== total.currency){
                this.firebase.chartUpdate(this.setting.balancePass + action.currency + '/' , 
                    total.currency ,moment().format("YYYY-MM-DD HH:mm:ss"));
            }
        }.bind(this));
    }.bind(this));
    
    this.firebase.referObjectLimit(this.setting.balancePass, action.asset, 1, function(object){
        _.each(object,function(lastbalance, key){
            if(lastbalance.item !== total.asset){
                this.firebase.chartUpdate(this.setting.balancePass + action.asset + '/' , 
                    total.asset ,moment().format("YYYY-MM-DD HH:mm:ss"));
            }
        }.bind(this));
    }.bind(this));

}


module.exports = reporter;
