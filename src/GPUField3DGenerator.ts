import {
  Camera,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";

import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

export default class GPUField3DGenerator {
  scene: Scene;
  camera: Camera;
  renderTarget: WebGLRenderTarget;
  buffer: ArrayBuffer;
  constructor() {
    this.scene = new Scene();
    this.renderTarget = new WebGLRenderTarget(64, 64);
    this.buffer = new ArrayBuffer(64 * 64 * 4);
    const m = new Mesh(
      new PlaneGeometry(2, 2, 1, 1),
      new RawShaderMaterial({ vertexShader, fragmentShader })
    );
    this.camera = new OrthographicCamera();
    this.scene.add(m);
  }
  render(renderer: WebGLRenderer) {
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
    renderer.readRenderTargetPixels(
      this.renderTarget,
      0,
      0,
      64,
      64,
      this.buffer
    );
    renderer.setRenderTarget(null);
  }
  sample(x: number, y: number, z: number) {
    return x + y + z;
  }
}
