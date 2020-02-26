import "phaser";
export class MainMenuScene extends Phaser.Scene {
  title: Phaser.GameObjects.Text;
  authors: Phaser.GameObjects.Text;
  start: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: "MainMenuScene"
    });
  }

  preload(): void {
    this.load.image('blackhole', 'res/black-hole-medium.jpg');
    this.load.image('ship', 'res/train-space-ship.png');
  }

  create(): void {
    this.add.image(200, 350, 'blackhole');

    this.title = this.add.text(110, 0, "Voyage of the Infinity",
      { font: '62px Trade Winds', fill: '#fbfbac' });

    this.authors = this.add.text(200, 60, "Created by Justin and Sean",
      { font: '42px Trade Winds', fill: '#fbfbac' });

    this.start = this.add.text(10, 450, "Press space to start...",
      { font: '32px Trade Winds', fill: '#fbfbac' });

    this.add.image(620, 520, 'ship').setScale(-0.2, 0.2).setAngle(10);

    this.input.on('keydown', function(event) {
      console.log(event);
    }, this);
  }
};
