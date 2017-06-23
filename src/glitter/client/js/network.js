function Network(ip, port) {
  var socket = this.connectToServer(ip, port);

  $(window).on("beforeunload", function() {
    socket.close();
  });

  this.socket = socket;
  
  //TODO receive from the server how much longer til the game starts
  window.gameStartTime = Date.now() + 60000;
}

Network.prototype.send = function(msg) {
  this.socket.send(msg);
}

Network.prototype.connectToServer = function(ip, port) {
  var socket = new Socket(ip, port, false);
  socket.onMessage(this.handleMessage);
  socket.open();
  return socket;
}

Network.prototype.handleMessage = function(msg) {
  // console.log(msg);
  var command = msg.command;
  if (command == "enterWorld") {
    world.terrain = new Terrain(msg.world.terrain);
    world.renderTiles();
  } else if (command == "addPlayer") {
    world.addPlayer(new Player(msg.player));
  } else if (command == "removePlayer") {
    world.removePlayer(msg.id);
  } else if (command == "takeControl") {
    window.me = world.idPlayers[msg.id];
    $(".numPlayers").show();
  } else if(command == "playerState"){
    var player = world.idPlayers[msg.id];
    player.x = msg.x;
    player.y = msg.y;
    player.setKeys(msg.keys);
  } else {
    console.log("Unknown command: " + command);
    console.log(msg);
  }
}