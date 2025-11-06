let rects = [];
let theShader;
let theShaderGL2; // WebGL2 (#version 300 es)
let theShaderGL1; // WebGL1 (GLSL ES 1.00)
const MAX_RECTS_GL2 = 32;
const MAX_RECTS_GL1 = 32;
let ACTIVE_MAX_RECTS = MAX_RECTS_GL2;

// WebGL에서 텍스트 사용을 위한 폰트 및 셰이더 로드
let uiFont;
function preload() {
    // 로컬 폰트 사용
    uiFont = loadFont('assets/Arial.ttf');
    // 두 버전의 셰이더를 모두 로드해두고, setup에서 선택
    theShaderGL2 = loadShader('shaders/wavyrect.vert', 'shaders/wavyrect.frag');
    theShaderGL1 = loadShader('shaders/wavyrect_gl1.vert', 'shaders/wavyrect_gl1.frag');
}

function setup() {
    createCanvas(800, 800, WEBGL);
    pixelDensity(1);
    noiseDetail(3, 0.5);
    // 렌더러 버전에 따라 적절한 셰이더 선택
    const isGL2 = (drawingContext && typeof WebGL2RenderingContext !== 'undefined' && drawingContext instanceof WebGL2RenderingContext);
    // theShader = isGL2 ? theShaderGL2 : theShaderGL1;
    // ACTIVE_MAX_RECTS = isGL2 ? MAX_RECTS_GL2 : MAX_RECTS_GL1;

    theShader = theShaderGL1; ACTIVE_MAX_RECTS = 8;
    if (uiFont) textFont(uiFont);

    // 예시: 서로 다른 파라미터의 구부러진 사각형 두 개
    const baseOpts = {
        layers: 70, amp: 120, freq: 90.2, segments: 100,
        strokeWeight: 0.2, baseAlpha: 180, falloff: 0.7, speed: 0.003
    };
    // 첫 번째 원형 하나
    rects.push(new WavyRect(120, 120, 120, 60, { ...baseOpts, vx: 0.45, vy: 0.3 }));
    // 첫 번째와 유사한 객체 100개 무작위 배치/속도로 추가
    for (let i = 0; i < 10; i++) {
        const w = 120 * random(0.7, 1.1);
        const h = 60 * random(0.7, 1.1);
        const x = random(0, width - w);
        const y = random(0, height - h);
        const vx = random([-1, 1]) * random(0.15, 0.7);
        const vy = random([-1, 1]) * random(0.15, 0.7);
        // 레이어 수나 알파를 살짝 흔들어 군집감 주기
        const layersJ = round(baseOpts.layers * random(0.8, 1.0));
        const baseAlphaJ = baseOpts.baseAlpha * random(0.8, 1.1);
        rects.push(new WavyRect(x, y, w, h, {
            ...baseOpts,
            layers: layersJ,
            baseAlpha: baseAlphaJ,
            vx, vy
        }));
    }

    rects.push(new WavyRect(340, 260, 220, 140, {
        layers: 16, amp: 16, freq: 0.9, segments: 140,
        strokeWeight: 1.1, baseAlpha: 160, falloff: 0.65, speed: 0.002,
        vx: -0.6, vy: 0.55
    }));
}

function draw() {
    background(18);

    rects.forEach(r => r.update());

    // 셰이더 바인딩 및 데이터 전달
    shader(theShader);
    theShader.setUniform('u_resolution', [width, height]);
    theShader.setUniform('u_time', millis() / 1000.0);
    const count = min(rects.length, ACTIVE_MAX_RECTS);
    theShader.setUniform('u_count', count);

    const rectData = [];
    const ampData = [];
    const freqData = [];
    const falloffData = [];
    for (let i = 0; i < count; i++) {
        const r = rects[i];
        rectData.push(r.x, r.y, r.w, r.h);
        ampData.push(r.amp * 0.2); // 셰이더에서 스케일 보정
        freqData.push(r.freq);
        falloffData.push(r.falloff);
    }
    theShader.setUniform('u_rects', rectData);
    theShader.setUniform('u_amp', ampData);
    theShader.setUniform('u_freq', freqData);
    theShader.setUniform('u_falloff', falloffData);

    // 풀스크린 사각형 렌더 (p5 WEBGL rect를 사용해 aPosition/aTexCoord 제공)
    noStroke();
    rectMode(CENTER);
    rect(0, 0, width, height);

    // FPS 표시 (웹GL 좌표계 보정)
    resetShader();
    push();
    translate(-width / 2, -height / 2);
    noStroke();
    fill(255);
    textSize(12);
    textAlign(LEFT, TOP);
    const fps = nf(frameRate(), 2, 1);
    text(`FPS: ${fps}`, 10, 10);
    pop();

}


