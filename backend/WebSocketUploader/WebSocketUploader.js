var WebSocketFileUpload = require('./WebSocketFileUpload.js');

class WebSocketUploader {
    currentUploads = {};
    
    constructor(socket) {
        this.socket = socket;

        this.initializeRoutes();
    }

    initializeRoutes() {
        this.socket.on('upload first slice', function (input) {
            currentUploads[input.id] = "hej";
            currentUploads[input.id] = new WebSocketFileUpload(this.socket, input);
            console.log("receiving first slice for id: " + input.id + " name: " + input.name);
        
            var uploader = this.currentUploads[input.id];
            uploader.push(input);
        
            var userInfo = clientInfo[socket.id];
            io.in(userInfo.room).emit("message", {
            text: '<a href="data/' + input.name + '" target="_blank">' + input.name + '</a>' + " was sent" + " from user: " + userInfo.name,
            name: "System",
            timestamp: moment().valueOf()
            });
        });
        
        this.socket.on('upload next slice', function (input) {
            console.log("Receiving next slice of data for id: " + input.id);
            var uploader = this.currentUploads[input.id];
            uploader.push(input);
        });
    }
}

module.exports = WebSocketUploader