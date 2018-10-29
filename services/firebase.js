var _ = require('underscore');
var async = require('async');
var moment = require("moment");

var firebase = function(config,setting){

    this.setting = setting;
    this.admin = require("firebase-admin");
    var serviceAccount = require(__dirname + "/../config/digitalcurrency-72f17-firebase-adminsdk-fu9sz-cb367e2a26.json");

    //to check if Firebase has already been initialized.
    if (this.admin.apps.length === 0) {
        this.admin.initializeApp({
            credential: this.admin.credential.cert(serviceAccount),
            databaseURL: config.databaseURL
        });
    }

    // As an admin, the app has access to read and write all data, regardless of Security Rules
    this.FirebaseAccess = this.admin.database().ref();

    _.bindAll(this,
        'systemConnection',
        'placeOrder',
        'lineNotification',
        'referObjectLimit',
        'chartUpdate',
        'updateObject',
        'disconnect',
        'orderFailedConnection',
        'orderFailedCount',
        'requestConnection'
   );

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(firebase, EventEmitter);
//---EventEmitter Setup

firebase.prototype.systemConnection = function(){

    this.FirebaseAccess.child(this.setting.systemPass).on("value", function(snapshot) {
        var data = snapshot.val();
        data.name = 'system';
        this.emit('systemStream', data);
    }.bind(this), function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

};

firebase.prototype.requestConnection = function(){

    this.FirebaseAccess.child(this.setting.requestPass).on("value", function(snapshot) {
        var data = snapshot.val();
        data.name = 'request';
        this.emit('lineRequest', data);
    }.bind(this), function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

};

firebase.prototype.placeOrder = function(pass, orderType){

    this.FirebaseAccess.child(pass).push().set(orderType).then(function(){
        }, function(error) {
            console.log("Error: " + error);
        }
    );

}

firebase.prototype.lineNotification = function(message, finished, callback){

    console.log('----------------------------------------------------');
    console.log("line notification");
    console.log(message);
    console.log('----------------------------------------------------');

    this.FirebaseAccess.child(this.setting.lineNotificationPass).push().set({
        "system" : "candy_think",
        "message" : message,
        "time" : moment().format("YYYY-MM-DD HH:mm:ss")
    }).then(function(){
        if (typeof(callback) === 'function') { 
            callback(finished);
        }else{
            finished();
        }
    }, function(error) {
        console.log("Error: " + error);
        finished();
    });
}

firebase.prototype.referObjectLimit = function(pass, key, limit, cb){
    this.FirebaseAccess.child(pass).child(key).limitToLast(1).once("value").then(function(snapshot) {
        var object = snapshot.val();
        if(cb){
            cb(object);
        }
    }.bind(this), function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

firebase.prototype.chartUpdate = function(pass, item, time){
    this.FirebaseAccess.child(pass).push().set({
        time : time,
        item : item
    }).then(function(){
    }, function(error) {
        console.log("Error: " + error);
    });
}

firebase.prototype.updateObject = function(object, pass, key, cb){
    var args = arguments;
    this.FirebaseAccess.child(pass).child(key).update(object).then(function(){
        if(cb){
            cb();
        }
    }, function(error) {
        console.log("Error: " + error);
    });
};

firebase.prototype.disconnect = function(){
    this.admin.app().delete();
}

firebase.prototype.orderFailedConnection = function(){
    this.FirebaseAccess.child(this.setting.orderFailedPass).on("child_added", function(snapshot) {
        var data = snapshot.val();
        data.orderfailedkey = snapshot.key;
        this.emit('orderFailedStream', data);
    }.bind(this), function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
};

firebase.prototype.orderFailedCount = function(){
    this.FirebaseAccess.child(this.setting.orderFailedPass).on("value", function(snapshot) {
        this.emit('orderFailedCheck', snapshot.numChildren());
    }.bind(this), function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
};

firebase.prototype.trading = function(){
    this.FirebaseAccess.child(this.setting.statusPass).on("value", function(snapshot){
        this.emit('tradeStream', snapshot.val());
    }.bind(this), function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
};

firebase.prototype.statusUpdate = function(action){
    this.FirebaseAccess.child(this.setting.statusPass).set({
        time : moment().format("YYYY-MM-DD HH:mm:ss"),
        system : action.action,
        pair : action.pair
    }).then(function(){
    }, function(error) {
        console.log("Error: " + error);
    });
}

module.exports = firebase;
