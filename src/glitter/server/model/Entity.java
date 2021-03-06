package glitter.server.model;

import java.util.concurrent.atomic.AtomicLong;
import glitter.server.arch.Rect;
import ox.Json;

public class Entity {

  private static final AtomicLong idCounter = new AtomicLong();

  public final long id = idCounter.getAndIncrement();

  public final Rect bounds;

  public Entity() {
    this(new Rect());
  }

  public Entity(int w, int h) {
    this(new Rect(0, 0, w, h));
  }

  public Entity(double x, double y, double w, double h) {
    this(new Rect(x, y, w, h));
  }

  public Entity(Rect bounds) {
    this.bounds = bounds;
  }

  /**
   * Return false if this entity should be removed.
   */
  public boolean update(double millis) {
    return true;
  }

  public boolean blocksWalking() {
    return false;
  }

  public Json toJson() {
    return Json.object()
        .with("id", id)
        .with("x", bounds.x)
        .with("y", bounds.y)
        .with("width", bounds.w)
        .with("height", bounds.h);
  }

}
