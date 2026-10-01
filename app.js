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
  if (url && status) status.textContent = '友だち追加後に、メッセージをお送りください。相談だけでもOKです。';
  const header = document.querySelector('.site-header');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-nav');
  if (toggle && menu) {
    let menuAnimation;
    function close(restoreFocus = false, immediate = false) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('.menu-label').textContent = 'メニュー';
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
        toggle.querySelector('.menu-label').textContent = '閉じる';
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
  // Enhanced previews retain all samples when JavaScript is unavailable.
  const sampleButtons = [...document.querySelectorAll('[data-sample]')];
  const samplePanels = [...document.querySelectorAll('.sample-panel')];
  if (sampleButtons.length && samplePanels.length) {
    document.querySelector('.sample-switch').hidden = false;
    samplePanels.forEach((panel, index) => { panel.hidden = index !== 0; });
    sampleButtons.forEach(button => button.addEventListener('click', () => {
      sampleButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      samplePanels.forEach(panel => { panel.hidden = panel.id !== button.dataset.sample; });
    }));
  }
  const sampleDialog = document.getElementById('sample-dialog');
  const consultDialog = document.getElementById('consult-dialog');
  let dialogTrigger;
  const openDialog = (dialog, trigger) => {
    dialogTrigger = trigger;
    dialog.showModal();
    document.documentElement.classList.add('dialog-open');
  };
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('dialog-open');
      dialogTrigger?.focus({ preventScroll: true });
    });
  });
  if (sampleDialog?.showModal) {
    document.body.classList.add('samples-ready');
    document.querySelectorAll('[data-enlarge]').forEach(button => button.addEventListener('click', () => {
      const panel = document.getElementById(button.dataset.enlarge);
      const phone = panel?.querySelector('.demo-phone');
      if (!phone) return;
      sampleDialog.querySelector('.dialog-phone').replaceChildren(phone.cloneNode(true));
      openDialog(sampleDialog, button);
    }));
  }
  if (consultDialog?.showModal) {
    const message = document.getElementById('consult-message');
    const copyStatus = document.getElementById('copy-status');
    document.querySelectorAll('[data-plan]').forEach(link => link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      message.value = link.dataset.plan + 'プランについて相談したいです。\n業種：\n現在のLINE公式アカウント：あり／なし\n困っていること：';
      copyStatus.textContent = '';
      consultDialog.querySelector('[data-line]').dataset.planName = link.dataset.plan;
      openDialog(consultDialog, link);
    }));
    document.getElementById('copy-consult').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(message.value);
        copyStatus.textContent = 'コピーしました。LINEを開いて貼り付けてください。';
      } catch {
        message.focus(); message.select();
        copyStatus.textContent = '相談文を選択しました。端末のコピー操作をご利用ください。';
      }
    });
  }
  // A privacy-minimal integration hook. No analytics provider or storage is enabled here.
  document.querySelectorAll('[data-line]').forEach((link, index) => {
    link.addEventListener('click', () => {
      const detail = {
        event: link.dataset.plan ? 'consult_plan_select' : 'line_consult_click',
        placement: link.dataset.placement || (link.closest('header') ? 'header' : link.closest('.mobile-cta') ? 'mobile-sticky' : 'body'),
        plan: link.dataset.plan || link.dataset.planName || null,
        page: location.pathname,
        button_index: index
      };
      window.dispatchEvent(new CustomEvent('batten:analytics', { detail }));
      if (typeof window.gtag === 'function') window.gtag('event', detail.event, { placement: detail.placement, plan: detail.plan, page_path: detail.page });
    });
  });
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
