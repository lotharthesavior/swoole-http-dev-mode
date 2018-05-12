/**
 * Swoole Http Dev Mode
 *
 * @author Savio Resende <savio@savioresende.com.br>
 */

var chokidar = require('chokidar'),
    {exec, spawn} = require('child_process');

process.stdin.resume();//so the program will not close instantly

var SwooleHttpDevMode = (function() {
    'use strict';

    var SwooleHttpDevMode = {

        /** @var */
        started: false,

        /** 
         * Difference in seconds from the last cycle
         *
         * @var int - seconds 
         */
        difference: 0,

        /** 
         * Max Speed for the cycle to be restarted
         * 
         * @var int - seconds 
         */
        heartbeatSpeed: 1,

        /**
         * Initialization
         */
        init: function init() {
            this.started = true;
            this.last_update = new Date();
            this._checkSwooleProcess(this._executeServer, 'start');
            console.log('Swoole Http Service started!');

            this.watchFilesystem();

            this.watchProcess();
        },

        /**
         * Watch Process
         */
        watchProcess: function watchProcess(){
            //do something when app is closing
            process.on('exit', this.exitHandler.bind(null,{cleanup:true}));

            //catches ctrl+c event
            process.on('SIGINT', this.exitHandler.bind(null, {exit:true}));

            // catches "kill pid" (for example: nodemon restart)
            process.on('SIGUSR1', this.exitHandler.bind(null, {exit:true}));
            process.on('SIGUSR2', this.exitHandler.bind(null, {exit:true}));

            //catches uncaught exceptions
            process.on('uncaughtException', this.exitHandler.bind(null, {exit:true}));
        },

        /**
         * Watch Filesystem
         *
         * @return void
         */
        watchFilesystem: function watchFilesystem(){
            var that = this;
            console.log('Watching filesystem...');

            /**
             * Ignoring
             * 
             * Starting with "."
             * (^|[\/\\])\..
             *
             * Starting with "storage"
             * (^storage)
             */
            chokidar.watch('.', {ignored: /(^|[\/\\])\..|(^storage)/}).on('change', (event, path) => {
                console.log('File changed - start.');

                that.runCycle(event);

                console.log('File changed - end.');
            });
        },

        /**
         * Main Cycle
         *
         * @param String fileName
         * @param Array fileTypes - watched filetypes
         *
         * @return void
         */
        runCycle: function runCycle(fileName, fileTypes) {
            console.log('Swoole Service cycle running!');

            fileTypes = (typeof fileTypes !== 'undefined') ? fileTypes : ['php'];

            if (!this._checkFiletype(fileName, fileTypes)) {
                return;
            }

            this.difference = ((new Date) - this.last_update) / 1000;

            if (this.difference > this.heartbeatSpeed) {
                this._checkSwooleProcess(this._executeServer, 'start');
                this.last_update = new Date();
            }

            console.log('Swoole Service cycle finished!');
        },

        /**
         * Check if current filetype is watched
         *
         * @param String fileName
         * @param Array fileTypes
         *
         * @return bool
         *
         * @private
         */
        _checkFiletype: function _checkFiletype(fileName, fileTypes) {
            console.log('Checking file:');
            console.log(fileName);

            var checkResult = fileTypes.filter(function(fileType){
                return fileName.substr(-4, 1) === '.'
                    && fileName.substr(-3) === fileType;
            }).length > 0;

            console.log('Check Result:');
            console.log(checkResult);

            return checkResult;
        },

        /**
         * Check if there is a Swoole instance already running
         *
         * @return void
         *
         * @private
         */
        _checkSwooleProcess: function _checkSwooleProcess(callback, callbackParam) {
            var that = this;
            var thatCallBack = callback;
            var thatCallbackParam = callbackParam;

            console.log("Checking Swoole Http Process... ");

            // search for existent processes
            exec('ps -ef | grep -i swoole', function(err, stdout, stderr) {
                if (err) {
                    console.error('Search Swoole Http Process Error: ' + err);
                    return;
                }
               
                // get the specific process for swoole:http
                const existentProcesses = stdout
                    .split('\n')
                    .filter(function(row){
                        return row.length > 0
                            && row.indexOf('swoole:http') !== -1;
                    }).length;

                // kill existent processes
                if (existentProcesses > 0) {
                    console.log('Killing existent Swoole Http Process...');
                    that._killSwooleProcess(thatCallBack, thatCallbackParam);
                } else if (typeof thatCallBack === 'function') {
                    return thatCallBack(thatCallbackParam);
                }
            });
        },

        /**
         * Kill process
         * 
         * @param Object (function)  
         * @param 
         * 
         * @private
         */
         _killSwooleProcess: function _killSwooleProcess(callback, callbackParam){
            var thatCallback = callback;
            var thatCallbackParam = callbackParam;

            exec('pkill -f swoole:http', function(err, stdout, stderr) {
                if (err) {
                    console.error('Killing Swoole Http Process Error: ' + err);
                    return;
                }

                console.log('Killing Swoole Http Process output:');
                console.log(stdout);

                // execute callback
                if (typeof thatCallback === 'function') {
                    setTimeout(function(){
                        thatCallback(thatCallbackParam);
                    }, 1000);
                }
            });
        },

        /**
         * Execute command line action at swoole server
         *
         * @param String action
         *
         * @return void
         *
         * @private
         */
        _executeServer: function _executeServer(action) {
            exec('php artisan swoole:http ' + action, function(err, stdout, stderr) {
                if (err) {
                    console.error('Swoole Start Process Error: ' + err);
                    return;
                }

                console.log('###################### Swoole Http Process Start Result: ');
                console.log(stdout);
                console.log('#########################################################');
            });
        },

        /**
         * Exit Handler
         * 
         * @param Array options
         * @param String err
         * 
         * @return void
         */
        exitHandler: function exitHandler(options, err) {
            if (options.cleanup) console.log('clean');
            if (err) console.log(err.stack);
            if (options.exit) SwooleHttpDevMode._killSwooleProcess(process.exit, null);
        }
    };

    return SwooleHttpDevMode;
}());

SwooleHttpDevMode.init();