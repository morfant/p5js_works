precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vUv;

void main(){
    vUv=aTexCoord;
    vec3 pos=aPosition;
    
    // 간단한 파형(정점 변형)
    float amp=12.;
    pos.z+=sin(pos.x*40.+uTime)*amp*0.5;
    pos.z+=cos(pos.y*10.+uTime*1.2)*amp;
    
    gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(pos,1.);
}