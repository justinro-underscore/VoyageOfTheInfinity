import "phaser";

/**
 * Forces the user to interact, so audio can be played
 */
export class StartGameScene extends Phaser.Scene {
  buttonRect: Phaser.GameObjects.Rectangle; // Defines the rectangle behind the text, also acts as the button
  buttonText: Phaser.GameObjects.Text; // Defines the text on the button
  startingGame: boolean; // If true, we have started loading the game

  constructor() {
    super("StartGameScene");
  }

  /**
   * Instantiates the button
   */
  create() {
    /*****************
     * Create button *
     *****************/
    this.buttonText = this.add.text(400, 300, "Click here to load game", { fontFamily: "Clacon", fontSize: 40, color: "#ffffff" });
    this.buttonText.setOrigin();

    let offset = 10; // Defines how far off the text the rectangle should be
    this.buttonRect = this.add.rectangle(400, 300, this.buttonText.width + (2 * offset), this.buttonText.height + (2 * offset), 0x00dd00);
    this.buttonRect.setDepth(-1);

    /*******************************
     * Make the button interactive *
     *******************************/
    this.buttonRect.setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.enterButtonHoverState() )
      .on("pointerout", () => this.enterButtonRestState() )
      .on("pointerdown", () => this.enterButtonActiveState() )
      .on("pointerup", () => {
        if (!this.startingGame) {
          this.enterButtonHoverState();
          this.startingGame = true;
          this.buttonRect.input.enabled = false;
          this.cameras.main.fadeOut(2000);
          this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("MainMenuScene"), this);
        }
      });

      this.startingGame = false;
  }

  /**
   * Enters the button's hover state - invert the button's colors
   */
  private enterButtonHoverState() {
    if (!this.startingGame) {
      this.buttonRect.setFillStyle(0x222222);
      this.buttonText.setColor("#00dd00");
    }
  }

  /**
   * Enters the button's rest state (when the cursor isn't over the button) - reset button's colors
   */
  private enterButtonRestState() {
    if (!this.startingGame) {
      this.buttonRect.setFillStyle(0x00dd00);
      this.buttonText.setColor("#ffffff");
    }
  }

  /**
   * Enters the button's active state (when the button has been pressed) - darken button's colors
   */
  private enterButtonActiveState() {
    if (!this.startingGame) {
      this.buttonRect.setFillStyle(0x111111);
      this.buttonText.setColor("#00bb00");
    }
  }
}
