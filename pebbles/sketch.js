let maxRadius = 80;
let minRadius = 2;

let pebbles = [];
const NOISE_SCALE = 0.4;    // spatial noise scale for surface jitter, 선의 매끄러움
const JITTER_RATIO = 0.52;  // max radial jitter as a fraction of radius, 원 형태를 이루는 곡선의 임의성
let showOverlay = true;     // overlay toggle

class Pebble {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.seed = random(10000);
        this.segments = max(12, floor(map(r, minRadius, maxRadius, 16, 48)));
        this.jitterRatio = JITTER_RATIO;
    }

    effectiveRadius() {
        // conservative packing radius accounting for possible jitter
        return this.r * (0.5 + this.jitterRatio); // 돌 사이의 간격 JITTER_RATIO에 비례. JITTER_RATIO가 클 때는 줄여줘야 함. 
    }

    draw(t) {
        // draw a closed, wiggly polyline ('pebble')
        beginShape();
        for (let i = 0; i < this.segments; i++) {
            const a = (i / this.segments) * TWO_PI;
            const ux = cos(a);
            const uy = sin(a);
            // Fixed shape (time-invariant) noise:
            const n = noise(this.seed + ux * NOISE_SCALE, this.seed + uy * NOISE_SCALE);
            // For animated shapes, use this instead:
            // const n = noise(this.seed + ux * NOISE_SCALE, this.seed + uy * NOISE_SCALE, t * 0.1);
            const jitter = (n - 0.5) * 2 * this.r * this.jitterRatio; // symmetric around 0
            const rad = this.r + jitter;
            const vx = this.x + ux * rad;
            const vy = this.y + uy * rad;
            vertex(vx, vy);
        }
        endShape(CLOSE);
    }
}

function setup() {
    createCanvas(800, 800)
    noFill();
    stroke(0);
    strokeWeight(1);
}

function draw() {
    // background(255)
    background(142, 129, 185);
    noFill();
    stroke(255);

    const currentCount = pebbles.length;
    for (let attempt = 0; attempt < 1; attempt++) { // 한 프레임당 10개 시도


        let newX = random(0 - maxRadius, width + maxRadius);
        let newY = random(0 - maxRadius, height + maxRadius);
        let newR = minRadius;

        let intersection = false;
        for (let i = 0; i < currentCount; i++) {
            const p = pebbles[i];
            const d = dist(newX, newY, p.x, p.y);
            if (d < newR + p.effectiveRadius()) {
                intersection = true;
                break;
            }
        }

        if (intersection == false) {
            let newRadius = width;
            for (let i = 0; i < currentCount; i++) {
                const p = pebbles[i];
                const d = dist(newX, newY, p.x, p.y);
                if (newRadius > d - p.effectiveRadius()) {
                    newRadius = d - p.effectiveRadius();
                }
            }

            if (newRadius > maxRadius) newRadius = maxRadius;
            pebbles.push(new Pebble(newX, newY, newRadius));
        }
    }

    for (let i = 0; i < pebbles.length; i++) {
        const p = pebbles[i];
        if (p && typeof p.draw === 'function') {
            // stroke thickness proportional to radius
            const w = constrain(map(p.r, minRadius, maxRadius, 0.6, 1.5), 0.5, 6);
            strokeWeight(w);
            p.draw(frameCount / 60);
        }
    }

    if (showOverlay) {
        noStroke();
        fill(255);
        rect(0, 0, 140, 42);
        fill(0);
        textSize(12);
        text(`Count: ${pebbles.length}`, 10, 18);
        text(`FPS: ${nf(frameRate(), 2, 2)}`, 10, 35);
    }
}

function keyPressed() {
    if (key === 'o' || key === 'O') {
        showOverlay = !showOverlay;
    }
}