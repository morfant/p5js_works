// p5.js port of Generative Gestaltung P_2_3_6_02
// tileset-based drawing tool with neighbor-dependent modules

let tileSize = 10;
let gridResolutionX, gridResolutionY;

let tiles;       // char-like values: '0', 'A'..'H'
let tileColors;  // per-tile color
let activeTileColor;

let drawGridFlag = true;
let debugMode = false;
let randomMode = false;
let caRunning = true;  // cellular automaton evolution toggle
let caRule = 'life';   // 'life', 'maze', 'anneal', 'life4', 'maze4', 'anneal4'
let linesOnly = false; // 선만 표시하는 모드 토글

let modulesA = [];
let modulesB = [];
let modulesC = [];
let modulesD = [];
let modulesE = [];
let modulesF = [];
let modulesG = [];
let modulesH = [];

let modulesSets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
let activeModulesSet = 'A';

// ---------- preload: load SVG modules ----------
function preload() {
    for (let i = 0; i < 16; i++) {
        let idx = ('0' + i).slice(-2); // "00" ~ "15"

        // data 폴더 기준 경로
        modulesA[i] = loadImage(`data/A_${idx}.svg`);
        modulesB[i] = loadImage(`data/B_${idx}.svg`);
        modulesC[i] = loadImage(`data/C_${idx}.svg`);
        modulesD[i] = loadImage(`data/D_${idx}.svg`);
        modulesE[i] = loadImage(`data/E_${idx}.svg`);
        modulesF[i] = loadImage(`data/F_${idx}.svg`);
        // 원본 Processing 예제가 G 세트에 J_, H 세트에 K_를 쓰는 버전
        modulesG[i] = loadImage(`data/J_${idx}.svg`);
        modulesH[i] = loadImage(`data/K_${idx}.svg`);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight * 3 / 4);
    colorMode(HSB, 360, 100, 100, 100);
    textAlign(CENTER, CENTER);
    textSize(10);
    frameRate(5);

    gridResolutionX = Math.round(width / tileSize) + 2;
    gridResolutionY = Math.round(height / tileSize) + 2;

    tiles = new Array(gridResolutionX);
    tileColors = new Array(gridResolutionX);
    for (let x = 0; x < gridResolutionX; x++) {
        tiles[x] = new Array(gridResolutionY);
        tileColors[x] = new Array(gridResolutionY);
    }

    // 기본 활성 타일 색
    activeTileColor = color(0);
    initTiles();
}

function draw() {
    background(360);
    if (caRunning) stepCA();

    if (mouseIsPressed && mouseButton === LEFT) setTile();
    if (mouseIsPressed && mouseButton === RIGHT) unsetTile();

    // 선만 보이는 모드일 때: CA는 계속 돌고, 연결선만 그림
    if (linesOnly) {
        drawConnections();
        drawRuleOverlay();
        return;
    }

    if (drawGridFlag) drawGrid();
    drawModules();
    drawConnections();
    drawRuleOverlay();
}

// ---------- initialize tiles ----------
function initTiles() {
    for (let gridY = 0; gridY < gridResolutionY; gridY++) {
        for (let gridX = 0; gridX < gridResolutionX; gridX++) {
            // 랜덤하게 0 또는 1 개념:
            // 0 -> 비활성 타일 '0'
            // 1 -> 현재 선택된 타일셋 문자(activeModulesSet)
            const isActive = random() < 0.5; // 50% 확률로 활성

            if (isActive) {
                tiles[gridX][gridY] = activeModulesSet;
                // 활성 타일은 현재 선택된 색
                tileColors[gridX][gridY] = activeTileColor;
            } else {
                tiles[gridX][gridY] = '0';
                // 비활성 타일용: 무채색 랜덤 밝기
                tileColors[gridX][gridY] = color(random(360), 0, random(100));
            }
        }
    }
}

function clearTiles() {
    // 모든 타일을 완전히 비우는 함수 (CA 상태 초기화용)
    for (let gridY = 0; gridY < gridResolutionY; gridY++) {
        for (let gridX = 0; gridX < gridResolutionX; gridX++) {
            tiles[gridX][gridY] = '0';
            // 비활성 상태용 기본 색 (무채색 랜덤 밝기)
            tileColors[gridX][gridY] = color(random(360), 0, random(100));
        }
    }
}

