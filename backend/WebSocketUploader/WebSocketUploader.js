const FileModel = require("../models/file");
const mongoose = require("mongoose");
var WebSocketFileUpload = require('./WebSocketFileUpload.js');
var fs = require('fs');

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
    
    
    deleteFile(mongo_id) {
        var file = new FileModel();
        //First delete the actual file.
        FileModel.findById(mongo_id, function(error, result) {
            if(error) {
                console.log("WebSocketUploader was asked to delete file " + mongo_id + "but it could not be found in database?");
            } else {
                fs.unlink(file.path, function(deleteError) {
                    if (deleteError) throw deleteError;
                    //Delete from database if all is well to here.  
                    FileModel.findByIdAndDelete(mongo_id);
                  });   
            }
          });      
    }
}

module.exports = WebSocketUploader