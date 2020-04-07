import "phaser";

export class LinesPipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
  constructor(game: Phaser.Game) {
    let config = {
      game: game,
      renderer: game.renderer,
      fragShader: `
        precision mediump float;
        uniform float     time;
        uniform vec2      resolution;
        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;

        void main(void) {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          vec2 xy = outTexCoord;
          float divisor = 10.0;
          float py = mod((xy.y * resolution.y) + (time / 100.0), divisor);

          vec4 outColor = vec4(color.rgb / vec3(3.0 / 2.0), 1);
          if (py < 1.0) {
            outColor.r = color.r;
          }
          else if (py > (divisor - 1.0)) {
            outColor.b = color.b;
          }
          else {
            outColor.g = color.g;
          }

          gl_FragColor = outColor;
        }
      `
    };
    super(config);
  }
}
