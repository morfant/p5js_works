// 기본 설정
const W = 800, H = 500;

// 공
const ball = {
    x: 120,
    y: 80,
    vx: 300,  // px/sec 느낌으로 쓰려고 frameRate 고려해 dt 적용
    vy: 220,
    r: 18
};

// 장애물 사각형
const rectObs = {
    x: 320,
    y: 180,
    w: 220,
    h: 120
};

function setup() {
    createCanvas(W, H);
    frameRate(60);
}

function draw() {
    const dt = 1 / 60; // 간단히 고정 시간 간격(터널링 신경X, 방법1이라 충분)
    background(20);

    // 물리 업데이트
    integrate(ball, dt);

    // 벽과 충돌(캔버스 경계)
    bounceOffWalls(ball);

    // 사각형과 충돌 + 반사
    bounceOffRect(ball, rectObs);

    // 그리기
    noFill();
    stroke(255);
    rect(rectObs.x, rectObs.y, rectObs.w, rectObs.h);

    noStroke();
    fill(180, 220, 255);
    circle(ball.x, ball.y, ball.r * 2);

    // UI
    drawOverlay();
}

/* ---------------------------
   물리 / 충돌 유틸들
----------------------------*/

// 단순 적분
function integrate(b, dt) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
}

// 캔버스 경계 반사
function bounceOffWalls(b) {
    // 좌우
    if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx *= -1;
    } else if (b.x + b.r > width) {
        b.x = width - b.r;
        b.vx *= -1;
    }
    // 상하
    if (b.y - b.r < 0) {
        b.y = b.r;
        b.vy *= -1;
    } else if (b.y + b.r > height) {
        b.y = height - b.r;
        b.vy *= -1;
    }
}

// 원(공) vs 축정렬 사각형(AABB) 충돌 판정 + 반사
function bounceOffRect(b, rct) {
    const rx1 = rct.x, ry1 = rct.y;
    const rx2 = rct.x + rct.w, ry2 = rct.y + rct.h;

    // 1) 원 중심에서 사각형으로의 최근접점
    const px = clamp(b.x, rx1, rx2);
    const py = clamp(b.y, ry1, ry2);

    let nx = b.x - px;
    let ny = b.y - py;
    const d2 = nx * nx + ny * ny;
    const rr = b.r * b.r;

    // 충돌 없음
    if (d2 > rr) return false;

    // 2) 접촉 → 법선 계산 & 위치 보정 & 속도 반사
    const EPS = 0.01;

    // (A) 원 중심이 사각형 내부인 경우: d == 0 → 최근접점이 중심이라 법선 불명
    if (d2 === 0) {
        // 네 면까지의 침투량 비교 -> 가장 가까운 면의 법선을 선택
        const left = Math.abs(b.x - rx1);
        const right = Math.abs(rx2 - b.x);
        const top = Math.abs(b.y - ry1);
        const bottom = Math.abs(ry2 - b.y);

        const m = Math.min(left, right, top, bottom);

        if (m === left) {
            nx = -1; ny = 0;
            b.x = rx1 - (b.r + EPS);
        } else if (m === right) {
            nx = 1; ny = 0;
            b.x = rx2 + (b.r + EPS);
        } else if (m === top) {
            nx = 0; ny = -1;
            b.y = ry1 - (b.r + EPS);
        } else {
            nx = 0; ny = 1;
            b.y = ry2 + (b.r + EPS);
        }
        reflectVelocity(b, nx, ny);
        return true;
    }

    // (B) 외부에서 접촉: 최근접점에서 외향 법선 = (center - closestPoint) 정규화
    const d = Math.sqrt(d2);
    nx /= d; ny /= d;

    // 위치 보정: 접촉점의 바깥쪽으로 반지름만큼
    b.x = px + nx * (b.r + EPS);
    b.y = py + ny * (b.r + EPS);

    // 속도 반사
    reflectVelocity(b, nx, ny);
    return true;
}

// 속도 v를 법선 n에 대해 반사
function reflectVelocity(b, nx, ny) {
    const dot = b.vx * nx + b.vy * ny;
    b.vx -= 2 * dot * nx;
    b.vy -= 2 * dot * ny;
}

// clamp 유틸
function clamp(v, a, b) {
    return Math.max(a, Math.min(v, b));
}

/* ---------------------------
   HUD
----------------------------*/
function drawOverlay() {
    const fps = frameRate();
    noStroke();
    fill(255);
    textSize(12);
    textAlign(LEFT, TOP);
    text(
        `FPS: ${fps.toFixed(1)}\n` +
        `Ball: (${ball.x.toFixed(1)}, ${ball.y.toFixed(1)})\n` +
        `Vel : (${ball.vx.toFixed(1)}, ${ball.vy.toFixed(1)})`,
        10, 10
    );
}