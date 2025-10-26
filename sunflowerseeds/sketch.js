var n = 0
var c = 3
var x = 0
var y = 0
var theta = 0

function setup() {
    createCanvas(400, 400)
    background(0)
    fill(255)
}

function draw() {

    n = n + 1
    theta = n * 137.5
    r = c * sqrt(n)

    x = r * cos(theta)
    y = r * sin(theta)

    ellipse(x + width / 2, y + height / 2, 6, 6)

}