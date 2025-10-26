#ifdef GL_ES
precision mediump float;
#endif

#define TWO_PI 6.28318530718

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_rnd, u_rnd_2;

void main(){
  vec2 st = gl_FragCoord.xy/u_resolution;
  // st*= 0.5;
  
  float pct = 0.0;
  pct = distance(st, vec2(0.5 + u_rnd_2, 0.5 + u_rnd)) * 2.0;

  vec3 color = vec3(1.-pct) + u_time;
  // vec3 color = vec3(smoothstep(0., 0.5, st));
  color = color * vec3(st.yxx);
  color = color + vec3(0.5);
  gl_FragColor = vec4(color, 1.0);
  // gl_FragColor = vec4(color * vec3(0.1255, 0.4078, 0.7569), 1.0);
  
}
