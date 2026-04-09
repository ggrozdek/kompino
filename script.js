/* ── Mobile nav ── */
(() => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('#nav');
  const header = document.querySelector('.topbar');
  if (!btn || !nav) return;
  const closeNav = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); header.classList.remove('menu-open'); };
  btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded',String(o)); header.classList.toggle('menu-open',o); });
  nav.addEventListener('click', e => { if (e.target?.tagName==='A') closeNav(); });
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeNav(); });
  document.addEventListener('click', e => { if (!nav.classList.contains('open')) return; if (e.target?.closest?.('#nav')||e.target?.closest?.('.menu-btn')) return; closeNav(); });
})();

/* ── Scroll-in animations ── */
(() => {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }); }, { threshold: 0.10 });
  els.forEach(el => io.observe(el));
})();

/* ══════════════════════════════════════════
   CIRCUIT BOARD BACKGROUND
   Real PCB grid: horizontal + vertical traces,
   via pads, and glowing electricity pulses
══════════════════════════════════════════ */
(() => {
  const canvas = document.getElementById('circuit-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── config ── */
  const GRID   = 44;          // px between grid lines
  const NODE_R = 2.8;         // via pad radius
  const LINE_W = 1.2;         // trace width

  // colours (light theme)
  const C_LINE  = 'rgba(37,99,235,0.16)';
  const C_NODE  = 'rgba(37,99,235,0.28)';
  const C_NODE2 = 'rgba(37,99,235,0.12)';  // small corner dots
  const C_PULSE_BLUE = [37,  99, 235];
  const C_PULSE_CYAN = [6, 182, 212];

  let W, H;
  let hLines = [];   // { y, xFrom, xTo, hasGap, gapAt, gapW }
  let vLines = [];   // { x, yFrom, yTo, hasGap, gapAt, gapW }
  let vias   = [];   // { x, y, big }
  let pulses = [];
  let scrollY = 0;

  /* ── build PCB grid ── */
  const build = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    hLines = []; vLines = []; vias = []; pulses = [];

    const cols = Math.floor(W / GRID) + 2;
    const rows = Math.floor(H / GRID) + 2;

    /* horizontal traces – not every row, not full width */
    for (let r = 0; r <= rows; r++) {
      const y = r * GRID;
      // spawn 55% of rows as traces
      if (Math.random() > 0.55) continue;
      const xFrom = Math.floor(Math.random() * 3) * GRID;
      const xTo   = W - Math.floor(Math.random() * 3) * GRID;
      const hasGap = Math.random() < 0.35;
      const gapAt  = xFrom + Math.random() * (xTo - xFrom - GRID);
      const gapW   = GRID * (0.4 + Math.random() * 0.8);
      hLines.push({ y, xFrom, xTo, hasGap, gapAt, gapW });
    }

    /* vertical traces */
    for (let c = 0; c <= cols; c++) {
      const x = c * GRID;
      if (Math.random() > 0.55) continue;
      const yFrom = Math.floor(Math.random() * 3) * GRID;
      const yTo   = H - Math.floor(Math.random() * 3) * GRID;
      const hasGap = Math.random() < 0.35;
      const gapAt  = yFrom + Math.random() * (yTo - yFrom - GRID);
      const gapW   = GRID * (0.4 + Math.random() * 0.8);
      vLines.push({ x, yFrom, yTo, hasGap, gapAt, gapW });
    }

    /* vias at grid intersections where h+v traces cross */
    const hSet = new Set(hLines.map(l => Math.round(l.y / GRID)));
    const vSet = new Set(vLines.map(l => Math.round(l.x / GRID)));
    hSet.forEach(r => vSet.forEach(c => {
      if (Math.random() < 0.55)
        vias.push({ x: c*GRID, y: r*GRID, big: Math.random() < 0.25 });
    }));

    /* seed pulses */
    while (pulses.length < 40) spawnPulse();
  };

  /* ── pulse factory ── */
  const spawnPulse = () => {
    const horiz = Math.random() < 0.5;
    const pool  = horiz ? hLines : vLines;
    if (!pool.length) return;
    const line  = pool[Math.floor(Math.random() * pool.length)];
    const fwd   = Math.random() < 0.5;
    const col   = Math.random() < 0.65 ? C_PULSE_BLUE : C_PULSE_CYAN;
    const speed = 60 + Math.random() * 120;   // px/s
    const len   = horiz
      ? line.xTo - line.xFrom
      : line.yTo - line.yFrom;

    pulses.push({
      line, horiz, fwd, col, speed,
      pos:   fwd ? 0 : len,
      len,
      alpha: 0.7 + Math.random() * 0.3,
      size:  1.5 + Math.random() * 1.5,
      tail:  18 + Math.random() * 22,
    });
  };

  /* ── draw one trace segment (respects gap) ── */
  const drawTrace = (x1, y1, x2, y2, hasGap, gapAt, gapW, horiz) => {
    if (!hasGap) {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      return;
    }
    // before gap
    if (horiz) {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(gapAt,y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gapAt+gapW,y1); ctx.lineTo(x2,y1); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1,gapAt); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1,gapAt+gapW); ctx.lineTo(x1,y2); ctx.stroke();
    }
  };

  /* ── main loop ── */
  let last = 0;
  const draw = ts => {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;

    ctx.clearRect(0, 0, W, H);

    const oy = (scrollY * 0.15) % H;
    ctx.save();
    ctx.translate(0, -oy);

    /* draw all horizontal traces */
    ctx.strokeStyle = C_LINE;
    ctx.lineWidth   = LINE_W;
    hLines.forEach(l => drawTrace(l.xFrom, l.y, l.xTo, l.y, l.hasGap, l.gapAt, l.gapW, true));

    /* draw all vertical traces */
    vLines.forEach(l => drawTrace(l.x, l.yFrom, l.x, l.yTo, l.hasGap, l.gapAt, l.gapW, false));

    /* draw corner notch dots on every grid point */
    for (let r = 0; r * GRID < H + oy + GRID; r++) {
      for (let c = 0; c * GRID < W + GRID; c++) {
        ctx.beginPath();
        ctx.arc(c*GRID, r*GRID, 1, 0, Math.PI*2);
        ctx.fillStyle = C_NODE2;
        ctx.fill();
      }
    }

    /* draw via pads */
    vias.forEach(v => {
      const r = v.big ? NODE_R * 1.6 : NODE_R;
      // outer ring
      ctx.beginPath(); ctx.arc(v.x, v.y, r + 2.5, 0, Math.PI*2);
      ctx.strokeStyle = C_NODE; ctx.lineWidth = 1; ctx.stroke();
      // fill
      ctx.beginPath(); ctx.arc(v.x, v.y, r, 0, Math.PI*2);
      ctx.fillStyle = C_NODE; ctx.fill();
      // centre hole
      ctx.beginPath(); ctx.arc(v.x, v.y, r * 0.38, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(234,244,255,0.95)'; ctx.fill();
    });

    /* update & draw pulses */
    const dead = [];
    pulses.forEach((p, i) => {
      p.pos += (p.fwd ? 1 : -1) * p.speed * dt;
      if (p.pos > p.len + p.tail || p.pos < -p.tail) { dead.push(i); return; }

      const t = Math.max(0, Math.min(p.len, p.pos));
      const [r,g,b] = p.col;

      /* head position */
      const hx = p.horiz ? p.line.xFrom + t        : p.line.x;
      const hy = p.horiz ? p.line.y                 : p.line.yFrom + t;

      /* wide glow aura */
      const aura = ctx.createRadialGradient(hx, hy, 0, hx, hy, p.size * 9);
      aura.addColorStop(0,   `rgba(${r},${g},${b},${p.alpha * 0.5})`);
      aura.addColorStop(0.5, `rgba(${r},${g},${b},${p.alpha * 0.10})`);
      aura.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(hx, hy, p.size * 9, 0, Math.PI*2);
      ctx.fillStyle = aura; ctx.fill();

      /* tail line */
      const tailLen = Math.min(p.tail, p.pos);
      const tx = p.horiz ? p.line.xFrom + Math.max(0, t - (p.fwd ? tailLen : -tailLen)) : p.line.x;
      const ty = p.horiz ? p.line.y : p.line.yFrom + Math.max(0, t - (p.fwd ? tailLen : -tailLen));

      const grad = p.horiz
        ? ctx.createLinearGradient(p.fwd ? tx : hx, hy, p.fwd ? hx : tx, hy)
        : ctx.createLinearGradient(hx, p.fwd ? ty : hy, hx, p.fwd ? hy : ty);
      grad.addColorStop(0,   `rgba(${r},${g},${b},0)`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},${p.alpha * 0.55})`);
      ctx.beginPath();
      ctx.moveTo(p.horiz ? tx : hx, p.horiz ? hy : ty);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = grad;
      ctx.lineWidth = p.size * 1.4;
      ctx.stroke();

      /* bright core dot */
      ctx.beginPath(); ctx.arc(hx, hy, p.size, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
      ctx.fill();
      /* white hot centre */
      ctx.beginPath(); ctx.arc(hx, hy, p.size * 0.4, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.alpha * 0.9})`;
      ctx.fill();
    });

    for (let i = dead.length-1; i >= 0; i--) pulses.splice(dead[i], 1);
    while (pulses.length < 40) spawnPulse();

    ctx.restore();
    requestAnimationFrame(draw);
  };

  build();
  requestAnimationFrame(draw);

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
})();

