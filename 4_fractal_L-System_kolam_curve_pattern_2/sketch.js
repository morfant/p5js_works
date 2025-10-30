// var current = [...'X']
// var current = [...'AAAA']
var current = [...'-X--X']
// var current = [...'F']
// var current = [...'X']
var axiom = current
var next = []
var count = 0
var s = []

var D = 0
var R = 0
var slider
var col = 0

var vertices = []
var vertices_x = []

var step_size = 20 

function setup() {

	createCanvas(1000, 1000);
	angleMode(DEGREES)
	colorMode(HSB)
	// blendMode(SCREEN)
	// blendMode(LIGHTEST)
	// blendMode(MULTIPLY)
	blendMode(ADD)
	// blendMode(DARKEST)
	// blendMode(DIFFERENCE)
	// blendMode(EXCLUSION)
	// blendMode(REPLACE)
	// blendMode(OVERLAY)
	// blendMode(HARD_LIGHT)
	// blendMode(SOFT_LIGHT)
	// blendMode(DODGE)
	// blendMode(BURN)

	var n = 5 

	for (let i = 0; i < n; i++) {
		getResult()
	}
	console.log(current.join(''));

	// drawCurves()
	// drawBezier()
	noLoop()
}


function drawCurves() {
	// console.log("drawCurves()")
	beginShape()
	if (vertices_x.length) {
		stroke(180, 100, 70)
		strokeWeight(2)
		// fill(180, 100, 100)
		noFill()
		curveVertex(vertices_x[0].x, vertices_x[0].y)
		for (let i = 0; i < vertices_x.length; i+=3) {
			curveVertex(vertices_x[i].x, vertices_x[i].y)
		}
		curveVertex(vertices_x[vertices_x.length-1].x, vertices_x[vertices_x.length-1].y)
	}
	endShape()

	for (let i = 0; i < vertices_x.length; i++) {
		fill(180, 100, 100)
		// ellipse(vertices_x[i].x, vertices_x[i].y, 5)
	}
}

function drawBezier() {
	// console.log("drawCurves()")
	beginShape()
	if (vertices_x.length) {
		vertex(vertices_x[0].x, vertices_x[0].y)
		for (let i = 1; i < vertices_x.length; i+=2) {
			strokeWeight(1)
			noFill()
			if (i > 2 && i < vertices_x.length - 2) {
				stroke(0, 0, 100)
				strokeWeight(1)
				bezierVertex(vertices_x[i].x, vertices_x[i].y, vertices_x[i - 2].x, vertices_x[i - 2].y, vertices_x[i + 2].x, vertices_x[i + 2].y)
			}
		}
	}
	endShape()

	// beginShape()
	// if (vertices.length) {
	// 	vertex(vertices[0].x, vertices[0].y)
	// 	for (let i = 1; i < vertices.length; i++) {
	// 		strokeWeight(3)
	// 		noFill()
	// 		if (i > 1 && i < vertices.length - 3) {
	// 			stroke(200, 100, 100, 0.5)
	// 			bezierVertex(vertices[i - 1].x, vertices[i - 1].y, vertices[i + 1].x, vertices[i + 1].y, vertices[i + 2].x, vertices[i + 2].y)
	// 		}
	// 		// console.log(vertices[i].x)
	// 		// console.log(vertices[i].y)
	// 	}
	// }
	// endShape()





	for (let i = 0; i < vertices_x.length; i++) {
		stroke(200, 100, 100)
		noStroke()
		fill(0, 100, 100)
		ellipse(vertices_x[i].x, vertices_x[i].y, 1)
	}
}




