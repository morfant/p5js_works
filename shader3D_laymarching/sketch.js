let sh;

function preload() {
    // 경로는 sketch.js가 있는 폴더 기준 상대경로
    sh = loadShader('shader.vert', 'shader.frag');
}

function setup() {
    createCanvas(800, 600, WEBGL);
    noStroke();
}

function draw() {
    shader(sh);
    sh.setUniform('uTime', millis() / 1000.0);
    sh.setUniform('uRes', [width, height]);

    // 풀스크린 사각형에 프래그먼트 셰이더 적용
    // (좌표는 웹지엘 기준으로 직접 중앙 배치)
    rect(-width / 2, -height / 2, width, height);
}