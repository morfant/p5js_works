let circles = [];
let letters = [];        // 각 원에 대응하는 한 글자
let angles = [];         // 각 원에 대응하는 회전 각도 저장
let dashPatterns = [];   // 각 원에 대응하는 점선 패턴 저장

let currentCount = 0;
let maxCount = 2000;
let sentence = "";       // 텍스트파일에서 읽어온 문장
let defaultFontName = 'Nanum Myeongjo';

let lines = [];
function preload() {
    lines = loadStrings('assets/sentences_KOR.txt');
}

//// ---- 스폰/애니메이션 제어 ---- ////
let lastSpawn = 0;
let spawnInterval = 100;     // ms마다 새 원 1개 생성
let mode = 'idle';           // 'idle' | 'explode' | 'cluster'
let explodeUntil = 0;
const EXPLODE_DURATION = 600; // ms
const K = 1;                 // 군집 개수(원하는 값으로 조절)
let clusterTargets = [];        // 기존
let clusterTargetVels = [];     // ★ 각 중심점의 속도 벡터

// K개 타깃 생성(캔버스가 만들어진 뒤 호출해야 width/height 사용 가능)
function makeClusterTargets() {
    clusterTargets = [];
    clusterTargetVels = [];                 // ★ 속도 배열 리셋

    for (let k = 0; k < K; k++) {
        clusterTargets.push(createVector(
            random(width * 0.2, width * 0.8),
            random(height * 0.2, height * 0.8)
        ));
        clusterTargetVels.push(createVector(0, 0));   // ★ 초기 속도 0

    }
}

function setup() {
    sentence = lines.join(' ');

    createCanvas(1200, 1200);
    frameRate(60);
    noStroke();
    background(255);

    textFont(defaultFontName);
    textSize(18);
    textAlign(CENTER, CENTER);

    // ★ K개 만큼 타깃 생성 (createCanvas 이후에!)
    makeClusterTargets();

    // 초기 원 하나 + 첫 글자 + 각도 0
    let r0 = random(10, 30);
    circles.push({ x: width / 2, y: height / 2, r: r0, vx: 0, vy: 0, group: 0 });
    if (sentence.length > 0) {
        letters.push(sentence.charAt(0));
    } else {
        letters.push(''); // 파일이 비었을 경우 대비
    }
    angles.push(0);
    dashPatterns.push([random(2, 8), random(2, 8)]);
    currentCount = 1;

    lastSpawn = millis();
}

function draw() {
    // 1) 일정 간격으로 새 원 생성 (spawnInterval마다 1개)
    if (currentCount < min(maxCount, sentence.length)) {
        const now = millis();
        if (now - lastSpawn >= spawnInterval) {
            spawnNextCircle();
            lastSpawn = now;
        }
    }

    updateClusterTargets();  // ★ 중심점 움직임 갱신

    // 2) 상태에 따라 물리 업데이트
    physicsUpdate();

    // 3) 그리기
    renderAll();
}

function updateClusterTargets() {

    // 아주 약한 노이즈 힘(선택)
    const drift = 0.2;
    for (let k = 0; k < clusterTargets.length; k++) {
        clusterTargetVels[k].x += random(-drift, drift);
        clusterTargetVels[k].y += random(-drift, drift);
    }

    const damping = 0.92;   // 감쇠(마찰)
    for (let k = 0; k < clusterTargets.length; k++) {
        // 속도 감쇠 & 위치 업데이트
        clusterTargetVels[k].mult(damping);
        clusterTargets[k].add(clusterTargetVels[k]);

        // 화면 경계 살짝 반사 + 여백 유지
        const margin = 40;
        if (clusterTargets[k].x < margin) {
            clusterTargets[k].x = margin;
            clusterTargetVels[k].x *= -0.6;
        }
        if (clusterTargets[k].x > width - margin) {
            clusterTargets[k].x = width - margin;
            clusterTargetVels[k].x *= -0.6;
        }
        if (clusterTargets[k].y < margin) {
            clusterTargets[k].y = margin;
            clusterTargetVels[k].y *= -0.6;
        }
        if (clusterTargets[k].y > height - margin) {
            clusterTargets[k].y = height - margin;
            clusterTargetVels[k].y *= -0.6;
        }
    }
}

function spawnNextCircle() {
    let newLetter = sentence.charAt(currentCount);
    textFont(defaultFontName);
    textSize(18);
    let w = textWidth(newLetter);
    let minR = max(w, 18) * 0.6;

    let newR = round(random(minR, 15.0 + minR) * 100) / 100;
    let newX = round(random(newR, width - newR) * 10) / 10;
    let newY = round(random(newR, height - newR) * 10) / 10;

    // 가장 가까운 원 찾기
    let closestIdx = -1;
    let closestDist = Infinity;
    for (let i = 0; i < circles.length; i++) {
        let dx = newX - circles[i].x;
        let dy = newY - circles[i].y;
        let d = sqrt(dx * dx + dy * dy);
        if (d < closestDist) {
            closestDist = d;
            closestIdx = i;
        }
    }

    if (closestIdx >= 0) {
        const c = circles[closestIdx];
        const angle = atan2(newY - c.y, newX - c.x);
        const placedX = c.x + cos(angle) * (c.r + newR);
        const placedY = c.y + sin(angle) * (c.r + newR);

        // 그룹은 순환 배정 (K에 맞춰)
        const g = circles.length % K;
        circles.push({ x: placedX, y: placedY, r: newR, vx: 0, vy: 0, group: g });

        letters.push(newLetter);
        angles.push(angle);
        // 불규칙 점선 패턴 (대시/갭 섞어서)
        dashPatterns.push([random(2, 6), random(1, 4), random(3, 8), random(2, 7)]);
        currentCount++;
    }
}

