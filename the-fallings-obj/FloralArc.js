class FloralArc {
    /**
     * @param {number} cx 중심 x
     * @param {number} cy 중심 y
     * @param {number} count 아크 반복 횟수
     * @param {number} rMin 반지름 최소값
     * @param {number} rMax 반지름 최대값
     * @param {p5.Color} col 아크 채우기 색상
     */
    constructor(cx, cy, count, rMin, rMax, col) {
        this.cx = cx;
        this.cy = cy;
        this.count = count;
        this.rMin = rMin;
        this.rMax = rMax;
        this.col = col;
    }

    draw() {
        push();
        translate(this.cx, this.cy);
        fill(this.col);
        noStroke();
        for (let i = 0; i < this.count; i++) {
            let r = random(this.rMin, this.rMax);
            let beginAngle = random(0, TWO_PI);
            let endAngle = beginAngle + random(0, PI / 8);
            arc(0, 0, r, r, beginAngle, endAngle);
        }
        pop();
    }
}