function draw() {

	// background(197, 42, 63, 0.5)
	colorMode(RGB)
	background(5)
	colorMode(HSB)

	// Angle in degrees
	var theta = 45 
	var step_radius = 5 

	// Initial theta, position
	var ta = 90 
	var tx = 60 
	var ty = height/2
	var th_step = 10 
	var hue_max = 360 
	var hue_min = 40
	var th = hue_min 
	col = th

	// stroke(200, 100, 100)
	stroke(0, 0, 90)
	fill(count * 10, 100, 100)
	strokeWeight(1)

	if (current.length > 0) {
		// ellipse(tx, ty, 10, 10) // start point
		// stroke(100, random(150), 150, 255 - (count * 20))
		// stroke("SteelBlue")
		for (let i = 0; i < current.length; i++) {
			let c = current[i]
			let vx = 0
			if (c == 'F') {
				stroke(col, 80, 90)
				strokeWeight(2)
				var new_x = tx + (step_size * cos(ta))
				var new_y = ty - (step_size * sin(ta))
				// line(tx, ty, new_x, new_y)
				// curve(tx, ty, tx, ty, new_x, new_y, new_x, new_y)
				tx = new_x
				ty = new_y
				// let v = createVector(tx, ty)
				// vertices.push(v)
			} else if (c == 'f') {
				stroke(0, 80, 90)
				strokeWeight(1)
				var new_x = tx + (step_size * cos(ta)) * 0.7
				var new_y = ty - (step_size * sin(ta)) * 0.7
				line(tx, ty, new_x, new_y)
				// curve(tx, ty, tx, ty, new_x, new_y, new_x, new_y)
				tx = new_x
				ty = new_y

			}  else if (c == 'X') {
				// let v = createVector(tx, ty)
				// vertices_x.push(v)
				// vertices.pop()
			}
			else if (c == 'd') {

				stroke(40, 80, 90)
				strokeWeight(1)
				ta += theta/2
				var new_x = tx + (step_size * cos(ta)) * 0.3
				var new_y = ty - (step_size * sin(ta)) * 0.3
				line(tx, ty, new_x, new_y)
				// curve(tx, ty, tx, ty, new_x, new_y, new_x, new_y)
				tx = new_x
				ty = new_y
				ta += theta/2

			} else if (c == 'D') {
				stroke(40, 80, 90)
				strokeWeight(1)
				ta -= theta/2
				var new_x = tx + (step_size * cos(ta)) * 0.3
				var new_y = ty - (step_size * sin(ta)) * 0.3
				line(tx, ty, new_x, new_y)
				// curve(tx, ty, tx, ty, new_x, new_y, new_x, new_y)
				tx = new_x
				ty = new_y
				ta -= theta/2
			} else if (c == 'G') { // F-F
				var new_x = tx + (step_size * cos(ta))
				var new_y = ty - (step_size * sin(ta))
				line(tx, ty, new_x, new_y)
				tx = new_x
				ty = new_y
				ta -= theta
				var new_x = tx + (step_size * cos(ta))
				var new_y = ty - (step_size * sin(ta))
				line(tx, ty, new_x, new_y)
				tx = new_x
				ty = new_y
			} else if (c == '+') { // left
				ta += theta
			} else if (c == '-') { // right
				// console.log("-");
				ta -= theta
				// ta -= (theta + (1 - noise(frameCount/20))) 
				let v = createVector(tx, ty)
				vertices_x.push(v)
			} else if (c == '[') {
				s.push(tx)
				s.push(ty)
				s.push(ta)
			} else if (c == ']') {
				ta = s.pop()
				ty = s.pop()
				tx = s.pop()
			} else if (c == 'C') {
				noStroke()
				fill(100, 100, 100)
				ellipse(tx, ty, step_radius)
			} else if (c == 'H') {
				th += th_step
				if (th > hue_max) {
					th = th - (hue_max - hue_min)
				}
				fill(th, 100, 100, 0.2)
				col = th
			}
		}
	}

	drawCurves()
	drawBezier()



}

function getResult() {
	next = []
	for (var i = 0; i < current.length; i++) {

		let c = current[i]
		let x = 0

		// Rules
		if (c == 'F') {
			next.push(c)
		} else if (c == 'f') {
			next.push(c)
		} else if (c == "A") {
			next.push(..."X+X+X+X+X+X+")
		} else if (c === 'X') {
			next.push(..."XFX--XFX")
		} else if (c === 'Y') {
			next.push(..."[F+F+F+F[---Y]+++++F++++++++F-F-F-F]")
		}

		 else if ('0123456789'.indexOf(c) === -1) {
			// if (c !== ";") {
				// console.log("not number")
				// console.log(c)
				next.push(c)
			// }
		}
	}

	current = next
	// console.log(current)
	// console.log(current.join(''))
	count++

}

function keyPressed() {
	if (keyCode === UP_ARROW) {
		current = axiom
		next = []
	}
}