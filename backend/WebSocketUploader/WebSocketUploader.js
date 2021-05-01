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
            this.currentUploads[input.id] = new WebSocketFileUpload(this.socket, this.messageHandler, input);
            console.log("receiving first slice for id: " + input.id + " name: " + input.name);
        
            var uploader = this.currentUploads[input.id];
            uploader.push(input);
        }.bind(this));
        
        this.socket.on('upload next slice', function (input) {
            console.log("Receiving next slice of data for id: " + input.id);
            var uploader = this.currentUploads[input.id];
            uploader.push(input);
        }.bind(this));
    }

    

}

module.exports = WebSocketUploader