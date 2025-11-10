precision mediump float;
varying vec2 vUv;

uniform sampler2D uTex;    // 텍스처 이미지
uniform vec3 uColor;       // p5에서 받은 기본 색
uniform float uTime;       // 시간

void main(){
    // 기본 셰이딩
    float shade = 0.2 + 0.8 * vUv.y;

    // 텍스처에서 색 샘플링
    vec3 texColor = texture2D(uTex, vUv).rgb;

    // 시간 기반 색 변조
    vec3 modColor = vec3(0.5 + 0.5 * sin(uTime),
                         0.5 + 0.5 * cos(vUv.x * 3.14 + uTime),
                         0.8);

    // 최종 색 계산
    vec3 finalColor = shade * texColor * modColor;

    gl_FragColor = vec4(finalColor, 1.0);
}