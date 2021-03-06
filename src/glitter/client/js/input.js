/**
 * Listens for user input.
 */

function Input(spells) {
  this.rect = new PIXI.Rectangle();
  this.spells = spells;

  // whether the user has pressed any keys since the last update
  this.dirty = false;
  this.interactionEntity = null;
  this.consoleVisible = false;
  this.inventoryVisible = false;

  this.listen();

  this.buf = {};

  glitter.register(this);
}

Input.prototype.interact = function() {
  if (this.interactionEntity && !me.stunned) {
    if (this.interactionEntity.id) {
      network.send({
        command : "interact",
        entityId : this.interactionEntity.id
      });
    } else {
      network.send({
        command : "interact",
        tile : this.interactionEntity
      });
    }
  }
}

Input.prototype.sendMyState = function() {
  var keyList = [];
  Object.keys(me.keys).forEach(function(key) {
    keyList.push(key);
  });
  if (me.alive) {
    network.send({
      command : "myState",
      keys : keyList,
      x : me.x,
      y : me.y
    });
  }
  this.dirty = false;
}

Input.prototype.update = function(t) {
  var self = this;

  if (window.me == null) {
    return;
  }

  if (this.dirty) {
    self.sendMyState();
  }

  $.each(world.idPlayers, function(id, player) {
    if (player.alive && !player.stunned) {
      self.movePlayer(player, t);
    }
  });
}

Input.prototype.movePlayer = function(player, t) {
  var keys = player.keys;

  var speed = player.speed;
  if (player.flying) {
    speed *= 10;
  }
  var distance = speed * Tile.SIZE * t / 1000;

  var dx = 0, dy = 0;

  if (keys['w']) {
    dy -= distance;
  }
  if (keys['a']) {
    dx -= distance;
  }
  if (keys['s']) {
    dy += distance;
  }
  if (keys['d']) {
    dx += distance;
  }

  if (dx != 0 && dy != 0) {
    // divide by sqrt(2)
    dx /= 1.4142135;
    dy /= 1.4142135;
  }

  var moved = false;
  if (dx != 0) {
    moved |= this.move(player, dx, 0);
  }
  if (dy != 0) {
    moved |= this.move(player, 0, dy);
  }

  if (moved && player == me) {
    this.findInteraction();
  }
}

Input.prototype.findInteraction = function() {
  // see if we are near something we can interact with

  var interactionEntity = null;
  var self = this;
  var rect = me.getHitbox(this.rect, 16);

  world.terrain.getTilesIntersecting(rect.x, rect.y, rect.width, rect.height, function(tile) {
    if (tile.type == Tile.DOOR) {
      interactionEntity = tile;
      return false;
    }
  });

  if (interactionEntity == null) {
    $.each(world.idEntities, function(key, entity) {
      if (entity.canInteract && self.intersects(rect, entity)) {
        interactionEntity = entity;
        return false;
      }
    });
  }

  if (interactionEntity != this.interactionEntity) {
    this.interactionEntity = interactionEntity;
    if (this.interactionEntity) {
      $(".spacebar").fadeIn(200);
    } else {
      $(".spacebar").fadeOut(200);
    }
  }
}

Input.prototype.move = function(player, dx, dy) {
  if (!player.flying) {
    var rect = player.getHitbox(this.rect);
    rect.x += dx;
    rect.y += dy;
    if (this.isCollision(rect)) {
      return false;
    }
  }

  player.setX(player.x + dx);
  player.setY(player.y + dy);

  return true;
}

Input.prototype.isCollision = function(rect) {
  var self = this;

  var ret = false;
  world.terrain.getTilesIntersecting(rect.x, rect.y, rect.width, rect.height, function(tile) {
    if (!world.terrain.isWalkable(tile.type)) {
      ret = true;
    }
  });

  if (ret) {
    return true;
  }

  $.each(world.idEntities, function(key, value) {
    if (value.blocksWalking && self.intersects(rect, value)) {
      ret = true;
      return false;
    }
  });

  return ret;
}

Input.prototype.intersects = function(rect, entity) {
  var buf = this.buf;
  entity.getHitBox(buf);

  if ((rect.x >= buf.x + buf.width) || (rect.x + rect.width <= buf.x) || (rect.y >= buf.y + buf.height)
      || (rect.y + rect.height <= buf.y)) {
    return false;
  }

  return true;
}

Input.prototype.listen = function() {
  var self = this;

  var cursor = $(".cursor");

  document.onmousemove = function(e) {
    cursor.css("transform", "translate(" + e.clientX + "px," + e.clientY + "px)");
  }

  $("canvas").mousedown(function(e) {
    if (!me.alive) {
      return;
    }
    var item = window.quickbar.getSelectedItem();
    if (item) {
      self.spells.cast(item, e.offsetX, e.offsetY);
    }
  });

  $(window).keydown(function(e) {
    self.onKeyDown(self, e);
  });

  $(window).keyup(function(e) {
    e.key = e.key.toLowerCase();
    if (window.me) {
      delete me.keys[e.key];
      self.dirty = true;
    }
  });

  $(".console input").blur(function() {
    $(this).focus();
  });

  $(".summary button").click(function() {
    window.location.reload();
  });
}

Input.prototype.onKeyDown = function(self, e) {
  e.key = e.key.toLowerCase();
  if (e.key == " ") {
    self.interact();
  } else if (e.key == "enter") {
    if (self.consoleVisible) {
      var text = $(".console input").val().trim();
      $(".console input").val("");
      if (text) {
        if (text == "/fly") {
          me.flying = !me.flying;
        } else {
          network.send({
            command : "consoleInput",
            text : text
          });
        }
      }
      $(".console").stop().hide();
      self.consoleVisible = false;
    } else {
      $(".console").stop().fadeIn();
      $(".console input").focus();
      self.consoleVisible = true;
    }
  } else if (e.key == "/") {
    if (!self.consoleVisible) {
      $(".console").stop().fadeIn();
      $(".console input").focus();
      self.consoleVisible = true;
    }
  } else if (e.which >= 48 && e.which < 58) {
    window.quickbar.select(e.which - 48);
  } else if (e.key == 'i' || e.key == 'tab') {
    e.preventDefault();
    if (self.inventoryVisible) {
      $(".inventory").stop().fadeOut();
    } else {
      $(".inventory").stop().fadeIn();
    }
    self.inventoryVisible = !self.inventoryVisible;
  } else if (e.key == 'escape') {
    if (self.inventoryVisible) {
      $(".inventory").stop().fadeOut();
      self.inventoryVisible = false;
    }
  }
  if (self.consoleVisible) {
    return;
  }
  if (window.me && !me.keys[e.key]) {
    me.keys[e.key] = true;
    self.dirty = true;
  }
}
