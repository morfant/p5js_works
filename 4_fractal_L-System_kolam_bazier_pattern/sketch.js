// var current = [...'X']
// var current = [...'AAAA']
var current = [...'F+XF+F+XF']
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

function computeBounds(theta) {
	let ta = 90
	let tx = 0
	let ty = 0
	let minX = tx
	let maxX = tx
	let minY = ty
	let maxY = ty
	const stack = []

	const updateBounds = (x, y) => {
		if (x < minX) minX = x
		if (x > maxX) maxX = x
		if (y < minY) minY = y
		if (y > maxY) maxY = y
	}

	for (let i = 0; i < current.length; i++) {
		const c = current[i]
		if (c === 'F') {
			tx += cos(ta)
			ty -= sin(ta)
			updateBounds(tx, ty)
		} else if (c === 'f') {
			tx += cos(ta) * 0.7
			ty -= sin(ta) * 0.7
			updateBounds(tx, ty)
		} else if (c === 'd') {
			ta += theta / 2
			tx += cos(ta) * 0.3
			ty -= sin(ta) * 0.3
			updateBounds(tx, ty)
			ta += theta / 2
		} else if (c === 'D') {
			ta -= theta / 2
			tx += cos(ta) * 0.3
			ty -= sin(ta) * 0.3
			updateBounds(tx, ty)
			ta -= theta / 2
		} else if (c === 'G') {
			tx += cos(ta)
			ty -= sin(ta)
			updateBounds(tx, ty)
			ta -= theta
			tx += cos(ta)
			ty -= sin(ta)
			updateBounds(tx, ty)
		} else if (c === '+') {
			ta += theta
		} else if (c === '-') {
			ta -= theta
		} else if (c === '[') {
			stack.push(tx, ty, ta)
		} else if (c === ']') {
			ta = stack.pop()
			ty = stack.pop()
			tx = stack.pop()
			updateBounds(tx, ty)
		}
	}

	return {
		minX,
		maxX,
		minY,
		maxY
	}
}

function setup() {

	createCanvas(1000, 1000);
	angleMode(DEGREES)
	colorMode(HSB)

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
	if (vertices.length) {
		curveVertex(vertices[0].x, vertices[0].y)
		for (let i = 0; i < vertices.length; i++) {
			stroke(100, 100, 100)
			strokeWeight(1)
			noFill()
			curveVertex(vertices[i].x, vertices[i].y)
		}
		curveVertex(vertices[vertices.length-1].x, vertices[vertices.length-1].y)
	}
	endShape()

	for (let i = 0; i < vertices.length; i++) {
		fill(0, 100, 100)
		ellipse(vertices[i].x, vertices[i].y, 5)
	}

	for (let i = 0; i < vertices_x.length; i++) {
		fill(180, 100, 100)
		ellipse(vertices_x[i].x, vertices_x[i].y, 5)
	}
}

function drawBezier() {
	// console.log("drawCurves()")
	beginShape()
	if (vertices.length) {
		vertex(vertices[0].x, vertices[0].y)
		for (let i = 1; i < vertices.length; i++) {
			strokeWeight(1)
			noFill()
			if (i > 1 && i < vertices.length - 3) {
				stroke(0, 0, 100, 0.3)
				strokeWeight(1)
				bezierVertex(vertices[i - 2].x, vertices[i - 2].y, vertices[i + 1].x, vertices[i + 1].y, vertices[i + 3].x, vertices[i + 1].y)
			}
			// console.log(vertices[i].x)
			// console.log(vertices[i].y)
		}
	}
	endShape()

	beginShape()
	if (vertices.length) {
		vertex(vertices[0].x, vertices[0].y)
		for (let i = 1; i < vertices.length; i++) {
			strokeWeight(3)
			noFill()
			if (i > 1 && i < vertices.length - 3) {
				stroke(200, 100, 100, 0.5)
				bezierVertex(vertices[i - 1].x, vertices[i - 1].y, vertices[i + 1].x, vertices[i + 1].y, vertices[i + 2].x, vertices[i + 2].y)
			}
			// console.log(vertices[i].x)
			// console.log(vertices[i].y)
		}
	}
	endShape()





	for (let i = 0; i < vertices.length; i++) {
		stroke(200, 100, 100)
		noStroke()
		fill(0, 100, 100)
		ellipse(vertices[i].x, vertices[i].y, 1)
	}
}




