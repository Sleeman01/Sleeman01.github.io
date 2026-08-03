(function () {
  const canvas = document.getElementById('neural-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, dpr;
  let nodes = [];
  let pulses = [];
  const LINK_DIST = 160;
  const MOUSE_RADIUS = 180;
  const ACCENT = '94, 234, 212';   // #5EEAD4
  const ACCENT2 = '240, 180, 41';  // #F0B429

  const mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initNodes();
  }

  function initNodes() {
    const density = Math.min(90, Math.floor((w * h) / 15000));
    nodes = [];
    for (let i = 0; i < density; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseVx: (Math.random() - 0.5) * 0.22,
        baseVy: (Math.random() - 0.5) * 0.22,
        r: 1 + Math.random() * 1.8,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function maybeSpawnPulse() {
    if (Math.random() > 0.982 && nodes.length > 1) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      let best = null, bestD = Infinity;
      for (const b of nodes) {
        if (b === a) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST && d < bestD) { bestD = d; best = b; }
      }
      if (best) pulses.push({ a, b: best, t: 0 });
    }
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    if (mouse.active && !reduceMotion) {
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_RADIUS * 1.6);
      grad.addColorStop(0, `rgba(${ACCENT}, 0.05)`);
      grad.addColorStop(1, `rgba(${ACCENT}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const n of nodes) {
      if (!reduceMotion) {
        let vx = n.baseVx, vy = n.baseVy;
        if (mouse.active) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 0.01) {
            const force = (1 - dist / MOUSE_RADIUS) * 0.6;
            vx += (dx / dist) * force;
            vy += (dy / dist) * force;
          }
        }
        n.x += vx;
        n.y += vy;
        if (n.x < 0) n.x = w; if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h; if (n.y > h) n.y = 0;
        n.pulse += 0.02;
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) {
          const nearMouse = mouse.active &&
            (Math.hypot(a.x - mouse.x, a.y - mouse.y) < MOUSE_RADIUS ||
             Math.hypot(b.x - mouse.x, b.y - mouse.y) < MOUSE_RADIUS);
          const base = (1 - d / LINK_DIST) * (nearMouse ? 0.42 : 0.14);
          ctx.strokeStyle = `rgba(${ACCENT}, ${base})`;
          ctx.lineWidth = nearMouse ? 1.3 : 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      const glow = 0.5 + 0.5 * Math.sin(n.pulse);
      const nearMouse = mouse.active && Math.hypot(n.x - mouse.x, n.y - mouse.y) < MOUSE_RADIUS;
      ctx.beginPath();
      ctx.arc(n.x, n.y, nearMouse ? n.r * 1.6 : n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT}, ${(nearMouse ? 0.75 : 0.35) + glow * 0.25})`;
      ctx.fill();
    }

    if (!reduceMotion) {
      maybeSpawnPulse();
      pulses = pulses.filter(p => p.t <= 1);
      for (const p of pulses) {
        p.t += 0.02;
        const x = p.a.x + (p.b.x - p.a.x) * p.t;
        const y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT2}, ${1 - p.t})`;
        ctx.shadowColor = `rgba(${ACCENT2}, 0.9)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  });
  window.addEventListener('pointerleave', () => { mouse.active = false; });
  window.addEventListener('pointerdown', (e) => {
    const nx = e.clientX, ny = e.clientY;
    let near = nodes.slice().sort((a,b)=> Math.hypot(a.x-nx,a.y-ny) - Math.hypot(b.x-nx,b.y-ny)).slice(0,3);
    for (const a of near) {
      for (const b of nodes) {
        if (b === a) continue;
        if (Math.hypot(a.x-b.x, a.y-b.y) < LINK_DIST) { pulses.push({a,b,t:0}); break; }
      }
    }
  });

  resize();
  step();
})();
