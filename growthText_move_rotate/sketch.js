// TODO
// 

// 글자 + 점선 원이 클릭 위치에서 등장 → 캔버스 중앙으로 빨려 들어가며 각자 회전
let sentence = "";
// let defaultFontName = "Nanum Myeongjo";
let defaultFontName = "Nanum Gothic";
let nextIndex = 0;

let nodes = []; // { ch, x,y, vx,vy, size, r, pattern, angle, angVel }

const centerK = 0.04;   // 중심 끌어당김
const damping = 0.90;   // 감쇠
const MIN_SIZE = 134;    // 랜덤 글자 크기 범위
const MAX_SIZE = 422;

let lines = [];
function preload() {
    lines = loadStrings('assets/sentences_KOR.txt');
}

function setup() {
    sentence = (lines && lines.length) ? lines.join(' ') : "텍스트 파일을 찾지 못했습니다.";
    sentence = "도도도도도도도";
    createCanvas(1200, 1200);
    frameRate(60);
    noStroke();
    background(255);
    textFont(defaultFontName);
    textAlign(CENTER, CENTER);
}

function draw() {
    background(255);
    textFont(defaultFontName);
    textAlign(CENTER, CENTER);

    const cx = width * 0.5;
    const cy = height * 0.5;

    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // --- 중앙 끌어당김 + 감쇠 ---
        const ax = (cx - n.x) * centerK;
        const ay = (cy - n.y) * centerK;
        n.vx = (n.vx + ax) * damping;
        n.vy = (n.vy + ay) * damping;
        n.x += n.vx;
        n.y += n.vy;

        // --- 고유 회전 속도 적용 ---
        n.angle += n.angVel;

        // --- 회전된 좌표계에서 점선 원과 글자 함께 그리기 ---
        push();
        translate(n.x, n.y);
        rotate(n.angle);

        // 점선 원 (회전 포함)
        noFill();
        stroke(0, 80);
        strokeWeight(10);
        strokeCap(SQUARE);
        drawingContext.setLineDash(n.pattern);
        ellipse(0, 0, n.r * 2, n.r * 2);
        drawingContext.setLineDash([]);

        // 글자
        fill(0);
        noStroke();
        textSize(n.size);
        text(n.ch, 0, 0);
        pop();
    }

    // ==== ✅ 고정된 HUD (화면 좌표 기준) ====
    resetMatrix();         // ⚡ 변환(translate/rotate) 초기화
    noStroke();
    fill(0);
    textAlign(LEFT, BOTTOM);
    textSize(14);
    const fps = nf(frameRate(), 2, 2);
    const info = `nodes: ${nodes.length}/${sentence.length}  |  fps: ${fps}`;
    text(info, 10, height - 10);
}

function mousePressed() {
    if (nextIndex >= sentence.length) return;

    const ch = sentence.charAt(nextIndex);

    // 글자 크기 랜덤(고정)
    const ts = random(MIN_SIZE, MAX_SIZE);
    textSize(ts);
    const w = max(1, textWidth(ch));
    const h = ts;
    const needed = max(w, h);

    // 글자를 담는 점선 원 반지름
    const r = needed * 0.6;

    // 점선 패턴(노드별 고정)
    const pattern = [random(2, 3), random(20, 22), random(3, 4), random(10, 20)];

    // 초기 속도: 중앙 방향으로 약간 비틀어진 벡터
    const cx = width * 0.5, cy = height * 0.5;
    let dir = createVector(cx - mouseX, cy - mouseY);
    if (dir.mag() < 1) dir = p5.Vector.random2D();
    dir.setMag(random(3, 7));
    dir.rotate(random(-0.25, 0.25));

    // 고유 회전 속도(너무 느리거나 빠르지 않게)
    const angVel = random(-0.01, 0.01); // 라디안/프레임
    const angle0 = random(TWO_PI);

    nodes.push({
        ch: ch,
        x: mouseX, y: mouseY,
        vx: dir.x, vy: dir.y,
        size: ts,
        r: r,
        pattern: pattern,
        angle: angle0,
        angVel: angVel
    });

    nextIndex++;
}