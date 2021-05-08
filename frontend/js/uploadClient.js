class WebSocketUploaderClient {
  constructor(socket, file, sliceSize) {
    this.socket = socket;
    this.file = file;
    this.sliceSize = sliceSize;
    this.id = "" + Date.now() + Math.floor(Math.random() * 10000); //fordi "" bliver det til en streng og de to tal bliver konkateneret
  }

  getId() {
    return this.id;
  }

  uploadFirstSlice() {
    var file = this.file;

    var fileReader = new FileReader(), slice = file.slice(0, this.sliceSize);
    fileReader.readAsArrayBuffer(slice);

    fileReader.onload = (evt) => {
      var arrayBuffer = fileReader.result;
      var hash = md5(arrayBuffer);
      console.log("md5 is: " + hash);
      socket.emit('upload first slice', {
        name: file.name,
        id: this.id,
        type: file.type,
        sliceID: 0,
        sliceSize: this.sliceSize,
        size: file.size,
        data: arrayBuffer,
        datahash: hash,
      });
    }
  }

  uploadSpecificSlice(chosenSlice) {
    var slicePtr = chosenSlice * this.sliceSize;
    var fileReader = new FileReader(), slice = this.file.slice(slicePtr, slicePtr + this.sliceSize);
    fileReader.readAsArrayBuffer(slice);

    fileReader.onload = (evt) => {
      var arrayBuffer = fileReader.result;
      //var md5 = CryptoJS.MD5(arrayBuffer);
      var hash = md5(arrayBuffer);
      console.log("md5 is: " + hash);
      socket.emit('upload next slice', {
        id: this.id,
        sliceID: chosenSlice,
        data: arrayBuffer,
        datahash: hash,
      });
    }
  }

  getProgress(chosenSlice) {
    return ((chosenSlice + 1)* this.sliceSize) / this.file.size * 100;
  }
}