function stepCA() {
    // 다음 세대 타일 상태를 계산하는 셀룰러 오토마타
    // caRule:
    //  - 'life' / 'life4'   : Conway B3/S23
    //  - 'maze' / 'maze4'   : B3/S12345
    //  - 'anneal'/'anneal4' : B4678/S35678
    //  각 *4 버전은 4-이웃(Von Neumann), 나머지는 8-이웃(Moore)

    let newTiles = new Array(gridResolutionX);
    let newTileColors = new Array(gridResolutionX);

    // 규칙별 birth / survive 집합 정의
    let birthSet = [];
    let surviveSet = [];

    if (caRule === 'life' || caRule === 'life4') {
        birthSet = [3];
        surviveSet = [2, 3];
    } else if (caRule === 'maze' || caRule === 'maze4') {
        birthSet = [3];
        surviveSet = [1, 2, 3, 4, 5];
    } else if (caRule === 'anneal' || caRule === 'anneal4') {
        birthSet = [4, 6, 7, 8];
        surviveSet = [3, 5, 6, 7, 8];
    }

    // 헬퍼: 이웃 수가 집합에 속하는지 확인
    const inSet = (set, n) => set.indexOf(n) !== -1;

    // 헬퍼: 이웃 alive 카운트 (4-이웃 / 8-이웃)
    function countAliveNeighbors(x, y) {
        let count = 0;

        if (caRule === 'life4' || caRule === 'maze4' || caRule === 'anneal4') {
            // 4-이웃 (Von Neumann)
            const offsets = [
                [0, -1], // N
                [-1, 0], // W
                [1, 0],  // E
                [0, 1]   // S
            ];
            for (let i = 0; i < offsets.length; i++) {
                const dx = offsets[i][0];
                const dy = offsets[i][1];
                if (tiles[x + dx][y + dy] !== '0') {
                    count++;
                }
            }
        } else {
            // 8-이웃 (Moore)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    if (tiles[x + dx][y + dy] !== '0') {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    // 기존 상태 복사
    for (let x = 0; x < gridResolutionX; x++) {
        newTiles[x] = new Array(gridResolutionY);
        newTileColors[x] = new Array(gridResolutionY);
        for (let y = 0; y < gridResolutionY; y++) {
            newTiles[x][y] = tiles[x][y];
            newTileColors[x][y] = tileColors[x][y];
        }
    }

    // 내부 셀만 업데이트 (경계는 그대로 두기)
    for (let gridX = 1; gridX < gridResolutionX - 1; gridX++) {
        for (let gridY = 1; gridY < gridResolutionY - 1; gridY++) {
            let isAlive = tiles[gridX][gridY] !== '0';
            let aliveNeighbors = countAliveNeighbors(gridX, gridY);

            if (isAlive) {
                if (inSet(surviveSet, aliveNeighbors)) {
                    // 그대로 유지
                    newTiles[gridX][gridY] = tiles[gridX][gridY];
                    newTileColors[gridX][gridY] = tileColors[gridX][gridY];
                } else {
                    // 죽음
                    newTiles[gridX][gridY] = '0';
                }
            } else {
                if (inSet(birthSet, aliveNeighbors)) {
                    // 탄생: 현재 선택된 타일셋/색 사용
                    newTiles[gridX][gridY] = activeModulesSet;
                    newTileColors[gridX][gridY] = activeTileColor;
                } else {
                    newTiles[gridX][gridY] = '0';
                }
            }
        }
    }

    tiles = newTiles;
    tileColors = newTileColors;
}

// ---------- set/unset tiles ----------
function setTile() {
    let gridX = Math.floor(mouseX / tileSize) + 1;
    gridX = constrain(gridX, 1, gridResolutionX - 2);
    let gridY = Math.floor(mouseY / tileSize) + 1;
    gridY = constrain(gridY, 1, gridResolutionY - 2);

    tiles[gridX][gridY] = activeModulesSet;
    tileColors[gridX][gridY] = activeTileColor;
}

function unsetTile() {
    let gridX = Math.floor(mouseX / tileSize) + 1;
    gridX = constrain(gridX, 1, gridResolutionX - 2);
    let gridY = Math.floor(mouseY / tileSize) + 1;
    gridY = constrain(gridY, 1, gridResolutionY - 2);

    tiles[gridX][gridY] = '0';
}

// ---------- grid drawing ----------
function drawGrid() {
    rectMode(CENTER);
    stroke(0);
    strokeWeight(0.5);
    noFill();

    for (let gridY = 0; gridY < gridResolutionY; gridY++) {
        for (let gridX = 0; gridX < gridResolutionX; gridX++) {
            let posX = tileSize * gridX - tileSize / 2;
            let posY = tileSize * gridY - tileSize / 2;

            rect(posX, posY, tileSize, tileSize);
        }
    }
}

// ---------- modules drawing ----------
function drawModules() {
    if (randomMode) {
        // 매 프레임 다른 타일셋을 사용 (원본의 r 모드 느낌)
        activeModulesSet = modulesSets[int(random(modulesSets.length))];
    }

    imageMode(CENTER);
    noStroke();

    for (let gridY = 1; gridY < gridResolutionY - 1; gridY++) {
        for (let gridX = 1; gridX < gridResolutionX - 1; gridX++) {
            let currentTile = tiles[gridX][gridY];
            // '0' 이 아닌 칸만 그림
            if (currentTile !== '0') {
                // 북, 서, 남, 동 이웃 체크
                let binaryResult = '';

                // north
                if (tiles[gridX][gridY - 1] !== '0') binaryResult += '1';
                else binaryResult += '0';

                // west
                if (tiles[gridX - 1][gridY] !== '0') binaryResult += '1';
                else binaryResult += '0';

                // south
                if (tiles[gridX][gridY + 1] !== '0') binaryResult += '1';
                else binaryResult += '0';

                // east
                if (tiles[gridX + 1][gridY] !== '0') binaryResult += '1';
                else binaryResult += '0';

                let decimalResult = unbinary(binaryResult); // 0~15

                let posX = tileSize * gridX - tileSize / 2;
                let posY = tileSize * gridY - tileSize / 2;

                // 색상 적용 (tint는 SVG 원색 위에 곱해짐)
                let col = tileColors[gridX][gridY];
                tint(hue(col), saturation(col), brightness(col), alpha(col));

                let modImg = null;
                switch (currentTile) {
                    case 'A':
                        modImg = modulesA[decimalResult];
                        break;
                    case 'B':
                        modImg = modulesB[decimalResult];
                        break;
                    case 'C':
                        modImg = modulesC[decimalResult];
                        break;
                    case 'D':
                        modImg = modulesD[decimalResult];
                        break;
                    case 'E':
                        modImg = modulesE[decimalResult];
                        break;
                    case 'F':
                        modImg = modulesF[decimalResult];
                        break;
                    case 'G':
                        modImg = modulesG[decimalResult];
                        break;
                    case 'H':
                        modImg = modulesH[decimalResult];
                        break;
                }

                if (modImg) {
                    image(modImg, posX, posY, tileSize, tileSize);
                }

                if (debugMode) {
                    noTint();
                    fill(0, 0, 20, 80);
                    rect(posX, posY, tileSize, tileSize);

                    fill(0, 0, 100);
                    noStroke();
                    text(
                        currentTile + '\n' + decimalResult + '\n' + binaryResult,
                        posX,
                        posY
                    );
                }
            }
        }
    }

    noTint(); // 다음 그리기를 위해 tint 초기화
}

// ---------- connections drawing ----------
function drawConnections() {
    // 활성(켜진) 타일들 사이를 선으로 이어주는 함수
    // 동/남/대각선(남동, 남서) 이웃만 연결해서 중복 선 방지
    strokeWeight(1);
    noFill();

    for (let gridY = 1; gridY < gridResolutionY - 1; gridY++) {
        for (let gridX = 1; gridX < gridResolutionX - 1; gridX++) {
            if (tiles[gridX][gridY] !== '0') {
                let x1 = tileSize * gridX - tileSize / 2;
                let y1 = tileSize * gridY - tileSize / 2;
                let col = tileColors[gridX][gridY];

                // 각 타일 색을 선 색으로 사용 (살짝 투명)
                stroke(hue(col), saturation(col), brightness(col), 80);

                // 동쪽 이웃
                if (tiles[gridX + 1][gridY] !== '0') {
                    let x2 = tileSize * (gridX + 1) - tileSize / 2;
                    let y2 = y1;
                    line(x1, y1, x2, y2);
                }
                // 남쪽 이웃
                if (tiles[gridX][gridY + 1] !== '0') {
                    let x2 = x1;
                    let y2 = tileSize * (gridY + 1) - tileSize / 2;
                    line(x1, y1, x2, y2);
                }
                // 남동 대각선 이웃
                if (tiles[gridX + 1][gridY + 1] !== '0') {
                    let x2 = tileSize * (gridX + 1) - tileSize / 2;
                    let y2 = tileSize * (gridY + 1) - tileSize / 2;
                    line(x1, y1, x2, y2);
                }
                // 남서 대각선 이웃
                if (tiles[gridX - 1][gridY + 1] !== '0') {
                    let x2 = tileSize * (gridX - 1) - tileSize / 2;
                    let y2 = tileSize * (gridY + 1) - tileSize / 2;
                    line(x1, y1, x2, y2);
                }
            }
        }
    }

    noStroke();
}

function drawRuleOverlay() {
    const label = getRuleLabel();
    const keymap = getRuleKeymap();
    if (!label && !keymap) return;

    push();
    noStroke();
    // 반투명 박스
    fill(0, 0, 0, 40);
    rect(0, 0, 1600, 150);
    // 텍스트는 흰색
    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);

    let x = 10;
    let y = 10;

    if (label) {
        text(label, x, y);
        y += 24;
    }
    if (keymap) {
        text(keymap, x, y);
    }

    pop();
}

// ---------- util: unbinary & binary ----------
function getRuleLabel() {
    switch (caRule) {
        case 'life':
            return 'Rule: Life (B3/S23, 8-neighbor)';
        case 'life4':
            return 'Rule: Life (B3/S23, 4-neighbor)';
        case 'maze':
            return 'Rule: Maze (B3/S12345, 8-neighbor)';
        case 'maze4':
            return 'Rule: Maze (B3/S12345, 4-neighbor)';
        case 'anneal':
            return 'Rule: Anneal (B4678/S35678, 8-neighbor)';
        case 'anneal4':
            return 'Rule: Anneal (B4678/S35678, 4-neighbor)';
        default:
            return '';
    }
}

function getRuleKeymap() {
    // CA 관련 키맵 안내 문자열
    // 규칙 전환: L/M/A/F/Z/X, 재생/정지: Space, 초기화: Del/Backspace, 비우기: N, 선만 보기: Q
    return 'Keys: L/M/A/F/Z/X = rule, Q = lines only, Space = play/pause, Del/Back = random init, N = clear';
}

function unbinary(str) {
    return parseInt(str, 2);
}

function binary(value, digits) {
    let str = (value >>> 0).toString(2);
    if (digits !== undefined) {
        while (str.length < digits) {
            str = '0' + str;
        }
    }
    return str;
}

// ---------- key handling ----------
function keyReleased() {
    // 저장
    if (key === 's' || key === 'S') {
        saveCanvas('tileset_' + Date.now(), 'png');
    }

    // 초기화 (랜덤 패턴 다시 생성)
    if (keyCode === DELETE || keyCode === BACKSPACE) {
        initTiles();
    }

    // 완전히 비우기 (모든 타일을 '0'으로)
    if (key === 'n' || key === 'N') {
        clearTiles();
    }

    // CA 재생/정지
    if (key === ' ') {
        caRunning = !caRunning;
    }

    // 토글
    if (key === 'g' || key === 'G') drawGridFlag = !drawGridFlag;
    if (key === 'd' || key === 'D') debugMode = !debugMode;
    if (key === 'r' || key === 'R') randomMode = !randomMode;

    // 선만 보이는 모드 토글 (Q)
    if (key === 'q' || key === 'Q') {
        linesOnly = !linesOnly;
    }

    // CA 규칙 전환
    // L: Life (8-이웃), M: Maze, A: Anneal, F: Life 4-이웃
    if (key === 'l' || key === 'L') caRule = 'life';
    if (key === 'm' || key === 'M') caRule = 'maze';
    if (key === 'a' || key === 'A') caRule = 'anneal';
    if (key === 'f' || key === 'F') caRule = 'life4';

    // Maze / Anneal 4-이웃 버전
    // Z: Maze 4-neighbor, X: Anneal 4-neighbor
    if (key === 'z' || key === 'Z') caRule = 'maze4';
    if (key === 'x' || key === 'X') caRule = 'anneal4';

    // 타일셋 선택
    if (key === '1') activeModulesSet = 'A';
    if (key === '2') activeModulesSet = 'B';
    if (key === '3') activeModulesSet = 'C';
    if (key === '4') activeModulesSet = 'D';
    if (key === '5') activeModulesSet = 'E';
    if (key === '6') activeModulesSet = 'F';
    if (key === '7') activeModulesSet = 'G';
    if (key === '8') activeModulesSet = 'H';

    // 색상 선택 (원본 y,x,c,v,b 키)
    if (key === 'y' || key === 'Y') activeTileColor = color(0);
    if (key === 'x' || key === 'X') activeTileColor = color(52, 100, 71);
    if (key === 'c' || key === 'C') activeTileColor = color(192, 100, 64);
    if (key === 'v' || key === 'V') activeTileColor = color(273, 73, 51);
    if (key === 'b' || key === 'B') activeTileColor = color(323, 100, 77);
}

// 윈도우 리사이즈 대응(선택사항)
function windowResized() {
    resizeCanvas(windowWidth, windowHeight * 3 / 4);

    gridResolutionX = Math.round(width / tileSize) + 2;
    gridResolutionY = Math.round(height / tileSize) + 2;

    tiles = new Array(gridResolutionX);
    tileColors = new Array(gridResolutionX);
    for (let x = 0; x < gridResolutionX; x++) {
        tiles[x] = new Array(gridResolutionY);
        tileColors[x] = new Array(gridResolutionY);
    }
    initTiles();
}