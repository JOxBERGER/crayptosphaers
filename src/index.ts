

import * as THREE from 'three'
import { grayScott } from "./grayscott1/grayscott"
// import { grayscott } from "./grayscott2/grayscott"
// import { ReactionDiffusion, animate } from "./grayscott2/grayScott3"
// import { OrbitControls } from '/jsm/controls/OrbitControls'
// import { grayScott } from './grayscott/grayscott'


// import { FresnelShader } from '/jsm/shaders/FresnelShader'
// import BG from "../client/assets/bg.png"

// scene.background = new THREE.Texture( 0xff0000 )


let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer, mesh: THREE.Mesh, material: THREE.MeshBasicMaterial;
const drawStartPos = new THREE.Vector2();


init();
// setupCanvasDrawing();
// animate();
// const i = grayScott


// hello()

function init() {
    const canvas = <HTMLCanvasElement>document.getElementById('scottCanvas');

    // grayScott(canvas)
}
