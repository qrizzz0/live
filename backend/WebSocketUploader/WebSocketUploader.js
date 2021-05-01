var WebSocketFileUpload = require('./WebSocketFileUpload.js');

class WebSocketUploader {
    currentUploads = {};
    
    constructor(socket, messageHandler) {
        this.socket = socket;
        this.messageHandler = messageHandler;


        this.initializeRoutes();
    }

    initializeRoutes() {
        this.socket.on('upload first slice', function (input) {
            this.processFirstSlice(input);
        }.bind(this));
        
        this.socket.on('upload next slice', function (input) {
            this.processSlice(input);
        }.bind(this));

        this.socket.on('abort file upload', function (input) {
            delete(this.currentUploads[input.id]);
        }.bind(this));
    }

    processFirstSlice(input) {
        this.currentUploads[input.id] = new WebSocketFileUpload(this.socket, this.messageHandler, input);
        this.processSlice(input);
    }

    processSlice(input) {
        if (this.currentUploads[input.id] === undefined) {
            console.log("WebSocketUploader: Pls no");
            return -1; //Something is very wrong if this is the case.
        }

        var uploader = this.currentUploads[input.id];
        if (uploader.push(input) !== 0) {
            delete(this.currentUploads[input.id]);
        };
    }  
}

module.exports = WebSocketUploader