function draw() {

	// background(197, 42, 63, 0.5)
	background(0)

	// Angle in degrees
	var theta = 90
	var bounds = computeBounds(theta)
	var spanX = bounds.maxX - bounds.minX
	var spanY = bounds.maxY - bounds.minY
	if (spanX === 0) spanX = 1
	if (spanY === 0) spanY = 1
	var scale = Math.min(width / spanX, height / spanY) * 0.95
	var step_radius = Math.max(2, scale * 0.6)
	var marginX = (width - spanX * scale) / 2
	var marginY = (height - spanY * scale) / 2
	var offsetX = marginX - bounds.minX * scale
	var offsetY = marginY - bounds.minY * scale

	var toScreenX = (x) => x * scale + offsetX
	var toScreenY = (y) => y * scale + offsetY

	// Initial theta, position (logical coordinates)
	var ta = 90 
	var tx = 0
	var ty = 0
	var sx = toScreenX(tx)
	var sy = toScreenY(ty)
	var th_step = 10 
	var hue_max = 360 
	var hue_min = 40
	var th = hue_min 
	col = th

	// stroke(200, 100, 100)
	stroke(0, 0, 90)
	fill(count * 10, 100, 100)
	strokeWeight(1)

	vertices = []
	vertices_x = []
	s = []

	if (current.length > 0) {
		// ellipse(tx, ty, 10, 10) // start point
		// stroke(100, random(150), 150, 255 - (count * 20))
		// stroke("SteelBlue")
		for (let i = 0; i < current.length; i++) {
			let c = current[i]
			let vx = 0
			if (c == 'F') {
				stroke(col, 80, 90, 0.3)
				strokeWeight(1)
				var new_tx = tx + cos(ta)
				var new_ty = ty - sin(ta)
				var new_sx = toScreenX(new_tx)
				var new_sy = toScreenY(new_ty)
				line(sx, sy, new_sx, new_sy)
				tx = new_tx
				ty = new_ty
				sx = new_sx
				sy = new_sy
				let v = createVector(sx, sy)
				vertices.push(v)
			} else if (c == 'f') {
				stroke(0, 80, 90)
				strokeWeight(1)
				var new_tx = tx + cos(ta) * 0.7
				var new_ty = ty - sin(ta) * 0.7
				tx = new_tx
				ty = new_ty
				sx = toScreenX(tx)
				sy = toScreenY(ty)

			}  else if (c == 'X') {
				let v = createVector(sx, sy)
				vertices_x.push(v)
				// vertices.pop()
			}
			else if (c == 'd') {

				stroke(40, 80, 90)
				strokeWeight(1)
				ta += theta/2
				var new_tx = tx + cos(ta) * 0.3
				var new_ty = ty - sin(ta) * 0.3
				var new_sx = toScreenX(new_tx)
				var new_sy = toScreenY(new_ty)
				line(sx, sy, new_sx, new_sy)
				tx = new_tx
				ty = new_ty
				sx = new_sx
				sy = new_sy
				ta += theta/2

			} else if (c == 'D') {
				stroke(40, 80, 90)
				strokeWeight(1)
				ta -= theta/2
				var new_tx = tx + cos(ta) * 0.3
				var new_ty = ty - sin(ta) * 0.3
				var new_sx = toScreenX(new_tx)
				var new_sy = toScreenY(new_ty)
				line(sx, sy, new_sx, new_sy)
				tx = new_tx
				ty = new_ty
				sx = new_sx
				sy = new_sy
				ta -= theta/2
			} else if (c == 'G') { // F-F
				var new_tx = tx + cos(ta)
				var new_ty = ty - sin(ta)
				var new_sx = toScreenX(new_tx)
				var new_sy = toScreenY(new_ty)
				line(sx, sy, new_sx, new_sy)
				tx = new_tx
				ty = new_ty
				sx = new_sx
				sy = new_sy
				ta -= theta
				new_tx = tx + cos(ta)
				new_ty = ty - sin(ta)
				new_sx = toScreenX(new_tx)
				new_sy = toScreenY(new_ty)
				line(sx, sy, new_sx, new_sy)
				tx = new_tx
				ty = new_ty
				sx = new_sx
				sy = new_sy
			} else if (c == '+') { // left
				ta += theta
			} else if (c == '-') { // right
				// console.log("-");
				ta -= theta
				// ta -= (theta + (1 - noise(frameCount/20))) 
			} else if (c == '[') {
				s.push(tx)
				s.push(ty)
				s.push(ta)
			} else if (c == ']') {
				ta = s.pop()
				ty = s.pop()
				tx = s.pop()
				sx = toScreenX(tx)
				sy = toScreenY(ty)
			} else if (c == 'C') {
				noStroke()
				fill(100, 100, 100)
				ellipse(sx, sy, step_radius)
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

	// drawCurves()
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
			// next.push(..."[-F+F[Y]+F][+F-F[X]-F]")
			// next.push(..."[F+F+F+F[---X-HY]+++++F++++++++F-F-F-F]")
			// next.push(..."XF-fDf+XF+F+XfDf-F+X")
			next.push(..."XF-F-F+XF+F+XF-F-F+X")
		} else if (c === 'Y') {
			// next.push(..."[-F+F[Y]+F][+F-F-F]")
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
