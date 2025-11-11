// sketch.js
let sh;
let useOrtho = false;
let cam;
let tex;

function preload() {
    tex = loadImage('for_loop_quadrant.png')
    sh = loadShader('shader.vert', 'shader.frag'); // vert는 질문 코드, frag는 아무거나
}

function setup() {
    createCanvas(1000, 1000, WEBGL);
    noStroke();

    // 사용자 카메라 생성해서 등록
    cam = createCamera();
    setCamera(cam);

    // 기본은 원근 투영
    perspective(60 * PI / 180, width / height, 0.1, 1000);
}

function draw() {
    shader(sh);
    sh.setUniform('uTime', millis() / 1000.0);
    // 예: 마우스 위치로 색 제어
    colorVal = [mouseX / width, mouseY / height, 0.8];
    sh.setUniform('uColor', colorVal);
    sh.setUniform('uTex', tex);

    background(10);

    // --- 투영 전환: 키 'P'로 perspective/ortho 토글 ---
    if (useOrtho) {
        // 화면 픽셀 기준 직교투영
        ortho(-width / 2, width / 2, -height / 2, height / 2, 0.1, 1000);
    } else {
        perspective(60 * PI / 180, width / height, 0.1, 1000);
    }

    // --- 카메라/뷰 제어 (uModelViewMatrix에 반영) ---
    // 카메라를 천천히 공전시키기
    const t = millis() / 1000;
    const r = 350;
    const eyeX = r * cos(t * 0.4);
    const eyeZ = r * sin(t * 0.4);
    cam.setPosition(eyeX, 180, eyeZ);
    cam.lookAt(0, 0, 0);

    // --- 모델 변환 (uModelViewMatrix에 누적) ---
    // push();
    plane(500, 500, 200, 200);
    rotateX(-0.8 + t / 2);
    // rotateX(t);
    // pop();
}

function keyPressed() {
    if (key === 'P') useOrtho = !useOrtho;
}