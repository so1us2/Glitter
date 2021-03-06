function Network(ip, port, spells) {
  var socket = this.connectToServer(ip, port);

  $(window).on("beforeunload", function() {
    socket.close();
  });

  this.socket = socket;
  this.lootChooser = new LootChooser();

  this.spells = checkNotNull(spells);
}

Network.prototype.send = function(msg) {
  this.socket.send(msg);
}

Network.prototype.connectToServer = function(ip, port) {
  var self = this;
  var socket = new Socket(ip, port, false);
  socket.onMessage(function(msg) {
    self.handleMessage(msg);
  });
  socket.open();
  return socket;
}

Network.prototype.handleMessage = function(msg) {
  var command = msg.command;
  if (command == "ping") {
    msg.command = "pong";
    network.send(msg);
    return;
  }

  console.log(msg);
  if (command == "playerState") {
    var player = world.idPlayers[msg.id];
    player.setX(msg.x);
    player.setY(msg.y);
    player.setKeys(msg.keys);
  } else if (command == "removeEntity") {
    world.removeEntity(msg.id);
  } else if (command == "cast") {
    this.spells.onCast(msg);
  } else if (command == "castEffects") {
    this.spells.castEffects(msg);
  } else if (command == "onHit") {
    this.spells.onHit(msg);
  } else if (command == "choose") {
    network.lootChooser.show(msg.choices);
  } else if (command == "receiveItem") {
    window.inventory.add(msg.item);
  } else if (command == "stats") {
    world.idPlayers[msg.playerId].acceptStats(msg.stats);
  } else if (command == "addStatusEffect") {
    world.idPlayers[msg.playerId].addStatusEffect(msg);
  } else if (command == "removeStatusEffect") {
    world.idPlayers[msg.playerId].removeStatusEffect(msg);
  } else if (command == "updateTile") {
    world.updateTile(msg.x, msg.y, msg.type);
  } else if (command == "itemExplosion") {
    new ItemExplosion(msg);
  } else if (command == "itemDropped") {
    window.createEntityForItem(msg.item, msg.x, msg.y);
  } else if (command == "bagUpdate") {
    window.inventory.bagUpdate(msg);
  } else if (command == "enterWorld") {
    if ($(".countdown").finish().is(":visible")) {
      $(".numPlayers label").text("alive");
      $(".countdown").hide();
    }
    world.removeAllPlayers();
    world.terrain = new Terrain(msg.world.terrain);
    world.renderTiles();
    world.setChests(msg.world.chests);
    minimap.onEnterWorld(msg.world);
    window.me = null;
  } else if (command == "addPlayer") {
    world.addPlayer(new Player(msg.player));
  } else if (command == "removePlayer") {
    world.removePlayer(msg.id);
  } else if (command == "takeControl") {
    window.me = world.idPlayers[msg.id];
    $(".numPlayers").show();
    window.camera.onPlayerSpawned();
  } else if (command == "forcefield") {
    window.forcefield.updateBounds(msg.forcefield);
  } else if (command == "countdown") {
    if (msg.millisLeft == -1) {
      $(".countdown").fadeOut();
    } else {
      window.gameStartTime = Date.now() + msg.millisLeft;
      $(".countdown").fadeIn();
    }
  } else if (command == "consoleOutput") {
    $("<div>").text(msg.text).appendTo(".console .output");
  } else if (command == "error") {
    showError(msg.text);
  } else if (command == "start") {
    $(".summary .totalPlayers").text(" / " + Object.keys(world.idPlayers).length);
  } else {
    console.log("Unknown command: " + command);
    console.log(msg);
  }
}
