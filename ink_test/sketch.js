// ----- 설정 -----

let blobs = [];
let currentInkColor = null;

function setup() {
    createCanvas(800, 800);
    background(245, 242, 235);
    noStroke();

    // fxhash 호환 + 일반 환경 호환
    if (typeof fxrand === "undefined") {
        window.fxrand = () => Math.random();
    }

    blendMode(BLEND); // 기본 블렌딩 모드
    noiseSeed(fxrand() * 100000);
}

function draw() {
    // 종이 위에 아주 얇게 덮어서 잔상 유지 + 서서히 페이드 (일반 블렌딩)
    blendMode(BLEND);
    fill(245, 242, 235, 10);
    rect(0, 0, width, height);

    // 잉크 방울들 업데이트 & 그리기 (MULTIPLY로 서로 섞이게)
    // blendMode(MULTIPLY);
    // blendMode(SOFT_LIGHT);
    // blendMode(OVERLAY);
    for (let i = blobs.length - 1; i >= 0; i--) {
        blobs[i].update();
        blobs[i].draw();
        if (blobs[i].isDead()) {
            blobs.splice(i, 1);
        }
    }

    // 다음 프레임을 위해 기본 블렌딩으로 되돌림
    blendMode(BLEND);
}

// 마우스를 클릭하면 잉크 방울 하나 생성
function mousePressed() {
    // currentInkColor = color(
    //     random(20, 200),
    //     random(20, 200),
    //     random(20, 200)
    // );
    currentInkColor = color(
        0, 0, 0
    );
    blobs.push(new InkBlob(mouseX, mouseY, currentInkColor));
}

function mouseDragged() {
    if (frameCount % 2 == 0) blobs.push(new InkBlob(mouseX, mouseY, currentInkColor));
}

// ----- InkBlob 클래스: 한 번의 클릭으로 생기는 잉크 덩어리 -----
class InkBlob {
    constructor(x, y, inkColor = null) {
        this.x = x;
        this.y = y;

        this.baseRadius = random(30, 90);
        this.maxAge = 2 + int(random(80, 160));
        this.age = 0;

        this.inkColor = inkColor;
    }

    update() {
        this.age++;
    }

    isDead() {
        return this.age > this.maxAge;
    }

    draw() {
        let progress = this.age / this.maxAge; // 0 → 1

        let coreR = this.baseRadius;                       // 중심부 기본 반지름
        let edgeR = this.baseRadius * (1.0 + 0.5 * progress); // 시간이 지날수록 서서히 커지는 가장자리

        let layers = 12;
        for (let i = 0; i < layers; i++) {
            // 레이어 비율 0(코어) → 1(가장자리)
            let t = layers === 1 ? 0 : i / (layers - 1);

            // 각 레이어의 목표 반지름: 코어R에서 edgeR로 선형 보간
            let rr = lerp(coreR, edgeR, t) * random(0.9, 1.05);

            // 가장자리일수록 번짐이 더 넓게, 중심부는 조밀하게
            let dist = randomGaussian(0, rr * 0.06);
            let angle = random(TWO_PI);
            let ox = cos(angle) * dist;
            let oy = sin(angle) * dist;

            let px = this.x + ox;
            let py = this.y + oy;

            // 중심부는 진하고, 바깥으로 갈수록 옅어지지만
            // progress가 커질수록 전체는 서서히 사라짐
            let baseAlphaCore = 110;
            let baseAlphaEdge = 20;
            let baseAlpha = lerp(baseAlphaCore, baseAlphaEdge, t);
            let alpha = baseAlpha * (1.0 - progress);
            alpha *= random(0.85, 1.1);
            alpha = max(alpha, 0);

            fill(
                red(this.inkColor),
                green(this.inkColor),
                blue(this.inkColor),
                alpha
            );

            ellipse(px, py, rr, rr);
        }
    }
}