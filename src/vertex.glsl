precision highp float;

attribute vec4 position;
varying vec2 vUv;

void main() {
  gl_Position = vec4(position.xyz, 1.0);
  vUv = position.xy;
}
