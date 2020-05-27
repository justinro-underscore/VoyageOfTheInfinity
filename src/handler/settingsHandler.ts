import { AudioHandler } from "./audioHandler";
import { ShaderHandler } from "./shaderHandler";

/**
 * Defines how a setting is implemented
 */
export interface SettingInterface {
  options: string[]; // The potential options for the setting
  defaultVal: number; // The default value (index of options array) of the setting
  loop: boolean; // If true, when exceeded maximum value, loop back to 0, and vice versa
  setVal: (val: number) => boolean; // Defines the function that sets the value
  getVal: () => number; // Defines the function that retrieves the value
}

// Defines the list of volume options
const VOLUME_OPTIONS = [
  "..........",
  "|.........",
  "||........",
  "|||.......",
  "||||......",
  "|||||.....",
  "||||||....",
  "|||||||...",
  "||||||||..",
  "|||||||||.",
  "||||||||||"
]

/**
 * Handles all adjustment of settings for the game
 */
export class SettingsHandler {
  static settings: Map<string, SettingInterface>; // Defines all settings

  /**
   * Instantiates all settings and sets their values to the default
   */
  static instantiateSettings() {
    SettingsHandler.settings = new Map<string, SettingInterface>([
      ["Master Volume", {
        options: VOLUME_OPTIONS,
        defaultVal: 5,
        loop: false,
        setVal: AudioHandler.setMasterAudioVolume,
        getVal: () => AudioHandler.masterVolume
      }],
      ["Music Volume", {
        options: VOLUME_OPTIONS,
        defaultVal: 5,
        loop: false,
        setVal: AudioHandler.setMusicVolume,
        getVal: () => AudioHandler.musicVolume
      }],
      ["Sound Volume", {
        options: VOLUME_OPTIONS,
        defaultVal: 5,
        loop: false,
        setVal: AudioHandler.setSoundVolume,
        getVal: () => AudioHandler.soundVolume
      }],
      ["Screen Flicker", {
        options: ["Off", "On"],
        defaultVal: 1,
        loop: true,
        setVal: (val: number) => {
          ShaderHandler.terminalScreenFlicker = (val === 1);
          return true;
        },
        getVal: () => (ShaderHandler.terminalScreenFlicker ? 1 : 0)
      }],
    ]);

    // Reset all values back to their default setting
    SettingsHandler.settings.forEach(setting => {
      setting.setVal(setting.defaultVal);
    });
  }

  // TODO Add serialization of settings and save in cookies
}
