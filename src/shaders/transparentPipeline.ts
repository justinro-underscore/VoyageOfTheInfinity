import "phaser";

export class TransparentPipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
  constructor(game: Phaser.Game) {
    let config = {
      game: game,
      renderer: game.renderer,
      fragShader: `
        precision mediump float;
        uniform vec2      resolution;
        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;

        void main(void) {
          vec4 color = texture2D(uMainSampler, outTexCoord);

          if (color.g > 0.5) {
            gl_FragColor = color;
          }
          else {
            gl_FragColor = vec4(0, 0, 0, 0);
          }
        }
      `
    };
    super(config);
  }
}
