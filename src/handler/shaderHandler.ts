import "phaser";
import { TerminalPipeline } from "../shaders/terminalPipeline";

// The minimum amount of frames that must pass before the terminal is tinted
const TERMINAL_TINT_WAIT_TIME_MIN = 5;

/**
 * Handles all shaders in the program
 */
export class ShaderHandler {
  static shaders: Map<string, Phaser.Renderer.WebGL.WebGLPipeline>; // Keeps track of all shaders
  private static activeShader: string;
  private static terminalShaderTint: number; // For Terminal pipeline - keeps track of how long until next tint

  /**
   * Instantiates the shaders
   * @param game The game holding the shaders
   */
  static instantiateShaders(game: Phaser.Game) {
    ShaderHandler.shaders = new Map<string, Phaser.Renderer.WebGL.WebGLPipeline>();

    /*******************
     * Add the shaders *
     *******************/
    // Terminal shader
    let terminalPipeline = (<Phaser.Renderer.WebGL.WebGLRenderer>game.renderer).getPipeline("terminal");
    if (terminalPipeline === null) {
      terminalPipeline = (<Phaser.Renderer.WebGL.WebGLRenderer>game.renderer).addPipeline("terminal", new TerminalPipeline(game));
    }
    ShaderHandler.shaders.set("terminal", terminalPipeline);
    ShaderHandler.terminalShaderTint = 0;

    /************************************************
     * Set constant variables that all shaders have *
     ************************************************/
    ShaderHandler.shaders.forEach(shader => {
      shader.setFloat2("resolution", <number>game.config.width, <number>game.config.height);
    });
  }

  /**
   * Sets the shaders to render on the scene
   * TODO Add ability to choose which shaders are activated
   * @param scene The scene using the shaders
   * @param shader Which shader to use
   * @returns True if the set was successful
   */
  static setRenderToShaders(scene: Phaser.Scene, shader: string): boolean {
    if (ShaderHandler.shaders.has(shader)) {
      scene.cameras.main.setRenderToTexture(ShaderHandler.shaders.get(shader));
      ShaderHandler.activeShader = shader;
      return true;
    }
    return false;
  }

  /**
   * Updates the current shader
   * @param time The amount of time that has passed
   */
  static updateShaders(time: number) {
    if (ShaderHandler.activeShader === "terminal") {
      ShaderHandler.shaders.get("terminal").setFloat1("time", time);

      // Update terminal shader tint
      if (ShaderHandler.terminalShaderTint <= 0) {
        ShaderHandler.shaders.get("terminal").setFloat1("tint", (Math.random() - 0.5) / 50);
        ShaderHandler.terminalShaderTint = Math.floor((2 * TERMINAL_TINT_WAIT_TIME_MIN * Math.random()) + TERMINAL_TINT_WAIT_TIME_MIN);
      }
      else {
        ShaderHandler.terminalShaderTint--;
      }
    }
  }
}
