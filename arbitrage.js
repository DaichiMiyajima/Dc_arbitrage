/*
 * Main entry point for our app
 * "start" method gets called when the project get started
 * I always have underscore.js everwhere
 */

var _ = require('underscore');

var loggingservice = require(__dirname + '/services/loggingservice.js');

var app = function(){
 
    _.bindAll(this, 'initializeModule', 'launchTrader', 'start');  
    
};

app.prototype.initializeModule = function(appName) {

    this.logger = new loggingservice(appName);

};

app.prototype.launchTrader = function(){

    this.appName = 'trader';
    this.app = require(__dirname + '/apps/trader.js');
    this.app.start();

}

app.prototype.start = function(){

    this.initializeModule(this.appName);

    // AnnounceStart
    this.logger.log('----------------------------------------------------');
    this.logger.log('Starting CandyThink');
    this.logger.log('Working Dir = ' + process.cwd());
    
    if(['production', 'uttest', 'verification'].indexOf( process.argv[2]) == -1){
        this.logger.log('Stop! : invalid Environment is serected. = ' + process.argv[2]);
        this.logger.log('----------------------------------------------------');
        process.exit(0);
    }

    this.logger.log('Environment = ' + process.argv[2]);
    this.logger.log('----------------------------------------------------');

    this.launchTrader();

}

var dcArbitrage = new app();
dcArbitrage.start();
