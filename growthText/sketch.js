let circles = [];
let letters = [];        // 각 원에 대응하는 한 글자
let angles = [];         // 각 원에 대응하는 회전 각도 저장
let dashPatterns = [];        // 각 원에 대응하는 점선 패턴 저장

let currentCount = 0;
let maxCount = 2000;
let sentence = "누군가 듣고 있어.";
let fontInput;            // 폰트 선택 위한 UI
let defaultFontName = 'Nanum Myeongjo';

let lines = [];
function preload() {
    lines = loadStrings('assets/sentences_KOR.txt');
    // lines = loadStrings('assets/sentences_ENG.txt');
}

function setup() {
    sentence = lines.join(' ');

    createCanvas(1200, 1200);
    frameRate(1);          // 초당 10프레임

    noStroke();
    background(255);

    textFont(defaultFontName);
    textSize(18);
    textAlign(CENTER, CENTER);

    // 초기 원 하나 + 첫 글자 + 각도 0
    let r0 = random(10, 30);
    circles.push({ x: width / 2, y: height / 2, r: r0 });
    if (sentence.length > 0) {
        letters.push(sentence.charAt(0));
    } else {
        letters.push(''); // 파일이 비었을 경우 대비
    }
    angles.push(0);
    dashPatterns.push([random(2, 8), random(2, 8)]);


    currentCount = 1;
}

function draw() {
    if (currentCount >= min(maxCount, sentence.length)) {
        noLoop();
    }

    if (currentCount < sentence.length) {
        let newLetter = sentence.charAt(currentCount);
        textFont(defaultFontName);
        textSize(18);
        let w = textWidth(newLetter);
        let minR = max(w, 18) * 0.6;

        let newR = round(random(minR, 15.0 + minR) * 100) / 100;
        let newX = round(random(newR, width - newR) * 10) / 10;
        let newY = round(random(newR, height - newR) * 10) / 10;

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
            let c = circles[closestIdx];
            let angle = atan2(newY - c.y, newX - c.x);
            let placedX = c.x + cos(angle) * (c.r + newR);
            let placedY = c.y + sin(angle) * (c.r + newR);

            circles.push({ x: placedX, y: placedY, r: newR });
            letters.push(newLetter);
            angles.push(angle);
            // 새 원 생성 시 점선 패턴 저장 부분
            dashPatterns.push([
                random(2, 6),  // dash1
                random(1, 4),  // gap1
                random(3, 8),  // dash2
                random(2, 7)   // gap2
            ]);

            currentCount++;
        }
    }

    background(255);
    textFont(defaultFontName);
    textAlign(CENTER, CENTER);

    for (let i = 0; i < circles.length; i++) {
        let c = circles[i];
        let a = angles[i];
        let pattern = dashPatterns[i];  // 저장된 패턴 불러오기


        push();
        noFill();                     // 채우기 없음
        stroke(0, 80);                // 테두리 색
        strokeWeight(1);
        drawingContext.setLineDash(pattern);   // 점선 패턴: 5px 그리기, 5px 띄우기

        translate(c.x, c.y);
        rotate(a);
        ellipse(0, 0, c.r * 2, c.r * 2);      // 중심이 (0,0)일 때 그리기
        drawingContext.setLineDash([]);  // 기본 선으로 복원


        // 점선 스타일 해제 (다른 도형에 영향을 안 주게)
        drawingContext.setLineDash([]);
        pop();
        // 그 다음 글자 그리기
        push();
        translate(c.x, c.y);
        rotate(a);
        fill(0);
        textSize(map(c.r, 10, 45, 12, 36));
        text(letters[i], 0, 0);
        pop();
    }

    // count display
    // fill(0);
    // textAlign(LEFT, BOTTOM);
    // text(`currentCount: ${currentCount}`, 10, height - 10);
}