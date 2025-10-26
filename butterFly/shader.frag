precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_rnd;

varying vec2 vTexCoord;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vTexCoord;
  vec2 center = vec2(0.5);
  float dist = distance(uv, center);
  // float freq = 10.0;

  // Simple color animation using time and mouse position
  float angle = atan(uv.y - center.y, uv.x - center.x);
  float freq = (0.5 + 0.5 * sin(sin(angle))) * 2.0 * u_rnd;
  // angle = 0;
  vec3 color = vec3(
    0.5 + 0.5 * cos(freq * u_time + dist * 2.0),
    0.5 + 0.5 * cos(freq * u_time),
    0.5 + 0.5 * cos(freq * u_time )
    // 0.0,0.0
    // 0.5 + 0.5 * sin(u_time + dist * 10.0),
    // 0.5 + 0.5 * cos(u_time + (u_mouse.x / u_resolution.x) * 6.2831)
  );

  gl_FragColor = vec4(color, 1.0);
}
