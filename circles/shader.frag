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
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  st.x *= u_resolution.x/u_resolution.y;

  vec3 color = vec3(0.0);
  float d = 0.0;

  st = st * 2. - 1.;
  // d = length(abs(st) - .3);
  d = length(abs(st) - .3 * step(10., u_rnd));
  // d = length(abs(st) - u_rnd);
  // d = length( min(abs(st)-.3, 0.) );
  // d = length( max(abs(st)-.3, 0.) );

  // gl_FragColor = vec4(vec3(fract(d*u_time*1.0)), 1.0);
  // gl_FragColor = vec4(vec3(0.1, -0.3 + step(.5, fract(d*u_rnd*1.0) ), 0.5), 1.0);
  float pos = u_time * 0.01 - 1.; // -1 ~ 1
  gl_FragColor = vec4(
    vec3(
      0.9 * step(u_rnd, 10.),
      -0.3 + fract(d* (1.0 + step(pos, st.x)) ), // mode 1
      // -0.3 + fract(smoothstep(.4, .2, d)* (1.0 + step(pos, st.x)) ), // mode 2
      0.5),
      1.0);
    // gl_FragColor = vec4(vec3( step(.3,d) ),1.0);
  // gl_FragColor = vec4(vec3( step(.3,d) * step(d, 0.4) + step(0.5, d)),1.0);
  // gl_FragColor = vec4(vec3( smoothstep(.3,.4,d)* smoothstep(.6,.5,d)) ,1.0);
}
