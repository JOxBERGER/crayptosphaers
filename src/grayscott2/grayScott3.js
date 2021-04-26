import * as THREE from "three";

const isIos = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);

class SwappableFrameBuffer {
  constructor(width, height, options = {}) {
    const fbo = new THREE.WebGLRenderTarget(width, height, options);

    this.frameBuffers = [fbo, fbo.clone()];
  }

  getSource() {
    return this.frameBuffers[0];
  }

  getDestination() {
    return this.frameBuffers[1];
  }

  swap() {
    this.frameBuffers.reverse();
  }
}

class GpgpuObject {
  static get passThruShader() {
    return `void main() {
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}`;
  }

  constructor(shader, uniforms = {}) {
    this.camera = GpgpuObject.createCamera();
    this.scene = new THREE.Scene();

    this.material = GpgpuObject.createMaterial(shader, uniforms);
    this.plane = GpgpuObject.createPlane(this.material);

    this.scene.add(this.plane);
  }

  initialize(renderer, target, shader, uniforms = {}) {
    const material = GpgpuObject.createMaterial(shader, uniforms);

    this.plane.material = material;
    renderer.render(this.scene, this.camera, target);

    this.plane.material = this.material;
    this.plane.material.needsUpdate = true;
    this.plane.needsUpdate = true;

    material.dispose();
  }

  render(renderer, target) {
    renderer.setT;
    renderer.render(this.scene, this.camera, target);
  }

  static createCamera() {
    const cameraSize = 2;
    const cameraSizeHalf = cameraSize * 0.5;

    const camera = new THREE.OrthographicCamera(
      -cameraSizeHalf,
      cameraSizeHalf,
      cameraSizeHalf,
      -cameraSizeHalf,
      1,
      256
    );

    camera.position.z = 128;

    return camera;
  }

  static createPlane(material) {
    const geometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);

    return new THREE.Mesh(geometry, material);
  }

  static createMaterial(shader, uniforms = {}) {
    return new THREE.ShaderMaterial({
      uniforms,
      fragmentShader: shader,
      vertexShader: GpgpuObject.passThruShader,
    });
  }
}

export class ReactionDiffusion {
  static get size() {
    return 1048;
  }

  static createPlane(rdaScreenShader) {
    return GpgpuObject.createPlane(
      new THREE.ShaderMaterial({
        fragmentShader: rdaScreenShader,
        vertexShader: GpgpuObject.passThruShader,
        uniforms: {
          rda: { value: null },
          size: { value: ReactionDiffusion.size },
        },
      })
    );
  }

  constructor(rdaStartShader, rdaShader, rdaScreenShader) {
    this.camera = GpgpuObject.createCamera();
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(ReactionDiffusion.size, ReactionDiffusion.size);

    if (!this.renderer.capabilities.floatFragmentTextures) {
      alert(
        "Sorry! Your device does not support a required extension. Desktop computers are very likely to support this extension."
      );
    }

    this.rdaStartShader = rdaStartShader;
    this.rdaShader = rdaShader;
    this.rdaScreenShader = rdaScreenShader;

    this.feedRate = 0.055;
    this.killRate = 0.062;
    this.reset();
  }

  dispose() {
    if (this.buffers) {
      this.buffers.getSource().dispose();
      this.buffers.getDestination().dispose();
    }

    if (this.rd) {
      this.rd.material.dispose();
    }

    if (this.plane) {
      this.scene.remove(this.plane);
      this.plane.material.dispose();
    }

    this.buffers = null;
    this.plane = null;
    this.rd = null;
  }

  render(delta) {
    for (let i = 0; i < 8; i++) {
      this.rd.material.uniforms.delta.value = 1;
      this.rd.material.uniforms.rda.value = this.buffers.getSource().texture;
      this.rd.render(this.renderer, this.buffers.getDestination());
      this.buffers.swap();
    }

    this.plane.material.uniforms.rda.value = this.buffers.getDestination().texture;
    this.renderer.render(this.scene, this.camera);
  }

  reset(feedRate = this.feedRate, killRate = this.killRate) {
    this.dispose();

    this.buffers = new SwappableFrameBuffer(
      ReactionDiffusion.size,
      ReactionDiffusion.size,
      {
        depthBuffer: false,
        stencilBuffer: false,
        type: isIos ? THREE.HalfFloatType : THREE.FloatType,
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
      }
    );

    this.rd = new GpgpuObject(this.rdaShader, {
      delta: { value: 0 },
      rda: { value: null },
      size: { value: ReactionDiffusion.size },
      feedRate: { value: feedRate },
      killRate: { value: killRate },
    });
    this.rd.initialize(
      this.renderer,
      this.buffers.getSource(),
      this.rdaStartShader,
      {
        size: { value: ReactionDiffusion.size },
      }
    );

    this.plane = ReactionDiffusion.createPlane(this.rdaScreenShader);
    this.scene.add(this.plane);

    if (feedRate && killRate) {
      this.feedRate = feedRate;
      this.killRate = killRate;
    }
  }
}

export const animate = (callback) => {
  let previousTime = performance.now();

  const update = (time) => {
    const delta = time - previousTime;
    previousTime = time;

    requestAnimationFrame(update);
    callback(delta);
  };

  update(performance.now());
};
