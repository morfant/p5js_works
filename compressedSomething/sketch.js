let uiFont;
// FPS 지표를 부드럽게 보여주기 위한 지수이동평균(EMA)
let _fpsEma = null;

function preload() {
    // uiFont = loadFont('assets/Arial.ttf');
}

function setup() {
    createCanvas(600, 600);
    pixelDensity(1);
}

function draw() {
    background(0);

    // 하나의 WavyRect만 화면에 그리기
    // - 위치/크기: 캔버스 가장자리로부터 50px 여백
    // - 아래 옵션은 각 시각적 요소의 역할을 상세히 주석으로 표기함
    if (!window._singleWavyRect) {
        window._singleWavyRect = new WavyRect(
            50, 50,
            width - 100, height - 100,
            {
                // 레이어(겹수). 값이 클수록 선이 겹겹이 빽빽해짐. 50이면 매우 풍성함.
                layers: 50,

                // 안쪽으로 파형이 들어가는 최대 진폭(px). 120이면 가장자리 굴곡이 크게 보임.
                amp: 920,

                // 노이즈 주파수(변을 따라 결의 세밀도). 값이 클수록 더 촘촘한 요철이 생김. 440은 매우 세밀.
                freq: 140.0,

                // 각 변을 몇 개의 점으로 나눠 그릴지(샘플 수). 높을수록 매끈하지만 계산량 증가.
                segments: 180,

                // 선 두께(px).
                strokeWeight: 1,

                // 맨 앞 레이어의 알파(투명도). 뒤로 갈수록 점차 낮아짐.
                baseAlpha: 180,

                // 레이어가 안쪽으로 갈수록 진폭/알파가 줄어드는 비율(0~1). 0.75면 느리게 감소.
                falloff: 0.75,

                // 시간에 따른 파형 애니메이션 속도. 0이면 완전 정지.
                speed: 0.002,

                // 사각형 자체의 이동 속도(px/frame). 0이면 위치 고정.
                vx: 0,
                vy: 0,
            }
        );
    }

    // 위치 이동은 하지 않고, 파형만 시간에 따라 변화
    window._singleWavyRect.display();

    // FPS 오버레이
    drawFPSOverlay();

}


// ==== 클래스 정의 ====
class WavyRect {
    /**
     * 생성자 인자 설명
     * - x, y: 사각형의 좌상단 좌표(px)
     * - w, h: 사각형의 너비/높이(px)
     * - opts: 시각/동작성 제어 옵션 객체
     *   - layers: 선을 겹치는 레이어 수. 많을수록 두텁고 빽빽한 외곽선 표현
     *   - amp: 안쪽으로 들어가는 최대 굴곡 진폭(px). 값이 클수록 가장자리 왜곡이 큼
     *   - freq: 변을 따라 적용되는 노이즈의 주파수. 값이 클수록 세밀한 요철이 촘촘히 생김
     *   - segments: 각 변을 분할해 샘플링하는 점 개수. 높을수록 매끈하지만 계산량 증가
     *   - strokeWeight: 선 굵기(px)
     *   - baseAlpha: 가장 앞 레이어의 기본 투명도. 뒤 레이어는 점점 낮아짐
     *   - falloff: 레이어가 뒤(안쪽)로 갈수록 amp/alpha가 줄어드는 비율(0~1)
     *   - speed: 시간에 따른 파형 애니메이션 속도. 0이면 파형 고정
     *   - vx, vy: 사각형 자체의 이동 속도(px/frame). 0이면 정지
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
        const f = this.freq; // t01(0..1) 구간을 f배로 확대하여 세밀도(결의 촘촘함) 제어
        const z = this.t + layer * 0.037; // 레이어마다 살짝 다른 시간 오프셋
        return (noise(seed, t01 * f, z) * 2 - 1);
    }
}

// === 유틸: FPS 오버레이 ===
function drawFPSOverlay() {
    // 즉시 FPS (deltaTime 기반)
    const instFps = 1000 / deltaTime; // ms → fps
    // EMA로 안정화(처음엔 즉시값으로 초기화)
    if (_fpsEma == null || !isFinite(_fpsEma)) _fpsEma = instFps;
    _fpsEma = lerp(_fpsEma, instFps, 0.1);

    const label = `FPS ${_fpsEma.toFixed(1)}`;

    push();
    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);

    // 배경 패널 크기를 텍스트에 맞춰 계산
    const pad = 6;
    const tw = textWidth(label);
    const th = 14; // 대략적인 행 높이
    fill(0, 160);
    rect(10, 10, tw + pad * 2, th + pad * 2, 4);

    // 텍스트 그리기
    fill(255);
    text(label, 10 + pad, 10 + pad);
    pop();
}
