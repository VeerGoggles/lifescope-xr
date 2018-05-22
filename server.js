import config from 'config';
import http from "http";
import easyRTC from "easyrtc";
import express from 'express';
import socketIO from "socket.io";
import AWS from 'aws-sdk';

const ICE_SERVERS = config.iceServers;
const LISTEN_PORT = config.listenPort;
const NAF_LISTEN_PORT = 7070;

const AWSAccessKeyId = config.AWSCred.AWSAccessKeyId;
const AWSSecretKey = config.AWSCred.AWSSecretKey;
const BUCKET_NAME = config.ROOM_CONFIG.BUCKET_NAME;
const BUCKET_PATH = config.ROOM_CONFIG.BUCKET_PATH;
const ROOM_CONFIG = config.ROOM_CONFIG;

var gallery_content = [];

const server = express();

const AWSConfig = {
    "accessKeyId": AWSAccessKeyId,
    "secretAccessKey": AWSSecretKey,
    "region": 'us-east-1'
};
 
// Set aws config
AWS.config.update(AWSConfig);

// Create the parameters for calling createBucket
var bucketParams = {
   Bucket : BUCKET_NAME
};                    
                             
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

s3.listObjects(bucketParams, function(err, data) {
    if (err) {console.log(err, err.stack);}
    else {
        //debugger;
        for (var content of data.Contents) {
            var re_ext=/\.[0-9a-z]+$/i;
            var re_name=/\/([0-9a-z\-\s]+)\.[0-9a-z]+$/i;

            if (content.Key.startsWith(BUCKET_PATH) && !content.Key.endsWith('/')) {
                
                var result = {
                    id: content.Key.match(re_name)[1].replace(new RegExp(' ', 'g'), '-'),
                    route: content.Key,
                    name: content.Key.match(re_name)[1].replace(new RegExp('-', 'g'), ' '),
                    ext: content.Key.match(re_ext)[0]
                };
                //console.log(result);
                gallery_content.push(result);
            }
        }
    }
});


Promise.resolve()
  .then(async function() {

    global.env = {
        iceServers: ICE_SERVERS
    };

    // serve static files
    server.use(express.static('.'));
    server.use('/static', express.static('static'));
    server.use(express.static('./dist'));

    // test content
    server.get('/test/api/content', function(req, res) {
        //debugger;
        res.json(gallery_content);   
    });

    // room configuration
    server.get('/roomconfig', function (req, res) {
        res.json(ROOM_CONFIG);
    });

    // start websockets for NAF
    // Start Express http server for NAF
    var NAFServer = http.createServer(server);
    var socketServer = socketIO.listen(NAFServer, {"log level":1});

    // start RTC for NAF
    easyRTC.setOption("appIceServers", ICE_SERVERS);
    easyRTC.setOption("logLevel", "debug");
    easyRTC.setOption("demosEnable", false);

    // Overriding the default easyrtcAuth listener, only so we can directly access its callback
    easyRTC.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
        easyRTC.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
            if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
                callback(err, connectionObj);
                return;
            }

            connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

            console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

            callback(err, connectionObj);
        });
    });

    // To test, lets print the credential to the console for every room join!
    easyRTC.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
        console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
        easyRTC.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
    });

    // Start EasyRTC server
    var rtc = easyRTC.listen(server, socketServer, null, function(err, rtcRef) {
        console.log("Initiated");

        rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
            console.log("roomCreate fired! Trying to create: " + roomName);

            appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
        });
    });

    NAFServer.listen(NAF_LISTEN_PORT, function () {
        console.log('NAFServer listening on http://localhost:' + NAF_LISTEN_PORT);
    });

    server.listen(LISTEN_PORT, () => console.log('LIFESCOPE XR config server listening on port:' + LISTEN_PORT));

  })