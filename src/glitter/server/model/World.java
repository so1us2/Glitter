package glitter.server.model;

import static ox.util.Utils.random;
import java.util.Collection;
import ox.Json;
import ox.Log;

public class World {

  public final Terrain terrain;
  public final Collection<Player> players;
  public final AdminConsole console = new AdminConsole(this);

  public World(Terrain terrain, Collection<Player> players) {
    this.terrain = terrain;
    this.players = players;
  }

  public void start() {
    new GameLoop(this::update);
  }

  private void update(double t) {
    for (Player player : players) {
      player.update(t);
    }

    for (Player player : players) {
      player.flushMessages();
    }
  }

  public void addPlayer(Player player) {
    players.add(player);
    player.world = this;
    spawnInRandomLocation(player);

    Log.debug("player connected. (%d players in world)", players.size());

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

  public void removePlayer(Player player) {
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