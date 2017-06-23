package glitter.server.model;

import static ox.util.Utils.random;
import java.util.List;
import com.google.common.collect.Lists;
import ox.Json;
import ox.Log;
import ox.Threads;
import ox.util.Utils;

public class World {

  public final Terrain terrain;
  public final List<Player> players = Lists.newArrayList();

  public World() {
    terrain = Terrain.createLobby();
  }

  private void update(double t) {
    for (Player player : players) {
      player.flushMessages();
    }
  }

  public void startLoop() {
    Threads.run(() -> {
      long lastFPSUpdate = System.nanoTime();
      long MAX_UPDATE_TIME = 100;
      int frames = 0;
      double t = 10;
      while (true) {
        long now = System.nanoTime();

        if (now - lastFPSUpdate >= 1_000_000_000) {
          // Log.debug("Server FPS: " + frames);
          frames = 0;
          lastFPSUpdate = now;
        }

        double timeLeft = t;
        while (timeLeft > 0) {
          double tickTime = Math.min(timeLeft, MAX_UPDATE_TIME);
          try {
            update(tickTime);
          } catch (Exception e) {
            e.printStackTrace();
          }
          timeLeft -= MAX_UPDATE_TIME;
        }

        frames++;
        t = (System.nanoTime() - now) / 1_000_000d;
        Utils.sleep((long) Math.floor(1000 / 40.0 - t));
        t = (System.nanoTime() - now) / 1_000_000d;
      }
    });
  }

  public void addPlayer(Player player) {
    players.add(player);
    player.world = this;
    spawnInRandomLocation(player);

    Log.debug("player connected. (%d players in world)", players.size());
    player.socket.onClose(() -> {
      removePlayer(player);
    });

    player.send(Json.object()
        .with("command", "enterWorld")
        .with("world", this.toJson()));

    sendToAll(createAddPlayerJson(player));

    player.send(Json.object()
        .with("command", "takeControl")
        .with("id", player.id));

    for (Player p : players) {
      if (p != player) {
        player.send(createAddPlayerJson(p));
      }
    }
  }

  private void removePlayer(Player player) {
    Log.debug("player disconnected. (%d players in world)", players.size());
    players.remove(player);

    sendToAll(Json.object()
        .with("command", "removePlayer")
        .with("id", player.id));
  }

  private Json createAddPlayerJson(Player p) {
    return Json.object()
        .with("command", "addPlayer")
        .with("player", Json.object()
            .with("id", p.id)
            .with("x", p.x)
            .with("y", p.y));
  }

  private void spawnInRandomLocation(Player player) {
    while (true) {
      int i = random(terrain.width);
      int j = random(terrain.height);
      if (terrain.tiles[i][j].isWalkable()) {
        player.moveToTile(i, j);
        return;
      }
    }
  }

  public void sendToAll(Json json) {
    sendToAll(json, null);
  }

  public void sendToAll(Json json, Player exception) {
    for (Player player : players) {
      if (player != exception) {
        player.send(json);
      }
    }
  }

  public Json toJson() {
    return Json.object()
        .with("terrain", terrain.toJson());
  }

}
