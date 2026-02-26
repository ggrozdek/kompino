(() => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('#nav');
  if (!btn || !nav) return;

  const closeNav = () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  nav.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.tagName === 'A') closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!nav.classList.contains('open')) return;
    if (target.closest && (target.closest('#nav') || target.closest('.menu-btn'))) return;
    closeNav();
  });
})();

// SCRIPT.JS: prilepi na konec datoteke

;(function () {
  const track = document.querySelector('.ref-track')
  if (!track) return

  const prev = document.querySelector('.ref-btn.prev')
  const next = document.querySelector('.ref-btn.next')

  const getStep = () => {
    const first = track.querySelector('.ref-item')
    if (!first) return 220
    const style = getComputedStyle(track)
    const gap = parseFloat(style.gap || style.columnGap || '12') || 12
    return first.getBoundingClientRect().width + gap
  }

  const scrollByX = (dir) => {
    track.scrollBy({ left: dir * getStep(), behavior: 'smooth' })
  }

  if (prev) prev.addEventListener('click', () => scrollByX(-1))
  if (next) next.addEventListener('click', () => scrollByX(1))

  let timer = null

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  const start = () => {
    stop()
    timer = setInterval(() => {
      const max = track.scrollWidth - track.clientWidth
      const nearEnd = track.scrollLeft >= max - 5
      if (nearEnd) track.scrollTo({ left: 0, behavior: 'smooth' })
      else scrollByX(1)
    }, 2800)
  }

  track.addEventListener('mouseenter', stop)
  track.addEventListener('mouseleave', start)
  track.addEventListener('focusin', stop)
  track.addEventListener('focusout', start)
  track.addEventListener('touchstart', stop, { passive: true })
  track.addEventListener('touchend', start, { passive: true })

  start()
})()

;(function () {
  const root = document.querySelector('.ref-spotlight')
  if (!root) return

  const imgPrev = root.querySelector('.ref-prev img')
  const imgMain = root.querySelector('.ref-main img')
  const imgNext = root.querySelector('.ref-next img')

  const btnPrev = root.querySelector('.ref-nav.prev')
  const btnNext = root.querySelector('.ref-nav.next')
  const sidePrev = root.querySelector('.ref-prev')
  const sideNext = root.querySelector('.ref-next')

  const refs = [
    { src: 'assets/references/ref-1.png', alt: 'Referenca 1' },
    { src: 'assets/references/ref-2.png', alt: 'Referenca 2' },
    { src: 'assets/references/ref-3.png', alt: 'Referenca 3' },
    { src: 'assets/references/ref-4.png', alt: 'Referenca 4' },
    { src: 'assets/references/ref-5.png', alt: 'Referenca 5' },
    { src: 'assets/references/ref-6.png', alt: 'Referenca 6' }
  ]

  const wrap = (i) => ((i % refs.length) + refs.length) % refs.length

  let index = 0
  let animating = false

  const setImages = () => {
    const iPrev = wrap(index - 1)
    const iMain = wrap(index)
    const iNext = wrap(index + 1)

    imgPrev.src = refs[iPrev].src
    imgPrev.alt = refs[iPrev].alt

    imgMain.src = refs[iMain].src
    imgMain.alt = refs[iMain].alt

    imgNext.src = refs[iNext].src
    imgNext.alt = refs[iNext].alt
  }

  const slide = (dir) => {
    if (animating) return
    animating = true

    const mainBox = root.querySelector('.ref-main')
    mainBox.classList.add(dir > 0 ? 'slide-left' : 'slide-right')

    setTimeout(() => {
      index = wrap(index + dir)
      setImages()
      mainBox.classList.remove('slide-left', 'slide-right')
      animating = false
    }, 350)
  }

  btnPrev?.addEventListener('click', () => slide(-1))
  btnNext?.addEventListener('click', () => slide(1))
  sidePrev?.addEventListener('click', () => slide(-1))
  sideNext?.addEventListener('click', () => slide(1))

  let timer = null
  const stop = () => { if (timer) clearInterval(timer) }
  const start = () => {
    stop()
    timer = setInterval(() => slide(1), 1500)
  }

  root.addEventListener('mouseenter', stop)
  root.addEventListener('mouseleave', start)
  root.addEventListener('touchstart', stop, { passive:true })
  root.addEventListener('touchend', start, { passive:true })

  setImages()
  start()
})()