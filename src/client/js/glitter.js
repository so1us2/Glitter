
const Camera = require('./camera')


window.Tile.SIZE = 48

function Glitter() {
  this.initGame()
}

Glitter.prototype.initGame = function() {
  window.canvas = new Canvas()
  window.world = new World()
  window.camera = new Camera()
  window.input = new Input()
  window.minimap = new MiniMap()
  window.quickbar = new Quickbar()

  input.listen()

  var loop = new GameLoop(canvas)
  loop.start()

  PIXI.loader.add("tiles.png").add("wizard.png").load(function() {
    console.log("done loading sprites.")

    window.network = new Network(window.websocketIP, window.websocketPort);
  })
}

function main() {
  new Glitter()
}

$(main)