/* ── Reference carousel ── */
;(function () {
  const root = document.querySelector('.ref-spotlight');
  if (!root) return;
  const imgPrev=root.querySelector('.ref-prev img'), imgMain=root.querySelector('.ref-main img'), imgNext=root.querySelector('.ref-next img');
  const sidePrev=root.querySelector('.ref-prev'), sideNext=root.querySelector('.ref-next'), mainBox=root.querySelector('.ref-main');
  const refs=[
    {src:'assets/references/Photoroom_20260226_164027.png',alt:'Referenca 1',url:'https://www.robertino.si/'},
    {src:'assets/references/Photoroom_20260226_134636.png',alt:'Referenca 2',url:'https://iwf.si/'},
    {src:'assets/references/Photoroom_20260226_134652.png',alt:'Referenca 3',url:'https://www.agm-nemec.si/'},
    {src:'assets/references/ref-4.png',alt:'Referenca 4',url:'https://prosperius.si/'},
    {src:'assets/references/Photoroom_20260226_134705.png',alt:'Referenca 5',url:'https://www.amstaf.net/'},
    {src:'assets/references/IMG_2617.png',alt:'Referenca 6',url:'https://tkalcic-transport.si/'},
    {src:'assets/references/prinkraft.png',alt:'Referenca 7',url:'https://print-kraft.si/'},
    {src:'assets/references/alius.png',alt:'Referenca 8',url:'https://www.alius.si/'},
    {src:'assets/references/ref-8.png',alt:'Referenca 9',url:'https://swelding.eu/'},
    {src:'assets/references/ref-9.png',alt:'Referenca 10'}
  ];
  const wrap=i=>((i%refs.length)+refs.length)%refs.length;
  let index=0,animating=false;
  const setImages=()=>{imgPrev.src=refs[wrap(index-1)].src;imgPrev.alt=refs[wrap(index-1)].alt;imgMain.src=refs[wrap(index)].src;imgMain.alt=refs[wrap(index)].alt;imgNext.src=refs[wrap(index+1)].src;imgNext.alt=refs[wrap(index+1)].alt;mainBox.dataset.url=refs[wrap(index)].url||'';};
  const slide=dir=>{if(animating)return;animating=true;mainBox.classList.add(dir>0?'slide-left':'slide-right');setTimeout(()=>{index=wrap(index+dir);setImages();mainBox.classList.remove('slide-left','slide-right');animating=false;},350);};
  sidePrev?.addEventListener('click',()=>slide(-1));sideNext?.addEventListener('click',()=>slide(1));
  mainBox.addEventListener('click',()=>{if(!animating&&mainBox.dataset.url)window.open(mainBox.dataset.url,'_blank');});
  let timer;const stop=()=>clearInterval(timer);const start=()=>{stop();timer=setInterval(()=>slide(1),2250);};
  root.addEventListener('mouseenter',stop);root.addEventListener('mouseleave',start);
  root.addEventListener('touchstart',stop,{passive:true});root.addEventListener('touchend',start,{passive:true});
  setImages();start();
})();