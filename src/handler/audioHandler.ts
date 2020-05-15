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
  private static music: Map<string, Phaser.Sound.BaseSound>;
  private static sounds: Map<string, Phaser.Sound.BaseSound>;

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

    AudioHandler.music = new Map<string, Phaser.Sound.BaseSound>();
    Object.keys(audioFile.music).forEach(music => {
      AudioHandler.music.set(music, game.sound.add(music, { loop: true }));
    });
    AudioHandler.sounds = new Map<string, Phaser.Sound.BaseSound>();
    Object.keys(audioFile.sounds).forEach(sound => {
      AudioHandler.sounds.set(sound, game.sound.add(sound));
    });
  }

  /**
   * Returns an instance of the desired music
   * @param musicKey The key of the music desired
   * @returns An instance of the desired music
   */
  static getMusic(musicKey: string): Phaser.Sound.BaseSound {
    if (AudioHandler.music.has(musicKey)) {
      return AudioHandler.music.get(musicKey);
    }
    return null;
  }

  /**
   * Plays a given music
   * @param musicKey The key of the music desired
   * @returns True if play was successful, false otherwise
   */
  static playMusic(musicKey: string): boolean {
    if (AudioHandler.music.has(musicKey)) {
      AudioHandler.music.get(musicKey).play();
      return true;
    }
    return false;
  }

  /**
   * Returns an instance of the desired sound effect
   * @param soundKey The key of the sound effect desired
   * @returns An instance of the desired sound effect
   */
  static getSound(soundKey: string): Phaser.Sound.BaseSound {
    if (AudioHandler.sounds.has(soundKey)) {
      return AudioHandler.sounds.get(soundKey);
    }
    return null;
  }

  /**
   * Plays a given sound effect
   * @param musicKey The key of the sound effect desired
   * @returns True if play was successful, false otherwise
   */
  static playSound(soundKey: string): boolean {
    if (AudioHandler.sounds.has(soundKey)) {
      AudioHandler.sounds.get(soundKey).play();
      return true;
    }
    return false;
  }
}
