const { throws } = require('assert');
const fs = require('fs');
const CryptoJS = require('crypto-js');

class WebSocketFileUpload {
    data = [];

    constructor(socket, fileInput) {
        this.name = fileInput.name;
        this.size = fileInput.size;
        this.id = fileInput.id;
        this.sliceSize = fileInput.sliceSize;

        this.socket = socket;

        this.slices = 0;
    }

    //Currently we save entire file in RAM before writing to disk. To support very large files (100mb+) we should probably write to disk
    push(slice) {
        //Do sanity checks of the slice - if something is weird we abort the transfer.
        var md5 = CryptoJS.SHA256(slice.data);
        if (slice.data == null || slice.datahash != md5) {
            console.log("Something wrong with a slice of data for file: " + this.id + " - Aborting.")
            console.log("datahash: " + slice.datahash + " md5: " + md5)
            this.abort();
        }

        //this.data.push(slice.data);
        this.data[slice.sliceID] = slice.data;
        this.slices++;

        console.log("id: " + this.id + " slices: " + this.slices + " sliceSize: " + this.sliceSize)

        if (this.slices * this.sliceSize <= this.size) {
            console.log("requesting next slice");
            this.requestNextSlice();
        } else {
            console.log("Upload should be done if you see this. Saving file");
            this.saveFile()
        }
    }

    saveFile() {
        var filePath = '/home/cloud/live/frontend/data/' + this.name;

        var writeStream = fs.createWriteStream(filePath);
        this.data.forEach(value => writeStream.write(value));
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

    abort() {
        console.log("Aborting upload.");
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