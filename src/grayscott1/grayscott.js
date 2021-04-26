import * as THREE from "three";
/*
 * Gray-Scott
 *
 * A solver of the Gray-Scott model of reaction diffusion.
 *
 * ©2012 pmneila.
 * p.mneila at upm.es
 */

// Canvas.
var canvas;
var canvasQ;
var canvasWidth;
var canvasHeight;

var mMouseX, mMouseY;
var mMouseDown = false;

var mRenderer;
var mScene;
var mCamera;
var mUniforms;
var mColors;
var mColorsNeedUpdate = true;
var mLastTime = 0;

var mTexture1, mTexture2;
var mGSMaterial, mScreenMaterial;
var mScreenQuad;

var mToggled = false;

var mMinusOnes = new THREE.Vector2(-1, -1);

// Some presets.
var presets = [
  {
    // Default
    //feed: 0.018,
    //kill: 0.051
    feed: 0.037,
    kill: 0.06,
  },
  {
    // Solitons
    feed: 0.03,
    kill: 0.062,
  },
  {
    // Pulsating solitons
    feed: 0.025,
    kill: 0.06,
  },
  {
    // Worms.
    feed: 0.078,
    kill: 0.061,
  },
  {
    // Mazes
    feed: 0.029,
    kill: 0.057,
  },
  {
    // Holes
    feed: 0.039,
    kill: 0.058,
  },
  {
    // Chaos
    feed: 0.026,
    kill: 0.051,
  },
  {
    // Chaos and holes (by clem)
    feed: 0.034,
    kill: 0.056,
  },
  {
    // Moving spots.
    feed: 0.014,
    kill: 0.054,
  },
  {
    // Spots and loops.
    feed: 0.018,
    kill: 0.051,
  },
  {
    // Waves
    feed: 0.014,
    kill: 0.045,
  },
  {
    // The U-Skate World
    feed: 0.062,
    kill: 0.06093,
  },
];

// Configuration.
var feed = presets[0].feed;
var kill = presets[0].kill;

export const grayScott = function (canvas) {
  canvas.onmousedown = onMouseDown;
  canvas.onmouseup = onMouseUp;
  canvas.onmousemove = onMouseMove;

  mRenderer = new THREE.WebGLRenderer({
    canvas: canvas,
    preserveDrawingBuffer: true,
  });

  mScene = new THREE.Scene();
  mCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
  mCamera.position.z = 100;
  mScene.add(mCamera);

  mUniforms = {
    screenWidth: { type: "f", value: undefined },
    screenHeight: { type: "f", value: undefined },
    tSource: { type: "t", value: undefined },
    delta: { type: "f", value: 1.0 },
    feed: { type: "f", value: feed },
    kill: { type: "f", value: kill },
    brush: { type: "v2", value: new THREE.Vector2(-10, -10) },
    color1: { type: "v4", value: new THREE.Vector4(0, 0, 0.0, 0) },
    color2: { type: "v4", value: new THREE.Vector4(0, 1, 0, 0.2) },
    color3: { type: "v4", value: new THREE.Vector4(1, 1, 0, 0.21) },
    color4: { type: "v4", value: new THREE.Vector4(1, 0, 0, 0.4) },
    color5: { type: "v4", value: new THREE.Vector4(1, 1, 1, 0.6) },
  };
  mColors = [
    mUniforms.color1,
    mUniforms.color2,
    mUniforms.color3,
    mUniforms.color4,
    mUniforms.color5,
  ];

  mGSMaterial = new THREE.ShaderMaterial({
    uniforms: mUniforms,
    vertexShader: document.getElementById("standardVertexShader").textContent,
    fragmentShader: document.getElementById("gsFragmentShader").textContent,
  });
  mScreenMaterial = new THREE.ShaderMaterial({
    uniforms: mUniforms,
    vertexShader: document.getElementById("standardVertexShader").textContent,
    fragmentShader: document.getElementById("screenFragmentShader").textContent,
  });

  var plane = new THREE.PlaneGeometry(1.0, 1.0);
  mScreenQuad = new THREE.Mesh(plane, mScreenMaterial);
  mScene.add(mScreenQuad);

  mColorsNeedUpdate = true;

  // resize(canvas.clientWidth, canvas.clientHeight);

  render(0);
  mUniforms.brush.value = new THREE.Vector2(0.5, 0.5);
  mLastTime = new Date().getTime();
  requestAnimationFrame(render);
};

var resize = function (width, height) {
  // Set the new shape of canvas.
  canvasQ.width(width);
  canvasQ.height(height);

  // Get the real size of canvas.
  canvasWidth = canvasQ.width();
  canvasHeight = canvasQ.height();

  mRenderer.setSize(canvasWidth, canvasHeight);

  // TODO: Possible memory leak?
  mTexture1 = new THREE.WebGLRenderTarget(canvasWidth / 2, canvasHeight / 2, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });
  mTexture2 = new THREE.WebGLRenderTarget(canvasWidth / 2, canvasHeight / 2, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });
  mTexture1.wrapS = THREE.RepeatWrapping;
  mTexture1.wrapT = THREE.RepeatWrapping;
  mTexture2.wrapS = THREE.RepeatWrapping;
  mTexture2.wrapT = THREE.RepeatWrapping;

  mUniforms.screenWidth.value = canvasWidth / 2;
  mUniforms.screenHeight.value = canvasHeight / 2;
};

var render = function (time) {
  var dt = (time - mLastTime) / 20.0;
  if (dt > 0.8 || dt <= 0) dt = 0.8;
  mLastTime = time;

  mScreenQuad.material = mGSMaterial;
  mUniforms.delta.value = dt;
  mUniforms.feed.value = feed;
  mUniforms.kill.value = kill;

  for (var i = 0; i < 8; ++i) {
    if (!mToggled) {
      mUniforms.tSource.value = mTexture1;
      mRenderer.render(mScene, mCamera, mTexture2, true);
      mUniforms.tSource.value = mTexture2;
    } else {
      mUniforms.tSource.value = mTexture2;
      mRenderer.render(mScene, mCamera, mTexture1, true);
      mUniforms.tSource.value = mTexture1;
    }

    mToggled = !mToggled;
    mUniforms.brush.value = mMinusOnes;
  }

  // if (mColorsNeedUpdate) updateUniformsColors();

  mScreenQuad.material = mScreenMaterial;
  mRenderer.render(mScene, mCamera);

  requestAnimationFrame(render);
};

// var updateUniformsColors = function () {
//   var values = $("#gradient").gradient("getValuesRGBS");
//   for (var i = 0; i < values.length; i++) {
//     var v = values[i];
//     mColors[i].value = new THREE.Vector4(v[0], v[1], v[2], v[3]);
//   }

//   mColorsNeedUpdate = false;
// };

var onUpdatedColor = function () {
  mColorsNeedUpdate = true;
  updateShareString();
};

var onMouseMove = function (e) {
  var ev = e ? e : window.event;

  mMouseX = ev.pageX - canvasQ.offset().left; // these offsets work with
  mMouseY = ev.pageY - canvasQ.offset().top; //  scrolled documents too

  if (mMouseDown)
    mUniforms.brush.value = new THREE.Vector2(
      mMouseX / canvasWidth,
      1 - mMouseY / canvasHeight
    );
};

var onMouseDown = function (e) {
  var ev = e ? e : window.event;
  mMouseDown = true;

  mUniforms.brush.value = new THREE.Vector2(
    mMouseX / canvasWidth,
    1 - mMouseY / canvasHeight
  );
};

var onMouseUp = function (e) {
  mMouseDown = false;
};
