import "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext.js";
import { ShaderHandler } from "../handler/shaderHandler";
import { SettingsHandler } from "../handler/settingsHandler";
import { InputHandler, KeyCodeCateogry } from "../handler/inputHandler";

/**
 * Defines the initialization data for this scene
 */
interface SettingsSceneInitData {
  sceneToReturnTo: string; // Defines what scene to return to on exit
  initData?: any; // Defines any data that should be sent to that scene
}

const SETTING_TEXT_PADDING = 20; // Defines how much to pad the setting text

const HIGHLIGHT_COLOR = "#ffffff"; // The color of the currently selected setting

/**
 * Defines the scene that is used to adjust game settings
 */
export class SettingsScene extends Phaser.Scene {
  initData: SettingsSceneInitData; // The initialization data, @see SettingsSceneInitData

  settings: Array<string>; // A list of the keys of settings
  currSetting: number; // The index of the currently selected setting
  settingsText: BBCodeText; // The text showing the settings
  escapeText: Phaser.GameObjects.Text; // Text that explains how to exit the settings menu
  escapeBox: Phaser.GameObjects.Rectangle; // Box that surrounds the escape text

  /**
   * Determines what scene we should return to and what data should be passed to that scene
   * @param data The data containing the scene info
   */
  init(data: any) {
    if (Object.keys(data).includes("terminalData")) {
      this.initData = {
        sceneToReturnTo: "TerminalScene",
        initData: data
      };
    }
    else {
      this.initData = {
        sceneToReturnTo: "MainMenuScene",
        initData: {instantiate: false}
      };
    }
  }

  constructor() {
    super("SettingsScene");
  }

  /**
   * Load background image
   */
  preload() {
    this.load.image("blackTerminalScreen", "assets/img/black-terminal-screen.png");
  }

  /**
   * Set up all game assets shown to user and adds functionality
   */
  create() {
    /*************************
     * Set up the background *
     *************************/
    let background = this.add.image(0, 0, "blackTerminalScreen");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    /************
     * Add text *
     ************/
    let optionsText = `[b]Settings[/b]
[size=12]------------------------------------------------[/size]
[size=22]${ this.genSettingText() }[/size]
`;
    this.settingsText = new BBCodeText(this, 15, 15, optionsText,
      { fontFamily: "Monospace", fontSize: "24px", color: "#77ff55" });
    this.add.existing(this.settingsText);
    this.currSetting = 0;
    this.setCurrSetting();

    /*******************
     * Add ESCAPE TEXT *
     *******************/
    const OFFSET = 20;
    const BOX_OFFSET = 5;
    this.escapeText = this.add.text(0, 0, "Esc", {
        font: "bold 24px Monospace",
        align: "left",
        color: "#77ff55"
      }
    );
    this.escapeText.setPosition(OFFSET, this.cameras.main.height - (this.escapeText.height + OFFSET));
    this.escapeBox = this.add.rectangle(this.escapeText.x - BOX_OFFSET, this.escapeText.y - BOX_OFFSET,
      this.escapeText.width + (2 * BOX_OFFSET), this.escapeText.height + (2 * BOX_OFFSET), 0x444444, 0.5);
    this.escapeBox.setOrigin(0, 0);
    this.escapeBox.setStrokeStyle(3, 0x77ff55);
    this.escapeText.text = "Esc to exit"; // Once box has been made, then set text to full statement

    /*************
     * Add input *
     *************/
    this.input.keyboard.on("keydown", (event: KeyboardEvent) => this.onKeyInput(event), this);

    /**************
     * Add shader *
     **************/
    ShaderHandler.setRenderToShaders(this, "terminal");
  }

  /**
   * Update the shaders
   * @param time The amount of time that has passed
   */
  update(time: number) {
    ShaderHandler.updateShaders(time);
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Generates the text that shows all of the settings
   * @returns The text
   */
  private genSettingText(): string {
    this.settings = new Array<string>();
    let res = "";
    SettingsHandler.settings.forEach((setting, key) => {
      this.settings.push(key);
      res += key.padEnd(SETTING_TEXT_PADDING);
      res += `< ${ setting.options[setting.getVal()] } >`;
      res += "\n";
    });
    return res;
  }

  /**
   * Sets the current setting by highlighting whatever the currently selected setting is
   */
  private setCurrSetting() {
    let key = this.settings[this.currSetting];
    this.settingsText.text = this.settingsText.text.replace(new RegExp(`\\[color=${ HIGHLIGHT_COLOR }\\](.+)\\[/color\\]`, "g"), "$1");
    this.settingsText.text = this.settingsText.text.replace(new RegExp(`(${ key }[^\n]+)`, "g"), `[color=${ HIGHLIGHT_COLOR }]$1[/color]`);
  }

  /**
   * Changes the value of the currently selected setting
   * @param left If true, decrease value of current setting. Otherwise, increase value
   */
  private changeSetting(left: boolean) {
    let key = this.settings[this.currSetting];
    let settingInfo = SettingsHandler.settings.get(key);
    let options = settingInfo.options;

    // Change the value
    let val = settingInfo.getVal();
    if (left) {
      val--;
      if (val < 0) {
        if (settingInfo.loop) {
          val = options.length - 1;
        }
        else {
          val = 0;
        }
      }
    }
    else {
      val++;
      if (val >= options.length) {
        if (settingInfo.loop) {
          val = 0;
        }
        else {
          val = options.length - 1;
        }
      }
    }

    // Set the new value
    settingInfo.setVal(val);
    this.settingsText.text = this.settingsText.text.replace(new RegExp(`(${ key }[^<]+)< .+ >`, "g"), `$1< ${ options[val] } >`);
  }

  /**
   * Defines what happens when a key is input
   * @param keyEvent The keyboard event that calls this function
   */
  private onKeyInput(keyEvent: KeyboardEvent) {
    const keyCat = InputHandler.getKeyCategory(keyEvent.keyCode);
    switch (keyCat) {
      // Change currently selected setting to the one above
      case KeyCodeCateogry.KEY_UP:
        this.currSetting--;
        if (this.currSetting < 0) {
          this.currSetting = this.settings.length - 1;
        }
        this.setCurrSetting();
        break;
      // Change currently selected setting to the one below
      case KeyCodeCateogry.KEY_DOWN:
        this.currSetting++;
        if (this.currSetting >= this.settings.length) {
          this.currSetting = 0;
        }
        this.setCurrSetting();
        break;
      // Change currently selected setting's value by decrementing
      case KeyCodeCateogry.KEY_LEFT:
        this.changeSetting(true);
        break;
      // Change currently selected setting's value by incrementing
      case KeyCodeCateogry.KEY_RIGHT:
        this.changeSetting(false);
        break;
      // Returns to the last scene
      case KeyCodeCateogry.ESCAPE:
        this.scene.start(this.initData.sceneToReturnTo, this.initData.initData);
        break;
      default:
        break;
    }
  }
}
