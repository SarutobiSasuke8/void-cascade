// VOID CASCADE — WebGL post-processing pipeline
// Takes a 2D canvas as input, returns it bloomed, aberrated and vignetted.
// Zero dependencies. Falls back to a plain blit if WebGL is unavailable.
//
// Classic script, not an ES module, so `play/index.html` still runs when opened
// directly off the filesystem. Exposes window.createPostFX.
//
// Bloom uses a downsample/upsample mip pyramid (the approach from Jimenez's
// "Next Generation Post Processing in Call of Duty: Advanced Warfare") rather
// than a couple of fixed-size gaussian passes. This matters a lot here:
//
//  - Radius. A blur at half and quarter res reaches roughly 16px. That is not
//    perceptible as glow. Each extra mip level doubles the reach, so a 6-level
//    pyramid covers hundreds of pixels and actually reads as light.
//  - Thin geometry. This game is almost entirely 1-2px strokes. Sampling the
//    full-res scene directly on a half-res grid point-samples those strokes and
//    throws most of their energy away, so the ship and bullets barely glowed.
//    The 13-tap downsample below is area-weighted and preserves them.
(function (global) {
'use strict';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Prefilter: soft-knee bright pass fused into a 13-tap area downsample, so
// thin bright strokes survive the trip to half resolution.
const FRAG_PREFILTER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uKnee;

vec3 prefilter(vec3 c) {
  float br = max(max(c.r, c.g), c.b);
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 0.0001);
  float contrib = max(soft, br - uThreshold) / max(br, 0.0001);
  return c * contrib;
}

void main() {
  vec2 t = uTexel;
  vec3 a = texture2D(uTex, vUv + t * vec2(-2.0, -2.0)).rgb;
  vec3 b = texture2D(uTex, vUv + t * vec2( 0.0, -2.0)).rgb;
  vec3 c = texture2D(uTex, vUv + t * vec2( 2.0, -2.0)).rgb;
  vec3 d = texture2D(uTex, vUv + t * vec2(-1.0, -1.0)).rgb;
  vec3 e = texture2D(uTex, vUv + t * vec2( 1.0, -1.0)).rgb;
  vec3 f = texture2D(uTex, vUv + t * vec2(-2.0,  0.0)).rgb;
  vec3 g = texture2D(uTex, vUv).rgb;
  vec3 h = texture2D(uTex, vUv + t * vec2( 2.0,  0.0)).rgb;
  vec3 i = texture2D(uTex, vUv + t * vec2(-1.0,  1.0)).rgb;
  vec3 j = texture2D(uTex, vUv + t * vec2( 1.0,  1.0)).rgb;
  vec3 k = texture2D(uTex, vUv + t * vec2(-2.0,  2.0)).rgb;
  vec3 l = texture2D(uTex, vUv + t * vec2( 0.0,  2.0)).rgb;
  vec3 m = texture2D(uTex, vUv + t * vec2( 2.0,  2.0)).rgb;

  // Threshold each group before averaging. Thresholding the average instead
  // would let a single bright stroke be diluted below the cut by its dark
  // neighbours and vanish entirely.
  vec3 sum = (prefilter(d) + prefilter(e) + prefilter(i) + prefilter(j)) * 0.125;
  sum += (prefilter(a) + prefilter(c) + prefilter(k) + prefilter(m)) * 0.03125;
  sum += (prefilter(b) + prefilter(f) + prefilter(h) + prefilter(l)) * 0.0625;
  sum += prefilter(g) * 0.125;
  gl_FragColor = vec4(sum, 1.0);
}`;

// 13-tap area downsample, weights summing to 1.
const FRAG_DOWNSAMPLE = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
void main() {
  vec2 t = uTexel;
  vec3 a = texture2D(uTex, vUv + t * vec2(-2.0, -2.0)).rgb;
  vec3 b = texture2D(uTex, vUv + t * vec2( 0.0, -2.0)).rgb;
  vec3 c = texture2D(uTex, vUv + t * vec2( 2.0, -2.0)).rgb;
  vec3 d = texture2D(uTex, vUv + t * vec2(-1.0, -1.0)).rgb;
  vec3 e = texture2D(uTex, vUv + t * vec2( 1.0, -1.0)).rgb;
  vec3 f = texture2D(uTex, vUv + t * vec2(-2.0,  0.0)).rgb;
  vec3 g = texture2D(uTex, vUv).rgb;
  vec3 h = texture2D(uTex, vUv + t * vec2( 2.0,  0.0)).rgb;
  vec3 i = texture2D(uTex, vUv + t * vec2(-1.0,  1.0)).rgb;
  vec3 j = texture2D(uTex, vUv + t * vec2( 1.0,  1.0)).rgb;
  vec3 k = texture2D(uTex, vUv + t * vec2(-2.0,  2.0)).rgb;
  vec3 l = texture2D(uTex, vUv + t * vec2( 0.0,  2.0)).rgb;
  vec3 m = texture2D(uTex, vUv + t * vec2( 2.0,  2.0)).rgb;
  vec3 sum = (d + e + i + j) * 0.125;
  sum += (a + c + k + m) * 0.03125;
  sum += (b + f + h + l) * 0.0625;
  sum += g * 0.125;
  gl_FragColor = vec4(sum, 1.0);
}`;

// 9-tap tent upsample. Written with additive blending so each level's result
// accumulates onto the level above, building a wide multi-octave falloff.
const FRAG_UPSAMPLE = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uRadius;
void main() {
  vec2 o = uTexel * uRadius;
  vec3 s = texture2D(uTex, vUv + vec2(-o.x,  o.y)).rgb;
  s += texture2D(uTex, vUv + vec2( 0.0,  o.y)).rgb * 2.0;
  s += texture2D(uTex, vUv + vec2( o.x,  o.y)).rgb;
  s += texture2D(uTex, vUv + vec2(-o.x,  0.0)).rgb * 2.0;
  s += texture2D(uTex, vUv).rgb * 4.0;
  s += texture2D(uTex, vUv + vec2( o.x,  0.0)).rgb * 2.0;
  s += texture2D(uTex, vUv + vec2(-o.x, -o.y)).rgb;
  s += texture2D(uTex, vUv + vec2( 0.0, -o.y)).rgb * 2.0;
  s += texture2D(uTex, vUv + vec2( o.x, -o.y)).rgb;
  gl_FragColor = vec4(s * 0.0625, 1.0);
}`;

const FRAG_COMPOSITE = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomIntensity;
uniform float uAberration;
uniform float uVignette;
uniform float uFlash;
uniform float uKneeStart;

void main() {
  vec2 centred = vUv - 0.5;
  float dist = length(centred);

  float ab = uAberration * dist * dist;
  vec2 dir = dist > 0.0001 ? centred / dist : vec2(0.0);
  float r = texture2D(uScene, vUv - dir * ab).r;
  float g = texture2D(uScene, vUv).g;
  float b = texture2D(uScene, vUv + dir * ab).b;
  vec3 scene = vec3(r, g, b);

  vec3 col = scene + texture2D(uBloom, vUv).rgb * uBloomIntensity;

  float vig = 1.0 - smoothstep(0.45, 1.15, dist * 1.6) * uVignette;
  col *= vig;
  col += vec3(uFlash);

  // Soft shoulder that is EXACTLY identity below uKneeStart. An earlier build
  // used extended Reinhard here, which compresses the whole range and measured
  // 255 -> 172: it dimmed the entire game by a third and swamped the bloom it
  // was meant to serve. Only overshoot above the knee is touched now.
  vec3 lo = min(col, vec3(uKneeStart));
  vec3 hi = max(col - vec3(uKneeStart), vec3(0.0));
  float span = 1.0 - uKneeStart;
  col = lo + span * (vec3(1.0) - exp(-hi / span));

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error('Shader compile failed: ' + gl.getShaderInfoLog(sh));
  }
  return sh;
}

function program(gl, fragSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error('Program link failed: ' + gl.getProgramInfoLog(p));
  }
  const uniforms = {};
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const name = gl.getActiveUniform(p, i).name;
    uniforms[name] = gl.getUniformLocation(p, name);
  }
  return { p, u: uniforms };
}

function createPostFX(displayCanvas, sourceCanvas) {
  const gl = displayCanvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false,
    stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance'
  });

  function fallback(reason) {
    if (reason) console.warn('[postfx] ' + reason + ' — running without bloom.');
    const ctx2d = displayCanvas.getContext('2d');
    return {
      supported: false,
      reason: reason || 'WebGL unavailable',
      levels: 0,
      resize() {},
      render() { if (ctx2d) ctx2d.drawImage(sourceCanvas, 0, 0); }
    };
  }

  if (!gl) return fallback('WebGL context could not be created');

  let progPrefilter, progDown, progUp, progComposite;
  try {
    progPrefilter = program(gl, FRAG_PREFILTER);
    progDown = program(gl, FRAG_DOWNSAMPLE);
    progUp = program(gl, FRAG_UPSAMPLE);
    progComposite = program(gl, FRAG_COMPOSITE);
  } catch (err) {
    return fallback('Shader setup failed: ' + err.message);
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  function makeFBO(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }

  const sceneTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, sceneTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const MAX_LEVELS = 6;
  let mips = [];

  function resize(w, h) {
    mips.forEach(m => { gl.deleteFramebuffer(m.fb); gl.deleteTexture(m.tex); });
    mips = [];
    let mw = Math.max(1, w >> 1), mh = Math.max(1, h >> 1);
    for (let i = 0; i < MAX_LEVELS; i++) {
      mips.push(makeFBO(mw, mh));
      // Stop before a level collapses to a sliver; below ~8px the tent filter
      // starts sampling mostly clamped edge texels and the bloom skews.
      if (mw <= 8 || mh <= 8) break;
      mw = Math.max(1, mw >> 1);
      mh = Math.max(1, mh >> 1);
    }
  }

  function bindQuad() {
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  function pass(target, prog, setup) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, target ? target.w : displayCanvas.width, target ? target.h : displayCanvas.height);
    gl.useProgram(prog.p);
    setup(prog.u);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function render(opts) {
    const o = opts || {};
    if (!mips.length) return;

    bindQuad();
    gl.disable(gl.BLEND);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    // Bright pass straight into mip 0 at half res.
    pass(mips[0], progPrefilter, u => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.uniform1i(u.uTex, 0);
      gl.uniform2f(u.uTexel, 1 / displayCanvas.width, 1 / displayCanvas.height);
      const threshold = o.threshold ?? 0.40;
      // The soft knee spans [threshold - knee, threshold + knee]. If knee is
      // allowed to exceed threshold that lower edge goes negative and NOTHING
      // is fully excluded: the near-black background leaks into the bloom
      // buffer and gets smeared over the whole screen, washing the image out.
      // Measured at threshold 0.28 / knee 0.35, background [5,1,10] came back
      // as [15,1,29] with no light source anywhere on screen.
      const knee = Math.min(o.knee ?? 0.15, threshold * 0.9);
      gl.uniform1f(u.uThreshold, threshold);
      gl.uniform1f(u.uKnee, knee);
    });

    // Down the pyramid.
    for (let i = 1; i < mips.length; i++) {
      const src = mips[i - 1];
      pass(mips[i], progDown, u => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform1i(u.uTex, 0);
        gl.uniform2f(u.uTexel, 1 / src.w, 1 / src.h);
      });
    }

    // Back up, adding each level into the one above. Mip 0 ends up holding the
    // sum of every octave, which is what gives the glow its long tail.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    const radius = o.radius ?? 1.0;
    for (let i = mips.length - 1; i > 0; i--) {
      const src = mips[i];
      pass(mips[i - 1], progUp, u => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform1i(u.uTex, 0);
        gl.uniform2f(u.uTexel, 1 / src.w, 1 / src.h);
        gl.uniform1f(u.uRadius, radius);
      });
    }
    gl.disable(gl.BLEND);

    pass(null, progComposite, u => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.uniform1i(u.uScene, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mips[0].tex);
      gl.uniform1i(u.uBloom, 1);
      gl.uniform1f(u.uBloomIntensity, o.bloomIntensity ?? 1.0);
      gl.uniform1f(u.uAberration, o.aberration ?? 0.005);
      gl.uniform1f(u.uVignette, o.vignette ?? 0.5);
      gl.uniform1f(u.uFlash, o.flash ?? 0);
      gl.uniform1f(u.uKneeStart, o.kneeStart ?? 0.9);
    });
  }

  return {
    supported: true,
    reason: null,
    get levels() { return mips.length; },
    resize,
    render
  };
}

global.createPostFX = createPostFX;

})(window);
