precision highp float;

varying vec2 vUv;

void main() {
    float len = length(vUv);
    float vi = 1.0 - (len * len);
    float v = sin(vi * 40.0) * 0.25 + vi;
    gl_FragColor = vec4(v, v, v, 1.0);
}