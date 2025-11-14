let uiFont;

// ====== 상태 변수 ======
let _cnv;
let _fpsEma = null;

let audioStarted = false; // 마이크 권한까지 OK
let audioReady = false;   // 분석 노드 연결까지 OK (FF 초기 1프레임 레이스 가드)
let audioLevelEma = 0;

// p5.AudioIn은 권한/스트림만 얻고, 분석은 네이티브 Web Audio로
let mic = null;
let _analyser = null;
let _analyserBuf = null; // time-domain buffer
let _fftBuf = null;      // freq-domain buffer

// ==== UI/비주얼 객체 ====
function preload() {
    // uiFont = loadFont('assets/Arial.ttf');
}

function setup() {
    _cnv = createCanvas(600, 600);
    pixelDensity(1);

    // 모바일 제스처 충돌 완화
    _cnv.elt.style.touchAction = 'manipulation';
    _cnv.elt.style.webkitTapHighlightColor = 'transparent';

    wireMobileAudioGate(); // 터치/포인터/클릭 전역 후킹

    // 하나의 WavyRect 생성(가장자리 50px 여백)
    window._singleWavyRect = new WavyRect(
        50, 50, width - 100, height - 100,
        {
            layers: 100,
            amp: 30,
            freq: 50.0,
            segments: 400,
            strokeWeight: 1,
            baseAlpha: 180,
            falloff: 0.75,
            speed: 0.05,
            vx: 0,
            vy: 0,
        }
    );
}

function draw() {
    background(0);

    // 오디오 반영
    applyAudioModulation();

    // 파형 애니메이션만 (위치 이동은 옵션에서 0으로 설정)
    window._singleWavyRect.display();

    // 오버레이
    drawFPSOverlay();
    drawAudioOverlay();

    adaptSegmentsByFps(window._singleWavyRect);
}

function windowResized() {
    resizeCanvas(600, 600);
}

// ==========================
//      오디오 시작/분석
// ==========================
function startAudio() {
    if (audioStarted) return;
    try {
        userStartAudio();
        const ac = getAudioContext();
        if (ac && ac.state !== 'running') ac.resume();
    } catch (e) { }

    mic = new p5.AudioIn();
    // 일부 모바일은 constraints 시그니처 미지원 → 기본 start 사용
    mic.start(() => {
        // 스트림 OK → 네이티브 분석 노드 연결은 "한 프레임 뒤"로 지연 (FF 레이스 회피)
        audioStarted = true;
        audioReady = false;

        // 한 프레임 미루고 연결 (초기 빈 버퍼/채널 문제 회피)
        requestAnimationFrame(() => {
            const ac = getAudioContext();
            const src = ac.createMediaStreamSource(mic.stream);

            _analyser = ac.createAnalyser();
            _analyser.fftSize = 1024;               // 필요시 2048
            _analyser.smoothingTimeConstant = 0.2;  // 약간의 스무딩

            src.connect(_analyser);

            _analyserBuf = new Float32Array(_analyser.fftSize);
            _fftBuf = new Uint8Array(_analyser.frequencyBinCount);

            audioReady = true;
        });
    }, (err) => {
        console.warn('Mic start error:', err);
        audioStarted = false;
        audioReady = false;
    });
}

// 전역/캔버스 모두에 제스처 후킹하여 한 번만 오디오 시작
function wireMobileAudioGate() {
    const onceHandler = (ev) => {
        try {
            const ac = getAudioContext();
            if (ac && ac.state !== 'running') ac.resume();
        } catch (e) { }
        if (!audioStarted) startAudio();
        offAll();
    };

    const opts = { passive: false, capture: true };
    const onAll = (el) => {
        ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click']
            .forEach(ev => el.addEventListener(ev, onceHandler, opts));
    };
    const offAll = () => {
        ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click']
            .forEach(ev => {
                window.removeEventListener(ev, onceHandler, opts);
                document.removeEventListener(ev, onceHandler, opts);
                if (_cnv) _cnv.elt.removeEventListener(ev, onceHandler, opts);
            });
    };

    onAll(window);
    onAll(document);
    if (_cnv) onAll(_cnv.elt);
}

