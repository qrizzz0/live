 var socket = io.connect('http://130.225.170.76:3000');
 // listen for server connection
 // get query params from url
 var name = getQueryVariable("name") || 'Anonymous';
 var room = getQueryVariable("room") || 'No Room Selected';

 $(".room-title").text(room);
 // fires when client successfully conencts to the server
 socket.on("connect", function() {
   console.log("Connected to Socket I/O Server!");
   console.log(name + " wants to join  " + room);
   // to join a specific room
   socket.emit('joinRoom', {
     name: name,
     room: room
   });
 });

 // below code is to know when typing is there
 var timeout;

 function timeoutFunction() {
   typing = false;
   //console.log("stopped typing");
   // socket.emit("typing", false);
   socket.emit('typing', {
     text: "" //name + " stopped typing"
   });
 }
 // if key is pressed typing message is seen else auto after 2 sec typing false message is send
 // TODO : add broadcast event when server receives typing event
 $('#messagebox').keyup(function() {
   console.log('happening');
   typing = true;
   $("#icon-type").removeClass();
   //console.log("typing typing ....");
   //socket.emit('typing', 'typing...');
   socket.emit('typing', {
     text: name + " is typing ..."
   });
   clearTimeout(timeout);
   timeout = setTimeout(timeoutFunction, 1000);
 });

 // below is the checking for page visibility api
 var hidden, visibilityChange;
 if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
   hidden = "hidden";
   visibilityChange = "visibilitychange";
 } else if (typeof document.mozHidden !== "undefined") {
   hidden = "mozHidden";
   visibilityChange = "mozvisibilitychange";
 } else if (typeof document.msHidden !== "undefined") {
   hidden = "msHidden";
   visibilityChange = "msvisibilitychange";
 } else if (typeof document.webkitHidden !== "undefined") {
   hidden = "webkitHidden";
   visibilityChange = "webkitvisibilitychange";
 }

 //listening for typing  event
 socket.on("typing", function(message) { 
   $(".typing").text(message.text);
 });

 //setup for custom events
 /*socket.on("message", function(message) {
   console.log("New Message !");
   console.log(message.text);
   // insert messages in container
   var $messages = $(".messages");
   var $message = $('<li class = "list-group-item"></li>');

   var momentTimestamp = moment.utc(message.timestamp).local().format("h:mm a");
   //$(".messages").append($('<p>').text(message.text));
   $message.append("<strong>" + momentTimestamp + " " + message.name + "</strong>");
   $message.append("<p>" + message.text + "</p>");
   $messages.append($message);
   // handle autoscroll
   // manage autoscroll
   var obj = $("ul.messages.list-group");
   var offset = obj.offset();
   var scrollLength = obj[0].scrollHeight;
   //  offset.top += 20;
   $("ul.messages.list-group").animate({
     scrollTop: scrollLength - offset.top
   });
 });*/

 // handles submitting of new message
 var $form = $("#messageForm");
 var $message1 = $form.find('input[name=message]');
 $form.on("submit", function(event) {
   event.preventDefault();
   var msg = $message1.val();
   //prevent js injection attack
   msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
   if (msg === "") return -1; //empty messages cannot be sent

   socket.emit("message", {
     text: msg,
     name: name
   });
   // show user messageForm
   var $messages = $(".messages");
   var $message = $('<li class = "list-group-item"></li>');

   var momentTimestamp = moment().format("h:mm a");
   // $(".messages").append($('<p>').text(message.text));
   $message.append("<strong>" + momentTimestamp + " " + name + "</strong>");
   //$message.append("<p>" + $message1.val()+ "</p>");
   $message.append($("<p>", {
     class: "mymessages",
     text: $message1.val()
   }));
   $messages.append($message);
   $message1.val('');
   // manage autoscroll
   var obj = $("ul.messages.list-group");
   var offset = obj.offset();
   var scrollLength = obj[0].scrollHeight;
   //  offset.top += 20;
   $("ul.messages.list-group").animate({
     scrollTop: scrollLength - offset.top
   });

   

 });