// ==== 클래스 정의 ====
class WavyRect {
    /**
     * x, y: 좌상단 좌표
     * w, h: 너비, 높이
     * opts: {layers, amp, freq, segments, strokeWeight, baseAlpha, falloff, speed}
     */
    constructor(x, y, w, h, opts = {}) {
        this.x = x; this.y = y; this.w = w; this.h = h;

        // 기본값
        this.layers = opts.layers ?? 10;      // 선 겹 수
        this.amp = opts.amp ?? 12;         // 변을 따라 흔들리는 최대 진폭(px)
        this.freq = opts.freq ?? 1.0;       // 노이즈 주파수(값이 크면 더 잔잔한 결)
        this.segments = opts.segments ?? 100;   // 한 변을 나눌 샘플 수
        this.strokeW = opts.strokeWeight ?? 1; // 선 굵기
        this.baseAlpha = opts.baseAlpha ?? 180;  // 맨 앞 레이어 투명도
        this.falloff = opts.falloff ?? 0.75;   // 레이어가 뒤로 갈수록 진폭/알파 감소
        this.speed = opts.speed ?? 0.002;    // 시간에 따른 애니메이션 속도
        this.vx = opts.vx ?? random(-1.2, 1.2);
        this.vy = opts.vy ?? random(-1.2, 1.2);

        // 기본 속도가 0에 너무 가까우면 살짝 보정해서 정지하지 않도록 함
        if (abs(this.vx) < 0.05) this.vx = this.vx < 0 ? -0.3 : 0.3;
        if (abs(this.vy) < 0.05) this.vy = this.vy < 0 ? -0.3 : 0.3;

        // 각 변(edge)마다 다른 시드로 노이즈를 줘서 결이 겹치되 과하게 일치하지 않게
        this.edgeSeeds = [random(1000), random(1000), random(1000), random(1000)];

        // 시간 축
        this.t = random(1000);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // 사각형이 화면 밖으로 너무 나가지 않도록 반사
        const margin = this.amp * 0.1; // 큰 진폭일 때 완전히 끊기지 않게 약간 여유를 둠
        if (this.x <= -margin) {
            this.x = -margin;
            this.vx *= -1;
        } else if (this.x + this.w >= width + margin) {
            this.x = width + margin - this.w;
            this.vx *= -1;
        }

        if (this.y <= -margin) {
            this.y = -margin;
            this.vy *= -1;
        } else if (this.y + this.h >= height + margin) {
            this.y = height + margin - this.h;
            this.vy *= -1;
        }
    }

    display() {
        this.t += this.speed;

        strokeWeight(this.strokeW);
        noFill();

        // 레이어를 바깥→안쪽(또는 반대로) 순서로 그리기
        for (let layer = 0; layer < this.layers; layer++) {
            // 레이어별로 진폭과 알파를 약간씩 줄여 결이 겹겹이 보이게
            const layerRatio = this.layers <= 1 ? 1 : 1 - layer / (this.layers - 1);
            const ampL = this.amp * (this.falloff ** layer);
            const a = this.baseAlpha * layerRatio;

            stroke(255, a);

            // 4개 변을 각각 그린다.
            // 변마다 독립적인 beginShape/endShape로 "겹겹의 라인" 느낌 강조
            for (let edge = 0; edge < 4; edge++) {
                beginShape();
                for (let i = 0; i <= this.segments; i++) {
                    const t01 = i / this.segments; // 0..1 구간 파라미터
                    const v = this._edgePoint(edge, t01);       // 해당 변 위의 기본 점
                    const nOut = this._edgeNormal(edge);        // 바깥 방향 노멀
                    // 노이즈는 -1..1 이지만, 안쪽(바깥의 반대)으로만 치우치게 만든다.
                    // 바깥 방향으로는 0, 안쪽으로는 0..1 범위로 매핑
                    const wiggleRaw = this._noiseEdge(edge, t01, layer);
                    const inward = max(0, -wiggleRaw); // 바깥(+)은 0, 안쪽(-)만 양수로
                    // 안쪽 방향 벡터 = 바깥 노멀의 반대
                    const nIn = createVector(-nOut.x, -nOut.y);
                    const px = v.x + nIn.x * inward * ampL;
                    const py = v.y + nIn.y * inward * ampL;
                    vertex(px, py);
                }
                endShape();
            }
        }
    }

    // 변 인덱스: 0=상, 1=우, 2=하, 3=좌
    _edgePoint(edge, t01) {
        const x0 = this.x, y0 = this.y, x1 = this.x + this.w, y1 = this.y + this.h;
        switch (edge) {
            case 0: // 위쪽: (x0, y0) -> (x1, y0)
                return createVector(lerp(x0, x1, t01), y0);
            case 1: // 오른쪽: (x1, y0) -> (x1, y1)
                return createVector(x1, lerp(y0, y1, t01));
            case 2: // 아래쪽: (x1, y1) -> (x0, y1)
                return createVector(lerp(x1, x0, t01), y1);
            case 3: // 왼쪽: (x0, y1) -> (x0, y0)
                return createVector(x0, lerp(y1, y0, t01));
        }
    }

    _edgeNormal(edge) {
        // 사각형 바깥쪽을 향하는 단위 노멀(픽셀 스케일에선 1배 길이로 둬도 무방)
        switch (edge) {
            case 0: return createVector(0, -1); // 위 변: 위쪽으로
            case 1: return createVector(1, 0);  // 오른쪽 변: 오른쪽으로
            case 2: return createVector(0, 1);  // 아래 변: 아래쪽으로
            case 3: return createVector(-1, 0); // 왼쪽 변: 왼쪽으로
        }
    }

    _noiseEdge(edge, t01, layer) {
        // 노이즈 값: -1..1 범위가 되도록 (noise*2-1)
        const seed = this.edgeSeeds[edge];
        const f = this.freq;
        const z = this.t + layer * 0.037; // 레이어마다 살짝 다른 시간 오프셋
        return (noise(seed, t01 * f, z) * 2 - 1);
    }
}
