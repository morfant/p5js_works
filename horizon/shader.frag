#ifdef GL_ES
precision mediump float;
#endif

#define TWO_PI 6.28318530718

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_rnd;

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb(in vec3 c){
  vec3 rgb=clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),
6.)-3.)-1.,
0.,
1.);
rgb=rgb*rgb*(3.-2.*rgb);
return c.z*mix(vec3(1.),rgb,c.y);
}

float shaping(in float x,in float n){
return 1.-pow(-2.*x+2.,2.)/n;
}

float shapingSym(float x,float n){
// x = abs(x);
// return x * exp(n - x);
x=max(0.,x);// 음수일 땐 0으로 잘라냄 (ReLU)
return x*exp(n-x);// 양수 부분만 적용
}

void main(){
vec2 st=gl_FragCoord.xy/u_resolution;
vec3 color=vec3(0.);

// Use polar coordinates instead of cartesian
vec2 toCenter=vec2(.8)-st;
float angle=atan(toCenter.y,toCenter.x);
float radius=length(toCenter)*2.;

// Map the angle (-PI to PI) to the Hue (from 0 to 1)
// and the Saturation to the radius
color=hsb2rgb(vec3(
  (
    // shapingSym(smoothstep(0.,TWO_PI,angle*.3),24.480)/TWO_PI)+.5,
    shapingSym(smoothstep(0., TWO_PI, angle*.1), u_time) / TWO_PI) +(.46 - u_rnd),
  0.7,
  1.));
// float mask=step(1.,radius);
// color = mix(color, vec3(1.), mask);

gl_FragColor=vec4(color,1.);
}
