var n = 0
var c = 3
var x = 0
var y = 0
var theta = 0

function setup() {
    createCanvas(400, 400)
    background(0)
    angleMode(DEGREES)
    fill(255)
}

function draw() {

    n = n + 1
    theta = n * 137.5
    r = c * sqrt(n)

    x = r * cos(theta)
    y = r * sin(theta)

    if (r < 20) {
        fill(66, 134, 244)
    } else if (r < 50) {
        fill(38, 127, 53)
    } else {
        fill(255)
    }

    ellipse(x + width / 2, y + height / 2, 6, 6)

    stroke(228, 239, 141) // stroke color
    strokeWeight(0.4)

}