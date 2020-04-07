import "phaser";

export class BlurPipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
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
          vec2 xy = outTexCoord * resolution;

          vec4 outColor = color;

          float offset = 1.0;
          vec2 texCoordLeft = vec2((xy.x - offset), xy.y) / resolution;
          if (texCoordLeft.x < 0.0) {
            texCoordLeft.x += 1.0;
          }
          vec4 colorLeft = texture2D(uMainSampler, texCoordLeft);

          vec2 texCoordRight = vec2((xy.x + offset), xy.y) / resolution;
          if (texCoordRight.x > 1.0) {
            texCoordRight.x -= 1.0;
          }
          vec4 colorRight = texture2D(uMainSampler, texCoordRight);

          outColor = (outColor / vec4(2)) + (colorLeft / vec4(4)) + (colorRight / vec4(4));

          gl_FragColor = outColor;
        }
      `
    };
    super(config);
  }
}
