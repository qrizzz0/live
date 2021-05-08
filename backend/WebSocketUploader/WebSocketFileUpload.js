const { throws } = require('assert');
const fs = require('fs');
const md5 = require('js-md5');
const FileModel = require("../models/file");
const mongoose = require("mongoose");

const imageExtensions = ["jpg", "png", "gif", "svg"];
const videoExtensions = ["mp4", "webm"];
const audioExtensions = ["mp3"];

class WebSocketFileUpload {

    data = [];
    saveLocation = "/home/cloud/live/frontend/data/";


    constructor(socket, messageHandler, fileInput) {
        this.socket = socket;
        this.messageHandler = messageHandler;

        this.originalName = fileInput.name;
        this.extension = fileInput.name.substr(fileInput.name.lastIndexOf('.') + 1); //This logic lended from https://stackoverflow.com/questions/680929/how-to-extract-extension-from-filename-string-in-javascript/680982
        this.size = fileInput.size;
        this.id = fileInput.id;
        this.sliceSize = fileInput.sliceSize;
        this.fileName = this.id + "." + this.extension;

        this.slices = 0;
    }

    //Currently we save entire file in RAM before writing to disk. To support very large files (100mb+) we should probably write to disk
    push(slice) {
        // Do sanity checks of the slice - if something is weird we abort the transfer.
        // This could be replaced with progressive hashing.
        var hash = md5(slice.data);
        console.log("hash: "+hash);
        if (slice.data == null || slice.datahash != hash) {
            console.log("Something wrong with a slice of data for file: " + this.id + " - Aborting.")
            console.log("Slice hash: " + slice.datahash + " Calculated hash: " + hash)
            this.endUpload(false);
            return -1;
        }

        //this.data.push(slice.data);
        this.data[slice.sliceID] = slice.data;
        this.slices++;

        console.log("id: " + this.id + " slices: " + this.slices + " sliceSize: " + this.sliceSize)

        if (this.slices * this.sliceSize <= this.size) {
            console.log("requesting next slice");
            this.requestNextSlice();
        } else {
            //File upload is finished!
            this.endUpload(true);
            this.saveFile();
            this.broadcastMessageToRoom();
            return 1;
        }
        return 0;
    }

    saveFile() {
        this.filePath = this.saveLocation + this.fileName;

        var writeStream = fs.createWriteStream(this.filePath);
        this.data.forEach(value => writeStream.write(value));

        this.saveToDatabase();
    }

    saveToDatabase() {
        var file = new FileModel();

        file._id = new mongoose.Types.ObjectId();
        file.fileName = this.fileName;
        file.originalName = this.originalName;
        file.path = this.filePath;
        file.fileSize = this.size;
        file.fileType = this.extension;

        file.save(async (err) => {
          if (err) {
            res.success = false;
            res.err = err;
            socket.emit("createroom", res);
            return;
          }
        });
    }

    broadcastMessageToRoom() {
        if (imageExtensions.includes(this.extension)) {
            this.messageHandler.sendMessageToRoom(this.socket, this.messageHandler.getNameFromSocket(this.socket), 
            '<img class="chatImage" src="data/' + this.fileName + '">');
        } else if(videoExtensions.includes(this.extension)) {
            this.messageHandler.sendMessageToRoom(this.socket, this.messageHandler.getNameFromSocket(this.socket), 
            '<video controls id="chatVideo" src="' + this.fileName + '">');
        } else {
            this.messageHandler.sendMessageToRoom(this.socket, this.messageHandler.getNameFromSocket(this.socket), 
            'Uploaded file: <a target="_blank" href="data/' + this.fileName + '">' + this.originalName + '</a>');
        }
    }

    FileSaveCallback = (err) => {
        if (err) throw err;
        console.log('File: "' + this.name + '" is saved!');
    }

    requestNextSlice() {
        this.socket.emit('request next slice', {
            id: this.id,
            currentSlice: this.slices
        });
    }

    endUpload() {
        this.socket.emit('end upload', {
            id: this.id,
            success: this.success,
        });
    }

}


module.exports = WebSocketFileUpload








/*socket.on('upload slice', function(input) {
    var userInfo = clientInfo[socket.id];
    console.log("Nice nice.")
    if (!files[input.name]) {
      files[input.name] = Object.assign({}, struct, input);  //Lav ny files (struct) med navn data.name
      files[input.name].data = [];
    }

    input.data = new Buffer(new Uint8Array(input.data)); //Fix buffer til hvad end man bruger i dag

    files[input.name].data.push(input.data);
    files[input.name].slice++;

    if (files[input.name].slice * 100000 >= files[input.name].size) {  //Hvis vi ændrer slice størrelse skal den ændres her
      //do something with the data
      socket.emit('end upload');
      fs.writeFile('/home/cloud/live/frontend/data/' + files[input.name].name, files[input.name].data[0], FileSaveCallback);
      console.log("data er blevet uploadet. Nice nice.")
    } else {
      socket.emit('request slice upload', {
          currentSlice: files[input.name].slice
      });
    }

    io.in(userInfo.room).emit("message", {
      text: input.name + " was sent" + " from user: " + userInfo.name,
      name: "System",
      timestamp: moment().valueOf()
    });

});*/