// p5 훅 보강 (브라우저별 편차 커버)
function touchStarted() {
    if (!audioStarted) {
        const ac = getAudioContext();
        if (ac && ac.state !== 'running') ac.resume();
        startAudio();
    }
    return false;
}

function mousePressed() {
    if (!audioStarted) {
        const ac = getAudioContext();
        if (ac && ac.state !== 'running') ac.resume();
        startAudio();
    }
}

// 시간영역 RMS (0..~1 근사)
function getMicLevel() {
    if (!audioReady || !_analyser || !_analyserBuf) return 0;
    _analyser.getFloatTimeDomainData(_analyserBuf);
    let sum = 0;
    for (let i = 0; i < _analyserBuf.length; i++) {
        const v = _analyserBuf[i];
        sum += v * v;
    }
    return Math.sqrt(sum / _analyserBuf.length);
}

// 주파수 스펙트럼 (0..255)
function getFFTData() {
    if (!audioReady || !_analyser || !_fftBuf) return null;
    _analyser.getByteFrequencyData(_fftBuf);
    return _fftBuf;
}

// 오디오 기반 파라미터 모듈레이션
function applyAudioModulation() {
    const wr = window._singleWavyRect;
    if (!wr) return;

    if (audioStarted && audioReady) {
        let level = 0;
        try { level = getMicLevel(); } catch { level = 0; }

        // EMA 안정화
        audioLevelEma = lerp(audioLevelEma, level, 0.15);

        // 캘리브레이션 + 감마
        let env = audioLevelEma;
        env = constrain(map(env, 0.0, 0.3, 0, 1), 0, 1);
        env = pow(env, 0.5);

        // (선택) FFT 사용 예: 저역 평균으로 별도 조정
        const fftData = getFFTData();
        let lowAvg = 0;
        if (fftData) {
            const low = 32; // 가장 낮은 32 bins
            let s = 0;
            for (let i = 0; i < min(low, fftData.length); i++) s += fftData[i];
            lowAvg = (s / low) / 255; // 0..1
        }

        // 파라미터 맵핑
        wr.amp = lerp(wr.baseAmp * 0.4, wr.baseAmp * 2.0, env);                 // 전체 레벨 → 굴곡 크기
        wr.freq = lerp(wr.baseFreq * 0.6, wr.baseFreq * 1.6, constrain(lowAvg * 1.2, 0, 1)); // 저역 → 노이즈 결
        wr.baseAlpha = lerp(100, 240, env);                                     // 투명도
    } else {
        // 오디오 미사용 시 복원
        audioLevelEma = lerp(audioLevelEma, 0, 0.1);
        wr.amp = wr.baseAmp;
        wr.freq = wr.baseFreq;
        wr.baseAlpha = wr.baseAlpha0;
    }
}

// ==========================
//          WavyRect
// ==========================
class WavyRect {
    constructor(x, y, w, h, opts = {}) {
        this.x = x; this.y = y; this.w = w; this.h = h;

        this.layers = opts.layers ?? 10;
        this.amp = opts.amp ?? 12;
        this.freq = opts.freq ?? 1.0;
        this.baseAmp = this.amp;
        this.baseFreq = this.freq;
        this.segments = opts.segments ?? 100;
        this.strokeW = opts.strokeWeight ?? 1;
        this.baseAlpha = opts.baseAlpha ?? 180;
        this.baseAlpha0 = this.baseAlpha;
        this.falloff = opts.falloff ?? 0.75;
        this.speed = opts.speed ?? 0.002;
        this.vx = opts.vx ?? random(-1.2, 1.2);
        this.vy = opts.vy ?? random(-1.2, 1.2);

        if (abs(this.vx) < 0.05) this.vx = this.vx < 0 ? -0.3 : 0.3;
        if (abs(this.vy) < 0.05) this.vy = this.vy < 0 ? -0.3 : 0.3;

        this.edgeSeeds = [random(1000), random(1000), random(1000), random(1000)];
        this.t = random(1000);
    }

    update() {
        this.x += this.vx; this.y += this.vy;
        const margin = this.amp * 0.1;
        if (this.x <= -margin) { this.x = -margin; this.vx *= -1; }
        else if (this.x + this.w >= width + margin) { this.x = width + margin - this.w; this.vx *= -1; }

        if (this.y <= -margin) { this.y = -margin; this.vy *= -1; }
        else if (this.y + this.h >= height + margin) { this.y = height + margin - this.h; this.vy *= -1; }
    }

