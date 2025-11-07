let cam, sh;       // 오프스크린에 쓸 쉐이더
let pg;            // 오프스크린 p5.Graphics (WEBGL)

function preload(){
  sh = loadShader('shader.vert', 'shader.frag');
}

function setup(){
  createCanvas(800, 600, WEBGL);
  pixelDensity(1);            // 간단하게 DPR 이슈 제거 (옵션 B는 아래 참고)
  noStroke();

  // 카메라
  cam = createCapture(VIDEO);
  cam.size(640, 480);
  cam.hide();

  // 오프스크린 버퍼 (쉐이더 렌더 대상)
  pg = createGraphics(640, 480, WEBGL);
  pg.pixelDensity(1);         // 오프스크린도 DPR 1로 고정
  pg.noStroke();
}

function draw(){
  // ---------- Pass 1: 오프스크린에 모자이크 렌더 ----------
  pg.shader(sh);
  sh.setUniform('tex', cam);
  sh.setUniform('resolution', [pg.width, pg.height]); // 오프스크린 해상도
  sh.setUniform('cell', 10.0);
  pg.plane(pg.width, pg.height); // 버퍼 전체 덮기

  // ---------- Pass 2: 메인 캔버스에서 텍스처로 사용 ----------
  resetShader();     // 기본 쉐이더로 복귀 (texture() 사용 위해)
  background(0);

  // 움직이는 사각형 트랜스폼
  push();
  rotateZ(frameCount * 0.01);
  translate(100 * sin(frameCount * 0.02), 0, 0);

  // pg를 텍스처로 사용
  texture(pg);
  // 화면상 사각형 크기 (원하는 대로 조절)
  plane(480, 360);
  pop();
}