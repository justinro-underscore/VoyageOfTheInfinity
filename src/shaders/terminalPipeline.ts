import "phaser";

/**
 * Shader that adds a cascading line on the screen & flickers the screen
 */
export class TerminalPipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
  constructor(game: Phaser.Game) {
    let config = {
      game: game,
      renderer: game.renderer,
      fragShader: `
        precision mediump float;
        uniform float time;
        uniform float tint; // Defines by how much we should tint the screen
        uniform vec2 resolution;
        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;

        void main(void) {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          vec2 xy = outTexCoord;

          // Get py and px values
          float lineDistance = 1000.0; // Defines the distance between lines
          float vertSkewFactor = -0.01; // Defines by how much the line should be skewed vertically
          float py = mod((xy.y * resolution.y) - (time / 4.0), lineDistance);
          float px = xy.x * resolution.x * vertSkewFactor;
          py = mod(py - px, lineDistance);

          // Define line height and the height of the fade
          float height = 50.0; // How large the bright part of the line is
          float fadeHeight = 30.0; // How large the fade back to normal is

          // Calculate the factor of original color
          float minFactor = 0.8; // Defines what the base factor is
          float factor = minFactor; // Will determine how to tint the screen
          // Fade at top of line
          if (py >= 0.0 && py < fadeHeight) {
            // TODO Make fade quadratic instead of linear
            factor = ((1.0 - minFactor) * (py / fadeHeight)) + minFactor;
          }
          // Bright line
          else if (py >= fadeHeight && py < (fadeHeight + height)) {
            factor = 1.0;
          }
          // Fade at bottom of line
          else if (py >= (fadeHeight + height) && py < ((2.0 * fadeHeight) + height)) {
            // TODO Make fade quadratic instead of linear
            factor = ((1.0 - minFactor) * ((((2.0 * fadeHeight) + height) - py) / fadeHeight)) + minFactor;
          }

          // Set the color based on the factor and the tint
          float factorFactor = 1.5; // Defines how much we should scale the factor (adds a little bloom to the terminal)
          gl_FragColor = vec4((color.rgb * vec3(factorFactor * factor)) + vec3(tint), 1);
        }
      `
    };
    super(config);
  }
}
