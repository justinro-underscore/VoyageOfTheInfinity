import "phaser";
import gameAudioFile from "../gameinfo/audio.json";

/**
 * Defines how an optional music file configuration
 */
interface MusicFileConfigInterface {
  fileName: string; // File name of the music
  loop: boolean; // If true, loop the music. Otherwise, stop playing when music ends
}

/**
 * Defines how an audio file should be set up
 */
interface AudioFileInterface {
  music: {
    [musicFile: string]: string | MusicFileConfigInterface; // List of music file keys with their repective file name or config
  };
  sounds: {
    [soundFile: string]: string | string[]; // List of sound file keys with their respective file name(s)
  };
}

/**
 * Handles all sound creation and playing
 */
export class AudioHandler {
  private static _masterVolume: number; // The overall volume as an integer out of 10
  private static _musicVolume: number; // The volume of the music as an integer out of 10
  private static _soundVolume: number; // The volume of the sounds as an integer out of 10
  private static music: Map<string, Phaser.Sound.HTML5AudioSound>; // List of music files that can be accessed by its key
  private static sounds: Map<string, Phaser.Sound.HTML5AudioSound>; // List of sound files that can be accessed by its key

  /**
   * Loads all the audio and places it in the cache
   * Should be run in preload
   * @param scene The scene that is calling the handler
   * @param audioFile The audio file to pull from (defaults to the game audio file)
   */
  static loadAudio(scene: Phaser.Scene, audioFile: AudioFileInterface=gameAudioFile) {
    // Load all music
    Object.entries(audioFile.music).forEach(music => {
      if (typeof(music[1]) === "string") {
        scene.load.audio(music[0], `assets/audio/music/${ music[1] }`);
      }
      else {
        scene.load.audio(music[0], `assets/audio/music/${ music[1].fileName }`, { loop: music[1].loop });
      }
    });
    // Load all sound effects
    Object.entries(audioFile.sounds).forEach(sound => {
      if (typeof sound[1] === "string") {
        scene.load.audio(sound[0], `assets/audio/sounds/${ sound[1] }`);
      }
      else {
        scene.load.audio(sound[0], sound[1].map(soundName => `assets/audio/sounds/${ soundName }`));
      }
    });
  }

  /**
   * Instantiates the Audio Handler and places all sounds from the cache into their respective maps
   * @param game The game that contains the audio files in its cache
   * @param audioFile The audio file to pull from (defaults to the game audio file)
   */
  static instantiateAudio(game: Phaser.Game, audioFile: AudioFileInterface=gameAudioFile) {
    game.sound.pauseOnBlur = false;

    AudioHandler.music = new Map<string, Phaser.Sound.HTML5AudioSound>();
    Object.keys(audioFile.music).forEach(music => {
      AudioHandler.music.set(music, <Phaser.Sound.HTML5AudioSound>game.sound.add(music, { loop: true }));
    });
    AudioHandler.sounds = new Map<string, Phaser.Sound.HTML5AudioSound>();
    Object.keys(audioFile.sounds).forEach(sound => {
      AudioHandler.sounds.set(sound, <Phaser.Sound.HTML5AudioSound>game.sound.add(sound));
    });
  }

  /**
   * Returns an instance of the desired music
   * @param musicKey The key of the music desired
   * @returns An instance of the desired music
   */
  static getMusic(musicKey: string): Phaser.Sound.HTML5AudioSound {
    return AudioHandler.getAudio(true, musicKey);
  }

  /**
   * Plays a given music
   * @param musicKey The key of the music desired
   * @returns True if play was successful, false otherwise
   */
  static playMusic(musicKey: string): boolean {
    return AudioHandler.playAudio(true, musicKey);
  }

  /**
   * Returns an instance of the desired sound effect
   * @param soundKey The key of the sound effect desired
   * @returns An instance of the desired sound effect
   */
  static getSound(soundKey: string): Phaser.Sound.HTML5AudioSound {
    return AudioHandler.getAudio(false, soundKey);
  }

  /**
   * Plays a given sound effect
   * @param musicKey The key of the sound effect desired
   * @returns True if play was successful, false otherwise
   */
  static playSound(soundKey: string): boolean {
    return AudioHandler.playAudio(false, soundKey);
  }

  static get masterVolume(): number {
    return AudioHandler._masterVolume;
  }

  static get musicVolume(): number {
    return AudioHandler._musicVolume;
  }

  static get soundVolume(): number {
    return AudioHandler._soundVolume;
  }

  /**
   * Sets the overall volume of the audio
   * @param volIndex The value of the master volume out of 10
   * @returns True if index is valid, false otherwise
   */
  static setMasterAudioVolume(volIndex: number): boolean {
    let volume = volIndex / 10;
    if (AudioHandler.volumeValid(volume)) {
      AudioHandler._masterVolume = volIndex;
      AudioHandler.setAudioVolume(true, volume * (AudioHandler._musicVolume / 10));
      AudioHandler.setAudioVolume(false, volume * (AudioHandler._soundVolume / 10));
      return true;
    }
    return false
  }

  /**
   * Sets the volume of the music
   * @param volIndex The value of the music volume out of 10
   * @returns True if index is valid, false otherwise
   */
  static setMusicVolume(volIndex: number): boolean {
    let volume = volIndex / 10;
    if (AudioHandler.volumeValid(volume)) {
      AudioHandler.setAudioVolume(true, volume);
      AudioHandler._musicVolume = volIndex;
      return true;
    }
    return false;
  }

  /**
   * Sets the volume of the sound effects
   * @param volIndex The value of the sound volume out of 10
   * @returns True if index is valid, false otherwise
   */
  static setSoundVolume(volIndex: number): boolean {
    let volume = volIndex / 10;
    if (AudioHandler.volumeValid(volume)) {
      AudioHandler.setAudioVolume(false, volume);
      AudioHandler._soundVolume = volIndex;
      return true;
    }
    return false;
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Gets an audio clip from a requested key
   * @param music If true, get the music clip. Otherwise, get sound clip
   * @param key The key to the audio clip
   * @returns The audio clip, if it exists
   */
  private static getAudio(music: boolean, key: string): Phaser.Sound.HTML5AudioSound {
    let handler = (music ? AudioHandler.music : AudioHandler.sounds);
    if (handler.has(key)) {
      return handler.get(key);
    }
    return null;
  }

  /**
   * Plays an audio clip from a requested key
   * @param music If true, play the music clip. Otherwise, play sound clip
   * @param key The key to the audio clip
   * @returns True if the audio clip exists, false otherwise
   */
  private static playAudio(music: boolean, key: string): boolean {
    let handler = (music ? AudioHandler.music : AudioHandler.sounds);
    if (handler.has(key)) {
      handler.get(key).play();
      return true;
    }
    return false;
  }

  /**
   * Sets the volume of the given audio type
   * @param music If true, set music volume. Otherwise, set sound volume
   * @param volume The volume of the audio type, from 0 to 1
   */
  private static setAudioVolume(music: boolean, volume: number) {
    let handler = (music ? AudioHandler.music : AudioHandler.sounds);
    for (let audio of handler.values()) {
      audio.volume = volume;
    }
  }

  /**
   * Checks to see if the volume is valid (within a range of 0 to 1)
   * @param volume The volume value to check
   * @returns True if the volume is within the range 0 and 1
   */
  private static volumeValid(volume: number): boolean {
    if (volume < 0.0 || volume > 1.0) {
      return false;
    }
    return true;
  }
}
