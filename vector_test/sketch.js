// ===== Canvas =====
const W = 900, H = 560;

// ===== Ball =====
const ball = {
    x: 160,
    y: 120,
    vx: 240,       // px/sec
    vy: 180,
    r: 18
};

// ===== Rect (AABB) =====
let rects = [
    { x: 420, y: 220, w: 260, h: 150 },
];
let draggingRect = null;
let dragOffset = { x: 0, y: 0 };
let draggingBall = false;

// ===== State =====
let paused = false;

function setup() {
    createCanvas(W, H);
    frameRate(60);
    textFont('ui-monospace, Menlo, Consolas, monospace');
}

function draw() {
    const dt = 1 / 60;
    background(18);

    // Physics step
    if (!paused) {
        integrate(ball, dt);
        bounceOffWalls(ball);
        // 충돌 계산 및 벡터 분해 시각화를 위해 첫 번째 사각형만으로 데모
        bounceOffRect(ball, rects[0]);
    }

    // Draw rect(s)
    noFill();
    stroke(255);
    strokeWeight(1.2);
    rects.forEach(r => rect(r.x, r.y, r.w, r.h));

    // Closest point / normal / projections (for the first rect)
    const R = rects[0];
    const cp = closestPointOnRect(ball.x, ball.y, R);
    const vec = decomposeVelocity(ball, cp); // {n, vperp, vpar, vRef, dot, d}

    // Draw closest point
    stroke(255, 200, 120);
    strokeWeight(6);
    point(cp.x, cp.y);

    // Draw normal at closest point (unit)
    drawArrow(cp.x, cp.y, cp.x + vec.n.x * 60, cp.y + vec.n.y * 60, 'n (법선)');

    // Ball
    noStroke();
    fill(170, 210, 255);
    circle(ball.x, ball.y, ball.r * 2);

    // Draw vectors at ball center
    const base = { x: ball.x, y: ball.y };

    // v (원래 속도)
    drawArrow(base.x, base.y, base.x + ball.vx * 0.25, base.y + ball.vy * 0.25, 'v', { w: 2 });
    // v_perp (법선 성분)
    drawArrow(base.x, base.y, base.x + vec.vperp.x * 0.25, base.y + vec.vperp.y * 0.25, 'v⊥', { col: [255, 80, 80], w: 2 });
    // v_par (접선 성분)
    drawArrow(base.x, base.y, base.x + vec.vpar.x * 0.25, base.y + vec.vpar.y * 0.25, 'v∥', { col: [90, 220, 120], w: 2 });
    // v' (반사 속도)
    drawArrow(base.x, base.y, base.x + vec.vRef.x * 0.25, base.y + vec.vRef.y * 0.25, "v'", { col: [220, 120, 255], w: 2 });

    // Overlay
    drawOverlay(vec, cp);
}

/* =========================
   Physics / Collision
========================= */

function integrate(b, dt) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
}

function bounceOffWalls(b) {
    if (b.x - b.r < 0) { b.x = b.r; b.vx *= -1; }
    else if (b.x + b.r > width) { b.x = width - b.r; b.vx *= -1; }

    if (b.y - b.r < 0) { b.y = b.r; b.vy *= -1; }
    else if (b.y + b.r > height) { b.y = height - b.r; b.vy *= -1; }
}

// Closest point on rect (AABB)
function closestPointOnRect(cx, cy, rct) {
    const rx1 = rct.x, ry1 = rct.y;
    const rx2 = rct.x + rct.w, ry2 = rct.y + rct.h;
    const px = clamp(cx, rx1, rx2);
    const py = clamp(cy, ry1, ry2);
    return { x: px, y: py };
}

// Return normal, projections, reflection (regardless of hit)
function decomposeVelocity(b, cp) {
    // Vector from closest point to center
    let nx = b.x - cp.x;
    let ny = b.y - cp.y;
    const d2 = nx * nx + ny * ny;

    // Special case: center inside rect → choose face normal by min penetration
    if (d2 === 0) {
        // We'll compute later in bounceOffRect; here pick a neutral up normal to show something
        nx = 0; ny = -1;
    } else {
        const d = Math.sqrt(d2);
        nx /= d; ny /= d;
    }

    const n = { x: nx, y: ny };      // unit normal
    const dot = b.vx * n.x + b.vy * n.y;
    const vperp = { x: dot * n.x, y: dot * n.y };     // (v·n)n
    const vpar = { x: b.vx - vperp.x, y: b.vy - vperp.y }; // v - v⊥
    const vRef = { x: b.vx - 2 * dot * n.x, y: b.vy - 2 * dot * n.y }; // v - 2(v·n)n

    return { n, vperp, vpar, vRef, dot, d: Math.sqrt(d2) };
}

