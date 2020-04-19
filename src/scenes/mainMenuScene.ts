import "phaser";
import { MapHandler } from '../handler/mapHandler';
import { EventHandler } from '../handler/eventHandler';

/**
 * Defines the initial scene that users see when they start the game
 */
export class MainMenuScene extends Phaser.Scene {
  title: Phaser.GameObjects.Text; // Text which holds the title of the game
  authors: Phaser.GameObjects.Text; // Text which holds the authors of the game
  start: Phaser.GameObjects.Text; // Text that tells the user how to start the game

  constructor() {
    super({
      key: "MainMenuScene"
    });
  }

  /**
   * Loads the images
   */
  preload() {
    this.load.image('blackhole', 'assets/img/black-hole-medium.jpg');
    this.load.image('ship', 'assets/img/train-space-ship.png');
  }

  /**
   * Set up all game assets shown to user and adds functionality
   */
  create() {
    /*************************
     * Set up the background *
     *************************/
    this.add.image(200, 350, 'blackhole');
    this.add.image(620, 520, 'ship').setScale(-0.2, 0.2).setAngle(10);

    /************
     * Add text *
     ************/
    this.title = this.add.text(110, 0, "Voyage of the Infinity",
      { font: '62px Trade Winds', fill: '#fbfbac' });
    this.authors = this.add.text(200, 60, "Created by Justin and Sean",
      { font: '42px Trade Winds', fill: '#fbfbac' });
    this.start = this.add.text(10, 450, "Press space to start...",
      { font: '32px Trade Winds', fill: '#fbfbac' });

    /*********************
     * Add functionality *
     *********************/
    this.input.keyboard.on('keydown', function (event: KeyboardEvent) {
      if (event.keyCode === 32) { // Space starts the game
        // Set up the game
        MapHandler.instantiateInstance("testing");
        EventHandler.instantiateEventMap("testing");
        // Start the game
        this.scene.start("TerminalScene");
      }
      else if (event.key === "D") { // D goes to debug scene
        MapHandler.instantiateInstance("testing");
        EventHandler.instantiateEventMap("testing");
        this.scene.start("DebugMapScene");
      }
    }, this);
  }
}
