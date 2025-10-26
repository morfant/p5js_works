var x = 0
var y = 0
var theta = 0
var k = 6

function setup() {
    createCanvas(400, 400)
    background(0)
    angleMode(DEGREES)
    fill(255)
}

function draw() {

    var r = cos(k * theta)

    x = r * cos(theta) * 100
    y = r * sin(theta) * 100

    theta = theta + 1
    ellipse(x + width / 2, y + height / 2, 6, 6)

    stroke(228, 239, 141)
    strokeWeight(0.4)

}