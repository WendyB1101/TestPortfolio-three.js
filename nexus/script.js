/* ── ABHINAV Studio ── */

// ── Loader ───────────────────────────────────────────────────────────────────
const loaderEl   = document.getElementById('loader');
const fillEl     = document.getElementById('loader-fill');
const pctEl      = document.getElementById('loader-pct');
let pct = 0;

const loaderTick = setInterval(() => {
  pct += Math.random() * 14 + 3;
  if (pct >= 100) { pct = 100; clearInterval(loaderTick); }
  fillEl.style.width = pct + '%';
  pctEl.textContent  = Math.floor(pct) + '%';
  if (pct >= 100) setTimeout(startSite, 420);
}, 110);

// ── Tab visibility — pause all RAF loops when hidden ─────────────────────────
let tabVisible = true;
document.addEventListener('visibilitychange', () => {
  tabVisible = !document.hidden;
});

// ── Full-page star field ──────────────────────────────────────────────────────
function initStarField() {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = document.body.scrollHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const count = Math.floor((W * H) / 3000);
    for (let i = 0; i < count; i++) {
      const size = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: size < 0.6 ? 0.4 : size < 0.9 ? 0.8 : 1.3,
        // brightness tiers
        a: 0.2 + Math.random() * 0.7,
        // twinkle speed
        speed: 0.003 + Math.random() * 0.008,
        phase: Math.random() * Math.PI * 2,
        // warm rose/gold/white tones
        hue: [30, 340, 20, 355, 45][Math.floor(Math.random() * 5)],
      });
    }
  }

  let t = 0;
  function draw() {
    if (!tabVisible) { requestAnimationFrame(draw); return; }
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      const twinkle = s.a * (0.6 + 0.4 * Math.sin(t * s.speed * 60 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue},60%,95%,${twinkle})`;
      ctx.fill();

      // glow for larger stars
      if (s.r > 1) {
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
        grd.addColorStop(0, `hsla(${s.hue},80%,90%,${twinkle * 0.4})`);
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  draw();

  // Rebuild on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  // Also rebuild when page height changes (sections load in)
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 300);
  });
  ro.observe(document.body);
}

// ── Shooting Stars ────────────────────────────────────────────────────────────
function initShootingStars() {
  const canvas = document.createElement('canvas');
  canvas.id = 'shooting-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Each shooting star
  class Star {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x     = W * (0.3 + Math.random() * 0.7);
      this.y     = initial ? Math.random() * H * 0.4 : -10;
      this.speed = 2.2 + Math.random() * 2.5;
      this.angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.35;
      // Curve: slight sine wave wobble
      this.wobble      = (Math.random() - 0.5) * 0.018;
      this.wobblePhase = Math.random() * Math.PI * 2;
      this.alpha    = 0;
      this.maxAlpha = 0.55 + Math.random() * 0.4;
      this.width    = 1.2 + Math.random() * 1.2;
      this.state    = 'fadein';
      this.life     = 0;
      this.maxLife  = 70 + Math.random() * 90;
      // Trail: array of {x,y,a} points
      this.trail    = [];
      this.trailLen = 28 + Math.floor(Math.random() * 20);
      // Sparkles along trail
      this.sparkles = [];
      const palette = [
        [232,164,184],[212,169,106],[255,255,255],[245,221,232]
      ];
      this.color = palette[Math.floor(Math.random() * palette.length)];
    }

    update() {
      // Wobble the angle slightly for curved path
      this.wobblePhase += 0.08;
      const curAngle = this.angle + Math.sin(this.wobblePhase) * this.wobble * 8;

      this.x += Math.cos(curAngle) * this.speed;
      this.y += Math.sin(curAngle) * this.speed;
      this.life++;

      // Store trail point
      this.trail.unshift({ x: this.x, y: this.y, a: this.alpha });
      if (this.trail.length > this.trailLen) this.trail.pop();

      // Randomly spawn sparkles along trail
      if (Math.random() < 0.35 && this.alpha > 0.1) {
        this.sparkles.push({
          x: this.x + (Math.random() - 0.5) * 6,
          y: this.y + (Math.random() - 0.5) * 6,
          r: 0.5 + Math.random() * 1.5,
          a: this.alpha * (0.4 + Math.random() * 0.5),
          decay: 0.03 + Math.random() * 0.05,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
      // Update sparkles
      this.sparkles = this.sparkles.filter(s => {
        s.twinkle += 0.25;
        s.a -= s.decay;
        return s.a > 0;
      });

      if (this.state === 'fadein') {
        this.alpha += 0.035;
        if (this.alpha >= this.maxAlpha) { this.alpha = this.maxAlpha; this.state = 'travel'; }
      } else if (this.state === 'travel') {
        if (this.life > this.maxLife) this.state = 'fadeout';
      } else {
        this.alpha -= 0.025;
        if (this.alpha <= 0) this.reset();
      }
    }

    draw() {
      const [r, g, b] = this.color;

      // Draw curved trail using stored points
      if (this.trail.length > 2) {
        for (let i = 1; i < this.trail.length; i++) {
          const t  = 1 - i / this.trail.length;
          const ta = this.alpha * t * t; // quadratic fade
          if (ta < 0.005) continue;
          ctx.beginPath();
          ctx.moveTo(this.trail[i-1].x, this.trail[i-1].y);
          ctx.lineTo(this.trail[i].x,   this.trail[i].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${ta})`;
          ctx.lineWidth   = this.width * t;
          ctx.lineCap     = 'round';
          ctx.stroke();
        }
      }

      // Draw sparkles — 4-point star shape
      this.sparkles.forEach(s => {
        const pulse = s.a * (0.7 + 0.3 * Math.sin(s.twinkle));
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.twinkle * 0.5);
        ctx.fillStyle = `rgba(${r},${g},${b},${pulse})`;
        // 4-point star
        ctx.beginPath();
        for (let p = 0; p < 4; p++) {
          const a1 = (p / 4) * Math.PI * 2;
          const a2 = a1 + Math.PI / 4;
          ctx.lineTo(Math.cos(a1) * s.r * 2.5, Math.sin(a1) * s.r * 2.5);
          ctx.lineTo(Math.cos(a2) * s.r * 0.6, Math.sin(a2) * s.r * 0.6);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Bright glowing head
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 5);
      grd.addColorStop(0, `rgba(${r},${g},${b},${this.alpha})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  // Create pool of stars — staggered timing
  const stars = Array.from({ length: 6 }, () => new Star());

  // Spawn new stars at random intervals
  function spawnLoop() {
    const dead = stars.findIndex(s => s.alpha <= 0 && s.state !== 'fadein');
    if (dead !== -1) stars[dead].reset();
    setTimeout(spawnLoop, 800 + Math.random() * 2400);
  }
  setTimeout(spawnLoop, 1200);

  function draw() {
    if (!tabVisible) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => { s.update(); if (s.alpha > 0) s.draw(); });
    requestAnimationFrame(draw);
  }
  draw();
}

// Start shooting stars immediately
initShootingStars();

// ── Label star clusters — CSS only, no canvas ────────────────────────────────
function initLabelStars() {
  // No canvas needed — handled entirely by CSS animations
  // Just ensure label-wrap has position:relative
  document.querySelectorAll('.label-wrap').forEach(wrap => {
    wrap.style.position = 'relative';
  });
}

function startSite() {
  loaderEl.classList.add('out');
  initHero3D();
  initAbout3D();
  initWork3D();
  heroEntrance();
  initReveal();
  initCounters();
  initScramble();
  initLabelStars();
}

// Start star field immediately — visible during loader too
initStarField();

// ── Cursor ───────────────────────────────────────────────────────────────────
const cur = document.getElementById('cursor');
let mx = 0, my = 0;
let cursorVisible = false;

// Use transform instead of left/top — GPU composited, zero lag
function moveCursor(x, y) {
  cur.style.transform = `translate(${x}px, ${y}px)`;
}

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  moveCursor(mx, my);
  if (!cursorVisible) {
    cur.style.opacity = '1';
    cursorVisible = true;
  }
});

// Hide cursor when mouse leaves window, show on return
document.addEventListener('mouseleave', () => { cur.style.opacity = '0'; cursorVisible = false; });
document.addEventListener('mouseenter', e => {
  mx = e.clientX; my = e.clientY;
  moveCursor(mx, my);
  cur.style.opacity = '1';
  cursorVisible = true;
});

// Snap cursor instantly when tab regains focus — prevents ghost position
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Re-sync on next mousemove; hide until then to avoid stale position flash
    cur.style.opacity = '0';
    cursorVisible = false;
  }
});

document.querySelectorAll('a,button,.svc-row,.work-card,.testi-card,.process-card,.tech-pill').forEach(el => {
  el.addEventListener('mouseenter', () => cur.classList.add('big'));
  el.addEventListener('mouseleave', () => cur.classList.remove('big'));
});

// ── Back to top ──────────────────────────────────────────────────────────────
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', scrollY > 400);
}, { passive: true });
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Nav ───────────────────────────────────────────────────────────────────────
const navEl   = document.getElementById('nav');
const menuBtn = document.getElementById('menu-btn');
const mobileNav = document.getElementById('mobile-nav');

window.addEventListener('scroll', () => navEl.classList.toggle('stuck', scrollY > 60), { passive: true });
menuBtn.addEventListener('click', () => mobileNav.classList.toggle('open'));
document.querySelectorAll('#mobile-nav a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));

// ── Smooth scroll ─────────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── Hero 3D — Galaxy ─────────────────────────────────────────────────────────
function initHero3D() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, canvas.offsetWidth / canvas.offsetHeight, 0.1, 500);
  // Lower camera, wider FOV = galaxy spreads across full screen
  camera.position.set(0, 1.8, 5.5);
  camera.lookAt(0, 0, 0);

  // ── Galaxy parameters — wider spread ──
  const ARMS        = 3;
  const ARM_STARS   = 7000;
  const CORE_STARS  = 1400;
  const DUST_STARS  = 2500;

  const positions = [];
  const colors    = [];

  // Helper: color lerp
  function starColor(t, type) {
    // type 0 = arm (blue-white core → blue outer)
    // type 1 = core (warm white-yellow)
    // type 2 = dust (dim blue-purple haze)
    if (type === 1) {
      // warm core: white → soft gold
      const r = 0.9 + t * 0.1, g = 0.85 + t * 0.05, b = 0.7 - t * 0.2;
      return [r, g, b];
    }
    if (type === 2) {
      return [0.15 + Math.random() * 0.1, 0.18 + Math.random() * 0.1, 0.35 + Math.random() * 0.15];
    }
    // arm: bright blue-white near center, deeper blue outward
    const r = 0.4 + (1 - t) * 0.5;
    const g = 0.55 + (1 - t) * 0.35;
    const b = 1.0;
    return [r, g, b];
  }

  // ── Spiral arms ──
  for (let arm = 0; arm < ARMS; arm++) {
    const armOffset = (arm / ARMS) * Math.PI * 2;
    for (let i = 0; i < ARM_STARS; i++) {
      const t        = i / ARM_STARS;
      const radius   = 0.3 + t * 7.5;   // much wider — was 4.5
      const angle    = armOffset + t * Math.PI * 4.0;  // more spiral turns
      const spread   = 0.1 + t * 0.55;  // wider arms
      const height   = (Math.random() - 0.5) * 0.08 * (1 + t);

      const ox = (Math.random() - 0.5) * spread * 2;
      const oz = (Math.random() - 0.5) * spread * 2;

      const x = Math.cos(angle) * radius + ox;
      const y = height;
      const z = Math.sin(angle) * radius + oz;

      positions.push(x, y, z);
      const [r, g, b] = starColor(t, 0);
      // brightness falloff
      const bright = 0.5 + (1 - t) * 0.5 + Math.random() * 0.2;
      colors.push(r * bright, g * bright, b * bright);
    }
  }

  // ── Dense bright core ──
  for (let i = 0; i < CORE_STARS; i++) {
    const r     = Math.pow(Math.random(), 2) * 1.2;
    const theta = Math.random() * Math.PI * 2;
    const phi   = (Math.random() - 0.5) * 0.3;
    const x = Math.cos(theta) * r;
    const y = phi * r * 0.4;
    const z = Math.sin(theta) * r;
    positions.push(x, y, z);
    const t = r / 1.2;
    const [cr, cg, cb] = starColor(t, 1);
    const bright = 0.8 + Math.random() * 0.2;
    colors.push(cr * bright, cg * bright, cb * bright);
  }

  // ── Dust / haze layer — wider ──
  for (let i = 0; i < DUST_STARS; i++) {
    const r     = 0.5 + Math.random() * 8;  // was 5
    const theta = Math.random() * Math.PI * 2;
    const y     = (Math.random() - 0.5) * 0.5;
    positions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
    const [dr, dg, db] = starColor(0, 2);
    colors.push(dr, dg, db);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(colors),    3));

  // Two layers: small sharp stars + larger soft glow stars
  const matSharp = new THREE.PointsMaterial({
    size: 0.022, sizeAttenuation: true,
    transparent: true, opacity: 0.9,
    vertexColors: true,
  });
  const matGlow = new THREE.PointsMaterial({
    size: 0.055, sizeAttenuation: true,
    transparent: true, opacity: 0.18,
    vertexColors: true,
  });

  scene.add(new THREE.Points(geo, matSharp));
  scene.add(new THREE.Points(geo, matGlow));

  // ── Soft nebula glow planes ──
  function nebula(x, z, color, size, opacity) {
    const g = new THREE.PlaneGeometry(size, size);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(g, m);
    mesh.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    mesh.position.set(x, (Math.random() - 0.5) * 0.3, z);
    scene.add(mesh);
  }
  nebula( 1.5,  1.0, 0x1a3a8f, 3.5, 0.04);
  nebula(-1.8, -1.2, 0x0f2060, 4.0, 0.03);
  nebula( 0.2,  2.5, 0x1e1060, 3.0, 0.035);

  // ── Mouse parallax ──
  let tX = 0, tY = 0;
  document.addEventListener('mousemove', e => {
    tX = (e.clientX / innerWidth  - 0.5) * 0.6;
    tY = (e.clientY / innerHeight - 0.5) * 0.25;
  });

  let angle = 0;
  (function tick() {
    requestAnimationFrame(tick);
    if (!tabVisible) return;
    angle += 0.0008;
    // slow galaxy rotation
    scene.rotation.y = angle + tX * 0.4;
    camera.position.y = 2.5 + tY * 0.8;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
    camera.updateProjectionMatrix();
  });
}

// ── About 3D ──────────────────────────────────────────────────────────────────
function initAbout3D() {
  const canvas = document.getElementById('about-canvas');
  if (!canvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
  camera.position.z = 4.5;

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.1, 0.34, 160, 20),
    new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.2 })
  );
  scene.add(knot);

  const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.004, 8, 130),
    new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.4 }));
  r1.rotation.x = Math.PI / 3.5; scene.add(r1);

  const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.003, 8, 110),
    new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.25 }));
  r2.rotation.y = Math.PI / 4; scene.add(r2);

  (function tick() {
    requestAnimationFrame(tick);
    if (!tabVisible) return;
    knot.rotation.x += 0.004; knot.rotation.y += 0.005;
    r1.rotation.z += 0.003; r2.rotation.z -= 0.002;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
    camera.updateProjectionMatrix();
  });
}

// ── Work card 3D ─────────────────────────────────────────────────────────────
function initWork3D() {
  const canvas = document.getElementById('wc1');
  if (!canvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
  camera.position.z = 3;

  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.3 })
  );
  scene.add(ico);

  (function tick() {
    requestAnimationFrame(tick);
    if (!tabVisible) return;
    ico.rotation.x += 0.006; ico.rotation.y += 0.008;
    renderer.render(scene, camera);
  })();
}

// ── Hero entrance ─────────────────────────────────────────────────────────────
function heroEntrance() {
  const eyebrow = document.querySelector('.hero-eyebrow');
  const words   = document.querySelectorAll('.hero-heading .word');
  const sub     = document.querySelector('.hero-sub');
  const btns    = document.querySelector('.hero-btns');

  const hide = el => { if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(30px)'; } };
  const show = (el, delay) => {
    if (!el) return;
    setTimeout(() => {
      el.style.transition = 'opacity .7s ease, transform .8s cubic-bezier(.16,1,.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }, delay);
  };

  [eyebrow, sub, btns].forEach(hide);
  words.forEach(w => { w.style.opacity = '0'; w.style.transform = 'translateY(60px)'; });

  show(eyebrow, 200);
  words.forEach((w, i) => show(w, 380 + i * 120));
  show(sub,  820);
  show(btns, 980);
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.svc-row, .work-card, .testi-card, .process-card, .about-right, .contact-left, .contact-right, .sec-head, .cta-band');
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), i * 65);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => io.observe(el));
}

// ── Counters ──────────────────────────────────────────────────────────────────
function initCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.n;
      let cur = 0;
      const step = target / 65;
      const t = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(t); }
        el.textContent = Math.floor(cur);
      }, 20);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.astat-n').forEach(el => io.observe(el));
}

// ── Text scramble — single chain, no overlap ─────────────────────────────────
function initScramble() {
  const el = document.getElementById('scramble-word');
  if (!el) return;

  const words = ['beautiful', 'elegant', 'immersive', 'luminous', 'refined'];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let wi = 0;
  let scrambleTimer = null;
  let cycleTimer = null;

  function scrambleTo(target, onDone) {
    // Clear any existing scramble
    if (scrambleTimer) clearInterval(scrambleTimer);
    let step = 0;
    const totalSteps = target.length * 4; // 4 ticks per character

    scrambleTimer = setInterval(() => {
      const revealed = Math.floor(step / 4);
      el.textContent = target.split('').map((c, i) => {
        if (i < revealed) return target[i];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      step++;
      if (step >= totalSteps) {
        clearInterval(scrambleTimer);
        scrambleTimer = null;
        el.textContent = target;
        if (onDone) onDone();
      }
    }, 90); // 90ms per tick — slow and readable
  }

  function cycle() {
    if (cycleTimer) clearTimeout(cycleTimer);
    wi = (wi + 1) % words.length;
    scrambleTo(words[wi], () => {
      // Wait 4 seconds showing the word, then cycle again
      cycleTimer = setTimeout(cycle, 4000);
    });
  }

  // Start first cycle after 4 seconds
  cycleTimer = setTimeout(cycle, 4000);
}

// ── Hero parallax ─────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const inner = document.querySelector('.hero-inner');
  if (!inner || scrollY > innerHeight) return;
  inner.style.transform = `translateY(${scrollY * 0.2}px)`;
  inner.style.opacity   = Math.max(0, 1 - scrollY / (innerHeight * 0.7));
}, { passive: true });

// ── Icon fallback — hide broken images gracefully ────────────────────────────
document.querySelectorAll('.ti img').forEach(img => {
  img.addEventListener('error', function() {
    const name = this.alt || '?';
    const initials = name.substring(0, 2).toUpperCase();
    const colors = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4'];
    const color  = colors[name.charCodeAt(0) % colors.length];
    const div = document.createElement('div');
    div.style.cssText = `width:52px;height:52px;border-radius:12px;background:${color}22;border:1px solid ${color}44;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:${color};font-family:'Syne',sans-serif`;
    div.textContent = initials;
    this.replaceWith(div);
  });
});
document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn  = this.querySelector('button span');
  const orig = btn.textContent;
  btn.textContent = 'Sent ✓';
  this.querySelector('button').style.background = '#10b981';
  setTimeout(() => { btn.textContent = orig; this.querySelector('button').style.background = ''; this.reset(); }, 3200);
});