// Circle vs Rect (frame-based) + reflection + position correction
function bounceOffRect(b, rct) {
    const rx1 = rct.x, ry1 = rct.y;
    const rx2 = rct.x + rct.w, ry2 = rct.y + rct.h;

    const px = clamp(b.x, rx1, rx2);
    const py = clamp(b.y, ry1, ry2);

    let nx = b.x - px;
    let ny = b.y - py;
    const d2 = nx * nx + ny * ny;
    const rr = b.r * b.r;

    if (d2 > rr) return false;   // no contact

    const EPS = 0.01;

    // Inside-rect special-case (d==0): find nearest face normal
    if (d2 === 0) {
        const left = Math.abs(b.x - rx1);
        const right = Math.abs(rx2 - b.x);
        const top = Math.abs(b.y - ry1);
        const bottom = Math.abs(ry2 - b.y);
        const m = Math.min(left, right, top, bottom);

        let n = { x: 0, y: 0 };
        if (m === left) { n = { x: -1, y: 0 }; b.x = rx1 - (b.r + EPS); }
        else if (m === right) { n = { x: 1, y: 0 }; b.x = rx2 + (b.r + EPS); }
        else if (m === top) { n = { x: 0, y: -1 }; b.y = ry1 - (b.r + EPS); }
        else { n = { x: 0, y: 1 }; b.y = ry2 + (b.r + EPS); }

        reflectVelocity(b, n.x, n.y);
        return true;
    }

    // Outside-contact: normal = normalize(center - closest)
    const d = Math.sqrt(d2);
    nx /= d; ny /= d;

    // Position correction (push out)
    b.x = px + nx * (b.r + EPS);
    b.y = py + ny * (b.r + EPS);

    // Reflect
    reflectVelocity(b, nx, ny);
    return true;
}

function reflectVelocity(b, nx, ny) {
    const dot = b.vx * nx + b.vy * ny;
    b.vx -= 2 * dot * nx;
    b.vy -= 2 * dot * ny;
}

function clamp(v, a, b) { return Math.max(a, Math.min(v, b)); }

/* =========================
   UI / Drawing helpers
========================= */

function drawArrow(x1, y1, x2, y2, label = '', opts = {}) {
    const col = opts.col || [120, 180, 255];
    const w = opts.w ?? 1.8;

    stroke(...col);
    strokeWeight(w);
    line(x1, y1, x2, y2);

    // Arrowhead
    push();
    translate(x2, y2);
    const a = atan2(y2 - y1, x2 - x1);
    rotate(a);
    const ah = 8 + w * 1.2;
    line(0, 0, -ah, -ah * 0.6);
    line(0, 0, -ah, ah * 0.6);
    pop();

    if (label) {
        noStroke();
        fill(...col);
        textSize(12);
        textAlign(LEFT, BOTTOM);
        const tx = lerp(x1, x2, 0.55), ty = lerp(y1, y2, 0.55);
        text(label, tx + 6, ty - 4);
    }
}

function drawOverlay(vec, cp) {
    const fps = frameRate();
    fill(255);
    noStroke();
    textSize(13);
    textAlign(LEFT, TOP);
    const lines = [
        `FPS: ${fps.toFixed(1)}   (Space: pause / R: reset / Shift+드래그: 공 이동 / 드래그: 사각형 이동)`,
        `Ball: (${ball.x.toFixed(1)}, ${ball.y.toFixed(1)})   v=(${ball.vx.toFixed(1)}, ${ball.vy.toFixed(1)})`,
        `Closest: (${cp.x.toFixed(1)}, ${cp.y.toFixed(1)})`,
        `n = (${vec.n.x.toFixed(3)}, ${vec.n.y.toFixed(3)})   v·n = ${vec.dot.toFixed(3)}`,
        `|v⊥| = ${mag(vec.vperp).toFixed(2)}   |v∥| = ${mag(vec.vpar).toFixed(2)}`
    ];
    text(lines.join('\n'), 12, 12);
}

function mag(v) { return Math.hypot(v.x, v.y); }

/* =========================
   Mouse / Keys
========================= */

function mousePressed() {
    // Drag rect if clicked inside
    for (let i = rects.length - 1; i >= 0; --i) {
        const r = rects[i];
        if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
            draggingRect = r;
            dragOffset.x = mouseX - r.x;
            dragOffset.y = mouseY - r.y;
            return;
        }
    }
    // Drag ball with Shift
    if (keyIsDown(SHIFT)) {
        const d = dist(mouseX, mouseY, ball.x, ball.y);
        if (d <= ball.r + 6) draggingBall = true;
    }
}

function mouseDragged() {
    if (draggingRect) {
        draggingRect.x = mouseX - dragOffset.x;
        draggingRect.y = mouseY - dragOffset.y;
    } else if (draggingBall) {
        ball.x = mouseX;
        ball.y = mouseY;
    }
}

function mouseReleased() {
    draggingRect = null;
    draggingBall = false;
}

function keyPressed() {
    if (key === ' ') paused = !paused;
    if (key === 'R' || key === 'r') resetScene();
}

function resetScene() {
    ball.x = 160; ball.y = 120;
    ball.vx = 240; ball.vy = 180;
    rects[0] = { x: 420, y: 220, w: 260, h: 150 };
}