// VOID CASCADE — WebGL post-processing pipeline
// Takes a 2D canvas as input, returns it bloomed, aberrated and vignetted.
// Zero dependencies. Falls back to a plain blit if WebGL is unavailable.
//
// Classic script, not an ES module, so `play/index.html` still runs when opened
// directly off the filesystem. Exposes window.createPostFX.
(function (global) {
'use strict';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Soft-knee bright pass. Neon art is mostly mid-bright, so a hard threshold
// either kills the glow or blooms the whole screen. The knee keeps the falloff
// gradual so thruster ribbons bloom without the background greying out.
const FRAG_BRIGHT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uThreshold;
uniform float uKnee;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  float br = max(max(c.r, c.g), c.b);
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 0.0001);
  float contrib = max(soft, br - uThreshold) / max(br, 0.0001);
  gl_FragColor = vec4(c * contrib, 1.0);
}`;

// Separable gaussian, 5 linear taps approximating a 9-tap kernel.
const FRAG_BLUR = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform vec2 uDir;
void main() {
  vec2 off = uTexel * uDir;
  vec3 sum = texture2D(uTex, vUv).rgb * 0.2270270270;
  sum += texture2D(uTex, vUv + off * 1.3846153846).rgb * 0.3162162162;
  sum += texture2D(uTex, vUv - off * 1.3846153846).rgb * 0.3162162162;
  sum += texture2D(uTex, vUv + off * 3.2307692308).rgb * 0.0702702703;
  sum += texture2D(uTex, vUv - off * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(sum, 1.0);
}`;

// Final composite: scene + two bloom octaves, then chromatic aberration and
// vignette. Aberration scales with distance from centre so the middle of the
// screen stays readable during play.
const FRAG_COMPOSITE = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloomA;
uniform sampler2D uBloomB;
uniform float uBloomIntensity;
uniform float uAberration;
uniform float uVignette;
uniform float uFlash;
uniform float uWhite;

void main() {
  vec2 centred = vUv - 0.5;
  float dist = length(centred);

  float ab = uAberration * dist * dist;
  vec2 dir = dist > 0.0001 ? centred / dist : vec2(0.0);
  float r = texture2D(uScene, vUv - dir * ab).r;
  float g = texture2D(uScene, vUv).g;
  float b = texture2D(uScene, vUv + dir * ab).b;
  vec3 scene = vec3(r, g, b);

  vec3 bloom = texture2D(uBloomA, vUv).rgb * 0.65
             + texture2D(uBloomB, vUv).rgb * 1.05;

  vec3 col = scene + bloom * uBloomIntensity;

  float vig = 1.0 - smoothstep(0.45, 1.15, dist * 1.6) * uVignette;
  col *= vig;

  col += vec3(uFlash);

  // Extended Reinhard with a white point. Chosen over a plain x/(x+k) rolloff
  // because that has a slope well above 1.0 at black and visibly lifts the
  // background out of near-black, which kills the contrast the neon relies on.
  // This form has slope exactly 1.0 at zero, so shadows are untouched, while
  // uWhite and above still rolls off to 1.0 instead of clipping hard.
  float wp = uWhite * uWhite;
  col = col * (1.0 + col / wp) / (1.0 + col);

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

  // No WebGL means no bloom, but the game must still be playable.
  if (!gl) {
    const ctx2d = displayCanvas.getContext('2d');
    return {
      supported: false,
      resize() {},
      render() {
        ctx2d.drawImage(sourceCanvas, 0, 0);
      }
    };
  }

  let progBright, progBlur, progComposite;
  try {
    progBright = program(gl, FRAG_BRIGHT);
    progBlur = program(gl, FRAG_BLUR);
    progComposite = program(gl, FRAG_COMPOSITE);
  } catch (err) {
    console.warn('[postfx] shader setup failed, falling back to plain blit:', err);
    const ctx2d = displayCanvas.getContext('2d');
    return { supported: false, resize() {}, render() { ctx2d.drawImage(sourceCanvas, 0, 0); } };
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function makeTexture(w, h) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  }

  function makeFBO(w, h) {
    const tex = makeTexture(w, h);
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

  // Two bloom octaves: a tight one for edge glow, a wide one for atmosphere.
  let half = null, halfPing = null, quarter = null, quarterPing = null;

  function resize(w, h) {
    const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);
    const qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2);
    [half, halfPing, quarter, quarterPing].forEach(f => {
      if (f) { gl.deleteFramebuffer(f.fb); gl.deleteTexture(f.tex); }
    });
    half = makeFBO(hw, hh);
    halfPing = makeFBO(hw, hh);
    quarter = makeFBO(qw, qh);
    quarterPing = makeFBO(qw, qh);
  }

  function pass(target, prog, setup) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, target ? target.w : displayCanvas.width, target ? target.h : displayCanvas.height);
    gl.useProgram(prog.p);
    setup(prog.u);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function blur(src, tmp, dst) {
    pass(tmp, progBlur, u => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(u.uTex, 0);
      gl.uniform2f(u.uTexel, 1 / src.w, 1 / src.h);
      gl.uniform2f(u.uDir, 1, 0);
    });
    pass(dst, progBlur, u => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tmp.tex);
      gl.uniform1i(u.uTex, 0);
      gl.uniform2f(u.uTexel, 1 / tmp.w, 1 / tmp.h);
      gl.uniform2f(u.uDir, 0, 1);
    });
  }

  function render(opts) {
    const o = opts || {};
    const intensity = o.bloomIntensity ?? 1.35;
    const threshold = o.threshold ?? 0.32;

    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    pass(half, progBright, u => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.uniform1i(u.uTex, 0);
      gl.uniform1f(u.uThreshold, threshold);
      gl.uniform1f(u.uKnee, 0.28);
    });

    blur(half, halfPing, half);

    // Downsample the already-blurred half into quarter, then blur again for
    // the wide octave. Cheaper than blurring full-res twice.
    pass(quarter, progBlur, u => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, half.tex);
      gl.uniform1i(u.uTex, 0);
      gl.uniform2f(u.uTexel, 1 / half.w, 1 / half.h);
      gl.uniform2f(u.uDir, 1, 0);
    });
    blur(quarter, quarterPing, quarter);

    pass(null, progComposite, u => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.uniform1i(u.uScene, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, half.tex);
      gl.uniform1i(u.uBloomA, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, quarter.tex);
      gl.uniform1i(u.uBloomB, 2);
      gl.uniform1f(u.uBloomIntensity, intensity);
      gl.uniform1f(u.uAberration, o.aberration ?? 0.006);
      gl.uniform1f(u.uVignette, o.vignette ?? 0.55);
      gl.uniform1f(u.uFlash, o.flash ?? 0);
      gl.uniform1f(u.uWhite, o.white ?? 1.7);
    });
  }

  return { supported: true, resize, render };
}

global.createPostFX = createPostFX;

})(window);
