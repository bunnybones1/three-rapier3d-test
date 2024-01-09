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
import fragmentShader from "./flashlightFragment.glsl";

export default class GPUFlashlightTextureGenerator {
  scene: Scene;
  camera: Camera;
  renderTarget: WebGLRenderTarget;
  constructor() {
    this.scene = new Scene();
    this.renderTarget = new WebGLRenderTarget(256, 256);
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
    renderer.setRenderTarget(null);
  }
  sample(x: number, y: number, z: number) {
    return x + y + z;
  }
}
