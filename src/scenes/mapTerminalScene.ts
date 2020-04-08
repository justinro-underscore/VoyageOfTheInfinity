import "phaser";

const ROOM_SIZE = [100, 70];


export class MapTerminalScene extends Phaser.Scene {
  currRoom: Phaser.GameObjects.Rectangle;

  constructor() {
    super({
      key: "MapTerminalScene"
    });
  }

  /**
   * Loads the images
   */
  preload() {
    this.load.image("terminalScreen", 'assets/img/terminal-screen.png');
  }

  /**
   * Set up all game assets shown to user and adds functionality
   */
  create() {
    /*************************
     * Set up the background *
     *************************/
    let background = this.add.image(0, 0, "terminalScreen");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    this.currRoom = this.add.rectangle((this.cameras.main.width - ROOM_SIZE[0]) / 2, (this.cameras.main.height - ROOM_SIZE[1]) / 2, ROOM_SIZE[0], ROOM_SIZE[1], 0xdddddd, 0.2);

    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      let dir = -1;
      let moveBy = [0, 0]; // [X, Y]
      switch (event.keyCode) {
        case 37: // Left
          dir = 3;
          moveBy[0] = ROOM_SIZE[0] * -2;
          break;
        case 38: // Up
          dir = 0;
          moveBy[1] = ROOM_SIZE[1] * -2;
          break;
        case 39: // Right
          dir = 1;
          moveBy[0] = ROOM_SIZE[0] * 2;
          break;
        case 40: // Down
          dir = 2;
          moveBy[1] = ROOM_SIZE[1] * 2;
          break;
        default:
          return;
      }
      this.tweens.add({
        targets: this.currRoom,
        duration: 1000,
        x: this.currRoom.x + moveBy[0],
        y: this.currRoom.y + moveBy[1],
        ease: "Quad.easeOut"
      });
    }, this);
  }
};
