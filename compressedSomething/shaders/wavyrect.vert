// wavyrect.vert
#version 300 es
precision mediump float;
// p5 기본 attribute/uniform
in vec3 aPosition;
in vec2 aTexCoord;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
out vec2 vUv;
void main(){
  vUv = aTexCoord;           // [0,1] uv를 그대로 전달
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
