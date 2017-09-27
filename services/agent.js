var _ = require('underscore');
var async = require('async');

var agent = function(firebase, setting){

    this.firebase = firebase;
    this.setting = setting;
    _.bindAll(this, 'order');

};

agent.prototype.order = function(order){

    var pass = this.setting.orderPass
    this.firebase.placeOrder(pass, order);

}

module.exports = agent;