//// ---- 물리 업데이트 ---- ////
function physicsUpdate() {
    const now = millis();

    // explode → 일정 시간 지나면 cluster로
    if (mode === 'explode' && now >= explodeUntil) {
        mode = 'cluster';
    }

    // 모드별 힘 적용
    for (let i = 0; i < circles.length; i++) {
        let c = circles[i];

        if (mode === 'explode') {
            // 폭발 중엔 마찰만 적용해서 점차 감속
            c.vx *= 0.96;
            c.vy *= 0.96;
        } else if (mode === 'cluster') {
            // group이 범위를 벗어나도 안전하게 보정
            const gi = (typeof c.group === 'number' && clusterTargets.length > 0)
                ? (c.group % clusterTargets.length + clusterTargets.length) % clusterTargets.length
                : 0;

            // 군집 타깃으로 스프링 같은 끌어당김
            const target = clusterTargets[gi];   // ★ 보정된 인덱스 사용
            if (target) {
                const ax = (target.x - c.x) * 0.02; // 스프링 계수
                const ay = (target.y - c.y) * 0.02;
                c.vx = (c.vx + ax) * 0.92; // 감쇠 포함
                c.vy = (c.vy + ay) * 0.92;
            }
        } else {
            // idle: 아주 약한 감쇠
            c.vx *= 0.98;
            c.vy *= 0.98;
        }

        // 위치 업데이트
        c.x += c.vx;
        c.y += c.vy;

        // 화면 경계 살짝 반사
        if (c.x - c.r < 0) { c.x = c.r; c.vx *= -0.5; }
        if (c.x + c.r > width) { c.x = width - c.r; c.vx *= -0.5; }
        if (c.y - c.r < 0) { c.y = c.r; c.vy *= -0.5; }
        if (c.y + c.r > height) { c.y = height - c.r; c.vy *= -0.5; }
    }
}

//// ---- 렌더링 ---- ////
function renderAll() {
    background(255);
    textFont(defaultFontName);
    textAlign(CENTER, CENTER);

    for (let i = 0; i < circles.length; i++) {
        let c = circles[i];
        let a = angles[i];
        let pattern = dashPatterns[i];

        // 점선 원
        push();
        noFill();
        stroke(0, 80);
        strokeWeight(1);
        drawingContext.setLineDash(pattern);
        ellipse(c.x, c.y, c.r * 2, c.r * 2);
        drawingContext.setLineDash([]);
        pop();

        // 글자 (각도 회전 유지) + 원 크기에 따른 글자 크기
        push();
        translate(c.x, c.y);
        rotate(a);
        fill(0);
        const ts = map(c.r, 10, 45, 12, 36);
        textSize(ts);
        text(letters[i], 0, 0);
        pop();
    }


    // ----- FPS Overlay -----
    const fps = nf(frameRate(), 2, 2); // 소수점 2자리까지
    fill(0);
    textAlign(LEFT, BOTTOM);
    text(`count: ${currentCount} | mode: ${mode} | K: ${K} | fps: ${fps}`, 10, height - 10);
}

//// ---- 마우스 클릭 시: 폭발 → 군집 ---- ////
function mousePressed() {
    // 폭발 초기 속도: 클릭 위치에서 바깥으로 튕기기
    for (let i = 0; i < circles.length; i++) {
        let c = circles[i];
        const dx = c.x - mouseX;
        const dy = c.y - mouseY;
        let v = createVector(dx, dy);
        if (v.mag() < 1) v = p5.Vector.random2D(); // 거의 0이면 임의 방향
        v.setMag(random(3, 7)); // 초속도 크기
        c.vx = v.x;
        c.vy = v.y;
    }

    // ★ 군집 중심점에도 마우스에서 바깥 방향으로 임펄스
    for (let k = 0; k < clusterTargets.length; k++) {
        let dir = p5.Vector.sub(clusterTargets[k], createVector(mouseX, mouseY));
        if (dir.mag() < 1) dir = p5.Vector.random2D(); // 거의 0이면 임의 방향
        dir.setMag(random(8, 28));                      // 임펄스 크기
        clusterTargetVels[k].add(dir);
    }

    mode = 'explode';
    explodeUntil = millis() + EXPLODE_DURATION;
}

// 옵션: 키로 군집 타깃 재배치(R 키)
function keyPressed() {
    if (key === 'R' || key === 'r') {
        makeClusterTargets();  // ★ 같은 로직 재사용
        // (선택) 기존 원들의 그룹을 현재 K에 맞춰 재배정하고 싶다면:
        // for (let i = 0; i < circles.length; i++) circles[i].group = i % K;
    }
}