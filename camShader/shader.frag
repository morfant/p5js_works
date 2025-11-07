precision mediump float;

uniform sampler2D tex;
uniform vec2 resolution; // 오프스크린 버퍼의 픽셀 크기
uniform float cell;      // 셀 크기(픽셀)
varying vec2 vUV;

void main(){
  // 비디오 Y축 뒤집기
  vec2 uv = vec2(vUV.x, 1.0 - vUV.y);

  // UV(0..1) -> 픽셀 좌표
  vec2 fragPx = uv * resolution;

  // 모자이크 셀 중심 샘플링
  vec2 cellId   = floor(fragPx / cell);
  vec2 centerPx = (cellId + 0.5) * cell;
  vec2 sampleUV = centerPx / resolution;

  vec3 c = texture2D(tex, sampleUV).rgb;
  gl_FragColor = vec4(c, 1.0);
}