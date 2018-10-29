var _ = require('underscore');
var moment = require('moment');
var tools = require(__dirname + '/../util/tools.js');

var balance = function(firebase, setting, logger){

    this.firebase = firebase;
    this.setting = setting;
    this.logger = logger;

    _.bindAll(this, 'setBalance');

}

balance.prototype.setBalance = function(exchangeapi, cb){
    _.each(this.setting.sequence,function(sequence,key){
        console.log("-------------key------------");
        console.log(key);
        var action = {
            action : 'getBalance',
            getBalanceRetry : true,
            getBoardRetry : true
        };
        action = _.extend(action, this.setting.pair[key]);
        exchangeapi.getBalance(action, action.getBalanceRetry, function(balances){
            console.log("-------------balances------------");
            console.log(balances);
        });
        this.firebase.updateObject(balances,this.setting.latestbalancePass, key);
    }.bind(this));
    cb;
}


module.exports = balance;
