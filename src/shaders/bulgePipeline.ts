import "phaser";

/**
 * Does not work
 */
export class BulgePipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
  constructor(game: Phaser.Game) {
    let config = {
      game: game,
      renderer: game.renderer,
      fragShader: `
        precision mediump float;
        const float       u_distortion = 10.0;
        uniform vec2      resolution;
        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;

        void main(void) {
          vec2 xy = outTexCoord;
          vec2 ndc_pos = xy * resolution;
          vec2 testVec = ndc_pos.xy / max(abs(ndc_pos.x), abs(ndc_pos.y));
          float len = max(1.0, length(testVec));
          ndc_pos *= mix(1.0, mix(1.0, len, max(abs(ndc_pos.x), abs(ndc_pos.y))), u_distortion);
          vec2 texCoord = vec2(ndc_pos.s, -ndc_pos.t) * 0.5 + 0.5;

          vec4 color = texture2D(uMainSampler, texCoord);
          gl_FragColor = color;
        }
      `
    };
    super(config);
  }
}
