let FPS = 30;
let totalFrames = FPS * 2;  // 2초 동안 실행해본다
let ringSystems = [];
let arcSystems = [];

function setup() {
    createCanvas(800, 800);
    frameRate(FPS);

    // 벤치마크: 각각 100개 생성
    for (let i = 0; i < 20; i++) {
        // FloralRing 인스턴스들 (작은 랜덤 위치로 분산)
        ringSystems.push(new FloralRing(
            random(-100, width + 100), random(-100, height + 100),
            100,             // startRadius
            60,              // radiusStep
            5,               // count
            random(1, 30),             // baseBrushSize
            color(26, 122, 158, 30),
            { offsetXMin: -1, offsetXMax: 1, offsetYMin: -1, offsetYMax: 1 },  // offset 범위
            random(4, 10),              // baseLenStep
            { lenOffsetMin: -30, lenOffsetMax: 30 }, // 각 세그먼트 길이 랜덤 오프셋 범위
            { segWidthMin: 2, segWidthMax: 10 },            // segWidthRange 추가
            0.01                         // lenNoiseStep — 노이즈 입력 증가폭



        ));

        // FloralArc 인스턴스들
        arcSystems.push(new FloralArc(
            random(-100, width + 100), random(-100, height + 100),
            random(150, 300),                   // count 아크 개수
            90, 220,
            color(10, 80, random(100, 115), 10)
        ));
    }
}

function draw() {
    background(255);

    // 모두 그리기
    for (let sys of ringSystems) {
        sys.draw();
    }
    // for (let sys of arcSystems) {
    //     sys.draw();
    // }

    // 프레임레이트 로그
    if (frameCount % FPS === 0) {
        console.log("FPS:", frameRate().toFixed(2));
    }

    // if (frameCount > totalFrames) {
    //     noLoop();
    //     console.log("Bench done!");
    // }
    noLoop();
}

// === 클래스 정의 (생략: 앞서 정의한 FloralRing, InnerRing, FloralArc) ===