    display() {
        this.t += this.speed;

        strokeWeight(this.strokeW);
        noFill();

        for (let layer = 0; layer < this.layers; layer++) {
            const layerRatio = this.layers <= 1 ? 1 : 1 - layer / (this.layers - 1);
            const ampL = this.amp * (this.falloff ** layer);
            const a = this.baseAlpha * layerRatio;
            stroke(255, a);

            for (let edge = 0; edge < 4; edge++) {
                beginShape();
                for (let i = 0; i <= this.segments; i++) {
                    const t01 = i / this.segments;
                    const v = this._edgePoint(edge, t01);
                    const nOut = this._edgeNormal(edge);
                    const wiggleRaw = this._noiseEdge(edge, t01, layer);
                    const inward = max(0, -wiggleRaw); // 바깥(+)은 0, 안쪽(-)만 양수
                    const nIn = createVector(-nOut.x, -nOut.y);
                    const px = v.x + nIn.x * inward * ampL;
                    const py = v.y + nIn.y * inward * ampL;
                    vertex(px, py);
                }
                endShape();
            }
        }
    }

    _edgePoint(edge, t01) {
        const x0 = this.x, y0 = this.y, x1 = this.x + this.w, y1 = this.y + this.h;
        switch (edge) {
            case 0: return createVector(lerp(x0, x1, t01), y0);       // 상
            case 1: return createVector(x1, lerp(y0, y1, t01));       // 우
            case 2: return createVector(lerp(x1, x0, t01), y1);       // 하
            case 3: return createVector(x0, lerp(y1, y0, t01));       // 좌
        }
    }

    _edgeNormal(edge) {
        switch (edge) {
            case 0: return createVector(0, -1);
            case 1: return createVector(1, 0);
            case 2: return createVector(0, 1);
            case 3: return createVector(-1, 0);
        }
    }

    _noiseEdge(edge, t01, layer) {
        const seed = this.edgeSeeds[edge];
        const f = this.freq;
        const z = this.t + layer * 0.037;
        return (noise(seed, t01 * f, z) * 2 - 1);
    }
}

// ==========================
//          오버레이
// ==========================
function drawFPSOverlay() {
    const dt = (isFinite(deltaTime) && deltaTime > 0 && deltaTime < 1000) ? deltaTime : 16.67;
    const instFps = 1000 / dt;
    if (_fpsEma == null || !isFinite(_fpsEma)) _fpsEma = instFps;
    _fpsEma = lerp(_fpsEma, instFps, 0.1);

    const label = `FPS ${_fpsEma.toFixed(1)}`;

    push();
    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);
    const pad = 6;
    const tw = textWidth(label);
    const th = 14;
    fill(0, 160);
    rect(10, 10, tw + pad * 2, th + pad * 2, 4);
    fill(255);
    text(label, 10 + pad, 10 + pad);
    pop();
}

function drawAudioOverlay() {
    const label = audioStarted
        ? (audioReady ? 'MIC On' : 'MIC Warming...')
        : 'MIC Off (tap/click to enable)';
    const level = audioLevelEma;

    push();
    textSize(12);
    textAlign(LEFT, TOP);

    const pad = 6;
    const tw = textWidth(label);
    const barW = 80, barH = 6;
    const panelW = max(tw, barW) + pad * 2;
    const panelH = 14 + 6 + pad * 3;
    noStroke();
    fill(0, 160);
    rect(10, 30, panelW, panelH, 4);

    fill(255);
    text(label, 10 + pad, 30 + pad);

    const x = 10 + pad;
    const y = 30 + pad + 16;
    fill(60);
    rect(x, y, barW, barH, 2);
    fill(audioStarted ? color(0, 200, 120) : color(150));
    rect(x, y, constrain(level, 0, 1) * barW, barH, 2);
    pop();
}

// FPS 기반 간단 LOD
function adaptSegmentsByFps(wr) {
    if (!_fpsEma || !wr) return;
    if (_fpsEma < 30 && wr.segments > 150) wr.segments = floor(wr.segments * 0.9);
    else if (_fpsEma > 50 && wr.segments < 400) wr.segments = ceil(wr.segments * 1.05);
}