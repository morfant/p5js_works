// ——— Sketch state ———
let isPaused = false;
let t = 0; // time accumulator (seconds)
let seedRand, seedNoise; // reproducibility seeds
let frozenImg = null; // p5.Image of the frozen frame
let frozenT = null; // time captured at freeze for reproducible print
const snapshots = []; // {img, t, seedRand, seedNoise, when}

// UI elements
const $freeze = document.getElementById('btn-freeze');
const $resume = document.getElementById('btn-resume');
const $snapshot = document.getElementById('btn-snapshot');
const $download = document.getElementById('btn-download');
const $print = document.getElementById('btn-print');
const $badge = document.getElementById('badge');
const $grid = document.getElementById('grid');
const $speed = document.getElementById('speed');
const $detail = document.getElementById('detail');

// ——— p5 setup/draw ———
function setup() {
  // Attach canvas into our holder
  const holder = document.getElementById('canvas-holder');
  const w = Math.min(1000, window.innerWidth - 32);
  const h = Math.round(w * 0.62);
  const cnv = createCanvas(w, h);
  cnv.parent(holder);

  pixelDensity(Math.min(2, window.devicePixelRatio || 1));

  // initial seeds for reproducibility
  seedRand = Math.floor(Math.random() * 1e9);
  seedNoise = Math.floor(Math.random() * 1e9);

  background(8);
}

function windowResized() {
  const holder = document.getElementById('canvas-holder');
  const w = Math.min(1000, window.innerWidth - 32);
  const h = Math.round(w * 0.62);
  resizeCanvas(w, h);
}

function draw() {
  if (!isPaused) {
    t += deltaTime * 0.001 * parseFloat($speed.value);
  }

  // Draw using shared routine for consistency with print renders
  drawArtwork(
    null,
    isPaused && frozenT != null ? frozenT : t,
    parseFloat($detail.value),
    { rand: seedRand, noise: seedNoise }
  );

  // overlay state badge
  $badge.textContent = isPaused ? 'FROZEN' : 'LIVE';
  $badge.style.background = isPaused
    ? 'rgba(0,160,255,.35)'
    : 'rgba(0,0,0,.45)';
}

// ——— Artwork routine (shared by screen & print) ———
function drawArtwork(pg, time, detail, seeds) {
  // pg: p5.Graphics or null (use main canvas)
  const use = pg || this;

  randomSeed(seeds.rand);
  noiseSeed(seeds.noise);

  // subtle trail
  if (!pg) {
    noStroke();
    fill(0, 22);
    rect(0, 0, width, height);
  } else {
    pg.noStroke();
    pg.fill(0, 22);
    pg.rect(0, 0, pg.width, pg.height);
  }

  // flow lines density scaled by area so print keeps visual weight
  const baseCount = 1200;
  const areaScale = pg ? (pg.width * pg.height) / (width * height) : 1;
  const count = Math.min(50000, Math.round(baseCount * areaScale));

  if (!pg) {
    stroke(240, 240, 255, 90);
  } else {
    pg.stroke(240, 240, 255, 90);
  }

  for (let i = 0; i < count; i++) {
    const x = pg ? pg.random(pg.width) : random(width);
    const y = pg ? pg.random(pg.height) : random(height);
    const a =
      (pg
        ? pg.noise(x * 0.002 * detail, y * 0.002 * detail, time * 0.15)
        : noise(x * 0.002 * detail, y * 0.002 * detail, time * 0.15)) * TAU;
    const len =
      6 +
      18 *
        (pg
          ? pg.noise(x * 0.004, y * 0.004, time * 0.15)
          : noise(x * 0.004, y * 0.004, time * 0.15));
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    if (!pg) line(x, y, x2, y2);
    else pg.line(x, y, x2, y2);
  }
}

// ——— Controls ———
function freezeNow() {
  if (isPaused) return;
  isPaused = true;
  noLoop();
  frozenImg = get(); // capture current canvas
  frozenT = t; // remember exact time
  addSnapshot(frozenImg);
  $resume.disabled = false;
}

function resumeNow() {
  if (!isPaused) return;
  isPaused = false;
  loop();
  frozenImg = null;
  frozenT = null;
  $resume.disabled = true;
}

function saveSnapshotOnly() {
  const img = get();
  addSnapshot(img);
}

function addSnapshot(img) {
  const meta = {
    img,
    t: t.toFixed(3),
    seedRand,
    seedNoise,
    when: new Date(),
  };
  snapshots.push(meta);

  // render a gallery card
  const card = document.createElement('div');
  card.className = 'card';

  const thumb = document.createElement('img');
  thumb.className = 'thumb';
  // downscale dataURL for lighter thumbs
  const thumbURL = imageToDataURL(img, 480, Math.round((480 * height) / width));
  thumb.src = thumbURL;

  const metaDiv = document.createElement('div');
  metaDiv.className = 'meta';
  const left = document.createElement('small');
  left.textContent = `t=${meta.t}s`;
  const right = document.createElement('a');
  right.className = 'btn';
  right.textContent = 'Download';
  right.href = imageToDataURL(img, width, height);
  right.download = `snapshot_t${Number(meta.t).toFixed(2)}.png`;

  metaDiv.appendChild(left);
  metaDiv.appendChild(right);

  card.appendChild(thumb);
  card.appendChild(metaDiv);
  $grid.prepend(card);
}

function downloadCurrent() {
  // Use frozen frame when available, otherwise capture live frame
  const img = frozenImg ? frozenImg : get();

  // Convert p5.Image to dataURL safely
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');

  // p5 may expose the pixel data via different handles
  const handle = img.canvas || img.image || img.elt || img;
  ctx.drawImage(handle, 0, 0, c.width, c.height);

  const dataURL = c.toDataURL('image/png');
  triggerDownload(dataURL, frozenImg ? 'frozen.png' : 'current.png');
}

// Render at 10S (45.5cm) 300dpi to PNG without changing on-screen canvas
function downloadForPrint() {
  const printSize = 5373; // 45.5 cm at 300 dpi
  const g = createGraphics(printSize, printSize);
  g.pixelDensity(1);
  g.noSmooth();
  g.background(8);

  const time = isPaused && frozenT != null ? frozenT : t;
  drawArtwork(g, time, parseFloat($detail.value), {
    rand: seedRand,
    noise: seedNoise,
  });

  save(g, `snapshot_10S_${time.toFixed(2)}s.png`);
  g.remove();
}

function triggerDownload(href, name) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function imageToDataURL(img, tw, th) {
  // Draw p5.Image onto a temp canvas to get a dataURL at target size
  const c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const ctx = c.getContext('2d');
  ctx.drawImage(img.canvas, 0, 0, tw, th);
  return c.toDataURL('image/png');
}

// Mouse click: freeze/resume toggle for convenience
function mousePressed() {
  // ignore if clicking UI (outside canvas)
  const within = mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height;
  if (!within) return;
  if (isPaused) resumeNow();
  else freezeNow();
}

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') freezeNow();
  if (e.key === 'r' || e.key === 'R') resumeNow();
  if (e.key === 's' || e.key === 'S') saveSnapshotOnly();
  if (e.key === 'd' || e.key === 'D') downloadCurrent();
  if (e.key === 'p' || e.key === 'P') downloadForPrint();
});

// Buttons
$freeze.addEventListener('click', freezeNow);
$resume.addEventListener('click', resumeNow);
$snapshot.addEventListener('click', saveSnapshotOnly);
$download.addEventListener('click', downloadCurrent);
$print.addEventListener('click', downloadForPrint);
