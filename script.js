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
