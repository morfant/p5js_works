class RingSegment {
    constructor(startDeg, endDeg, len) {
        this.start = startDeg;
        this.end = endDeg;
        this.len = len;
    }
}

class FloralRing {
    /**
     * @param {number} cx
     * @param {number} cy
     * @param {number} startRadius
     * @param {number} radiusStep
     * @param {number} count
     * @param {number} baseBrushSize
     * @param {p5.Color} col
     * @param {object} offsetRange {offsetXMin, offsetXMax, offsetYMin, offsetYMax}
     * @param {number} baseLenStep
     * @param {object} lenOffsetRange {lenOffsetMin, lenOffsetMax}
     * @param {object} segWidthRange {segWidthMin, segWidthMax}
     * @param {number} lenNoiseStep  — noise 입력 증가폭
     */
    constructor(cx, cy, startRadius, radiusStep, count, baseBrushSize, col,
        offsetRange, baseLenStep, lenOffsetRange, segWidthRange, lenNoiseStep) {
        this.cx = cx;
        this.cy = cy;
        this.startRadius = startRadius;
        this.radiusStep = radiusStep;
        this.count = count;
        this.baseBrushSize = baseBrushSize;
        this.col = col;
        this.offsetRange = offsetRange;
        this.baseLenStep = baseLenStep;
        this.lenOffsetRange = lenOffsetRange;
        this.segWidthRange = segWidthRange;
        this.lenNoiseStep = lenNoiseStep;
        this.rings = [];

        this._createRings();
    }

    _createRings() {
        for (let i = 0; i < this.count; i++) {
            let offsetX = random(this.offsetRange.offsetXMin, this.offsetRange.offsetXMax);
            let offsetY = random(this.offsetRange.offsetYMin, this.offsetRange.offsetYMax);
            let ringCx = this.cx + offsetX;
            let ringCy = this.cy + offsetY;
            let radius = this.startRadius + i * this.radiusStep;
            let baseLen = this.baseBrushSize + i * this.baseLenStep;
            this.rings.push(new InnerRing(
                ringCx, ringCy, radius, baseLen, this.col,
                this.lenOffsetRange, this.segWidthRange, this.lenNoiseStep
            ));
        }
    }

    draw() {
        for (let ring of this.rings) {
            ring.draw();
        }
    }
}

class InnerRing {
    /**
     * @param {number} cx
     * @param {number} cy
     * @param {number} radius
     * @param {number} baseLen
     * @param {p5.Color} col
     * @param {object} lenOffsetRange
     * @param {object} segWidthRange
     * @param {number} lenNoiseStep
     */
    constructor(cx, cy, radius, baseLen, col, lenOffsetRange, segWidthRange, lenNoiseStep) {
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.baseLen = baseLen;
        this.col = col;
        this.lenOffsetRange = lenOffsetRange;
        this.segWidthRange = segWidthRange;
        this.lenNoiseStep = lenNoiseStep;

        this.lenNoiseT = random(0, 1000); // 노이즈 입력 초기값
        this.segments = this._generateSegments();
        this.steps = 500;
    }

    _generateSegments() {
        let segs = [];
        let degCursor = 0;
        while (degCursor < 360) {
            let segWidth = random(this.segWidthRange.segWidthMin, this.segWidthRange.segWidthMax);
            let segEnd = degCursor + segWidth;
            if (segEnd > 360) segEnd = 360;

            // 노이즈 값을 이용해서 길이 오프셋 생성
            let noiseVal = noise(this.lenNoiseT);
            let offset = map(noiseVal,
                0, 1,
                this.lenOffsetRange.lenOffsetMin,
                this.lenOffsetRange.lenOffsetMax);
            let len = this.baseLen + offset;

            segs.push(new RingSegment(degCursor, segEnd, len));
            degCursor = segEnd;

            this.lenNoiseT += this.lenNoiseStep;
        }
        return segs;
    }

    draw() {
        stroke(this.col);
        noFill();
        for (let i = 0; i < this.steps; i++) {
            let a = TWO_PI * i / this.steps;
            let deg = degrees(a);
            let len = this.baseLen;
            for (let seg of this.segments) {
                if (deg >= seg.start && deg < seg.end) {
                    len = seg.len;
                    break;
                }
            }
            push();
            translate(this.cx, this.cy);
            rotate(a);
            line(0, 0, len, 0);
            pop();
        }
    }
}