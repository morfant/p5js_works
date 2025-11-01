let shaderProgram;
let startTime;
let counter = 0;
let rnd = 1.0;
let cnt_100 = 1.0;

function preload() {
  // Load shaders before setup runs
  shaderProgram = loadShader("shader.vert", "shader.frag");
}

function setup() {
  createCanvas(600, 600, WEBGL);
  noStroke();
  startTime = millis();
}

function draw() {
  background(0);

  let t = frameCount * 0.01;
  counter = counter + 0.5;
  counter = counter % 200;
  if (counter % 10 == 0) cnt_100+=0.1;
  cnt_100 = cnt_100 % 3.14;
  // print(counter);

  let utime = (millis() - startTime) / 1000.0;

  // let rnd = 1 * noise(t);
  // rnd = 1.0;
  if (counter % 8 == 0) rnd = random(0.1, 20) * (sin(cnt_100) + 1);

  // Compute the noise values.
  // print(rnd)

  // Pass uniforms to the shader
  shaderProgram.setUniform("u_resolution", [width, height]);
  shaderProgram.setUniform("u_time", counter);
  shaderProgram.setUniform("u_rnd", rnd);
  shaderProgram.setUniform("u_mouse", [mouseX, height - mouseY]);

  shader(shaderProgram);
  // Render a rectangle that covers the entire canvas
  rect(0, 0, width, height);
}
