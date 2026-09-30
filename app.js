(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const activeAnimations = new Set();
  function animate(element, frames, options) {
    if (motion.matches || !element.animate) return null;
    const animation = element.animate(frames, options);
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
    return animation;
  }
  motion.addEventListener('change', () => {
    if (motion.matches) activeAnimations.forEach(animation => animation.finish());
  });
  // All consultations use the existing single source of truth.
  let url = null;
  try {
    const parsed = new URL(window.BATTEN_CONFIG?.lineConsultUrl || '');
    if (parsed.protocol === 'https:' && ['lin.ee', 'line.me'].includes(parsed.hostname)) url = parsed.href;
  } catch { /* An unset URL deliberately stays on the site. */ }
  const status = document.getElementById('contact-status');
  if (status) status.setAttribute('aria-live', 'polite');
  document.querySelectorAll('[data-line]').forEach(link => {
    link.href = url || '#contact-status';
    if (!url && status) link.addEventListener('click', event => {
      event.preventDefault();
      status.textContent = '相談先のLINEは現在準備中です。受付開始までお待ちください。';
      status.focus({ preventScroll: true });
      status.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
    });
  });
  if (url && status) status.textContent = '何から始めたらいいか分からない方も、お気軽に。';
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-nav');
  if (toggle && menu) {
    let menuAnimation;
    function close(restoreFocus = false, immediate = false) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'メニュー';
      menuAnimation?.cancel();
      menuAnimation = immediate ? null : animate(menu, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 160, easing: 'ease-out' });
      if (menuAnimation) menuAnimation.finished.then(() => { menu.hidden = true; }).catch(() => {});
      else menu.hidden = true;
      if (restoreFocus) toggle.focus();
    }
    toggle.addEventListener('click', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') close();
      else {
        menuAnimation?.cancel();
        menu.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = '閉じる';
      }
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      close(false, true);
      if (link.hash && link.pathname === location.pathname) {
        const target = document.querySelector(link.hash);
        if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
      }
    }));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(true, true); });
    document.addEventListener('click', event => { if (!menu.contains(event.target) && !toggle.contains(event.target)) close(false, true); });
    document.addEventListener('focusin', event => { if (!menu.contains(event.target) && !toggle.contains(event.target)) close(false, true); });
    matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) close(false, true); });
    document.body.classList.add('nav-ready');
  }
  // Native details also works without this optional closing effect.
  document.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector('summary');
    const answer = details.querySelector('p');
    let closing = null;
    summary?.addEventListener('click', event => {
      if (!details.open || !answer || motion.matches || !answer.animate) return;
      event.preventDefault();
      if (closing) { closing.cancel(); closing = null; return; }
      closing = animate(answer, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 140, easing: 'ease-out' });
      closing.finished.then(() => { details.open = false; closing = null; }).catch(() => {});
    });
  });
  // Never pre-hide content: failed scripts or observers cannot leave blank sections.
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        animate(entry.target, [{ opacity: .25, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 440, easing: 'cubic-bezier(.2,.65,.3,1)' });
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.section h2, .uses article, .services article, .approach-photo, .approach-copy, .steps li, .plan-card, .campaign, .official-fee').forEach(element => {
      if (element.getBoundingClientRect().top >= innerHeight) observer.observe(element);
    });
  }
})();
