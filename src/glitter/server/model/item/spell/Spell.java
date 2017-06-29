package glitter.server.model.item.spell;

import glitter.server.model.item.Item;
import ox.Json;

public abstract class Spell extends Item {

  public double manaCost = 0;
  public double castTimeSeconds = 0;
  public double cooldownSeconds = 0;
  public String description = "";

  public Spell(String name) {
    this(name, Rarity.COMMON);
  }

  public Spell(String name, Rarity rarity) {
    super(name, rarity);
  }

  @Override
  public Json toJson() {
    return super.toJson()
        .with("manaCost", manaCost)
        .with("castTimeSeconds", castTimeSeconds)
        .with("cooldownSeconds", cooldownSeconds)
        .with("description", description)
        .with("iconUrl", "/spells/" + name.toLowerCase() + ".png");
  }

}