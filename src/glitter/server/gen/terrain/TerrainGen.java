package glitter.server.gen.terrain;

import java.util.Random;
import glitter.server.model.Terrain;
import glitter.server.model.Tile;
import ox.Log;

public class TerrainGen {

  private final Random rand = new Random();

  // threshold for land, in the noise
  private final double threshold = .6;

  private final IslandFinder islandFinder = new IslandFinder(rand, threshold);
  private final TerrainSmoother smoother = new TerrainSmoother(threshold);
  private final BridgeBuilder bridgeBuilder = new BridgeBuilder(rand, threshold);

  private Terrain generate(int minTiles) {
    Log.info("Generating terrain (%d tiles)", minTiles);

    Islands islands = islandFinder.findIslands(minTiles);
    Log.debug("Generated %d islands.", islands.size());

    smoother.smooth(islands);

    bridgeBuilder.genBridges(islands);

    Tile[][] tiles = new Tile[islands.noise.length][islands.noise[0].length];
    for (int i = 0; i < tiles.length; i++) {
      for (int j = 0; j < tiles[0].length; j++) {
        tiles[i][j] = Tile.VOID;
      }
    }

    int grassCount = 0;
    for (Island island : islands) {
      for (Point p : island.points) {
        tiles[p.x][p.y] = Tile.GRASS;
        grassCount++;
      }
    }

    for (Point p : islands.bridges) {
      tiles[p.x][p.y] = Tile.BRIDGE;
    }
    for (Point p : islands.debug) {
      tiles[p.x][p.y] = Tile.LAVA;
    }

    Log.debug("Finished generating terrain (%d x %d) (%d tiles)", tiles.length, tiles[0].length,
        grassCount);

    return new Terrain(tiles);
  }

  public static Terrain generateFor(int numPlayers) {
    // let's give each player about 2000 tiles of space
    return new TerrainGen().generate(numPlayers * 2000);
  }

}