import "phaser";
import { MapHandler } from '../handler/mapHandler';

export class MainMenuScene extends Phaser.Scene {
  title: Phaser.GameObjects.Text;
  authors: Phaser.GameObjects.Text;
  start: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: "MainMenuScene"
    });
  }

  preload() {
    this.load.image('blackhole', 'assets/img/black-hole-medium.jpg');
    this.load.image('ship', 'assets/img/train-space-ship.png');
  }

  create() {
    this.add.image(200, 350, 'blackhole');

    this.title = this.add.text(110, 0, "Voyage of the Infinity",
      { font: '62px Trade Winds', fill: '#fbfbac' });

    this.authors = this.add.text(200, 60, "Created by Justin and Sean",
      { font: '42px Trade Winds', fill: '#fbfbac' });

    this.start = this.add.text(10, 450, "Press space to start...",
      { font: '32px Trade Winds', fill: '#fbfbac' });

    this.add.image(620, 520, 'ship').setScale(-0.2, 0.2).setAngle(10);

    this.input.keyboard.on('keydown', function (event: KeyboardEvent) {
      if (event.keyCode === 32) {
        MapHandler.instantiateInstance("");
        this.scene.start("TerminalScene");
      }
      else if (event.key === "D") {
        MapHandler.instantiateInstance("");
        this.scene.start("DebugMapScene");
      }
    }, this);
  }
};
