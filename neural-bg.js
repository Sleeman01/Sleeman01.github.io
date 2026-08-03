(function () {
  const canvas = document.getElementById('neural-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, dpr;
  let nodes = [];
  let pulses = [];
  const LINK_DIST = 150;
  const ACCENT = '94, 234, 212';   // #5EEAD4
  const ACCENT2 = '240, 180, 41';  // #F0B429

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
    const density = Math.min(70, Math.floor((w * h) / 18000));
    nodes = [];
    for (let i = 0; i < density; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1 + Math.random() * 1.6,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function maybeSpawnPulse() {
    if (Math.random() > 0.985 && nodes.length > 1) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      // find a nearby neighbor to travel to
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

    // update + draw nodes
    for (const n of nodes) {
      if (!reduceMotion) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.pulse += 0.02;
      }
    }

    // draw links
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.16;
          ctx.strokeStyle = `rgba(${ACCENT}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // draw nodes
    for (const n of nodes) {
      const glow = 0.5 + 0.5 * Math.sin(n.pulse);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT}, ${0.35 + glow * 0.25})`;
      ctx.fill();
    }

    // traveling pulses (signature: data moving through the network)
    if (!reduceMotion) {
      maybeSpawnPulse();
      pulses = pulses.filter(p => p.t <= 1);
      for (const p of pulses) {
        p.t += 0.02;
        const x = p.a.x + (p.b.x - p.a.x) * p.t;
        const y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT2}, ${1 - p.t})`;
        ctx.shadowColor = `rgba(${ACCENT2}, 0.8)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  resize();
  step();
})();
