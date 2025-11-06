// wavyrect_gl1.frag - WebGL1/GLSL ES 1.00
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;

uniform vec2 u_resolution;
uniform float u_time;
uniform int u_count;
uniform vec4 u_rects[8];
uniform float u_amp[8];
uniform float u_freq[8];
uniform float u_falloff[8];

float hash(vec2 p){
  p = fract(p*0.3183099 + vec2(0.1,0.7));
  p *= 17.0;
  return fract(p.x*p.y*(p.x+p.y));
}
float valueNoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0));
  float d = hash(i+vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

float boxSDF(vec2 p, vec4 r){
  vec2 c = vec2(r.x + r.z*0.5, r.y + r.w*0.5);
  vec2 d = abs(p - c) - 0.5*vec2(r.z, r.w);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main(){
  vec2 p = gl_FragCoord.xy; // 화면 픽셀 좌표 사용
  vec3 col = vec3(0.07);

  for(int i=0; i<8; i++){
    if(i >= u_count) break;
    vec4 r = u_rects[i];
    float d = boxSDF(p, r);
    float n = valueNoise(p * (u_freq[i]) * 0.005 + vec2(0.0, u_time*0.8));
    n = n*2.0 - 1.0;
    float inward = max(0.0, -n) * u_amp[i];
    float d2 = d - inward;
    float thickness = 1.2 + 2.0*(1.0 - u_falloff[i]);
    float a = smoothstep(0.9*thickness, 0.0, abs(d2));
    col += vec3(a);
  }

  gl_FragColor = vec4(col, 1.0);
}
