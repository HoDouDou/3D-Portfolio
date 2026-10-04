(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const D = window.DOOOOO_DATA || { pitches: [], sims: [], pdfs: [] };
  const modal = $('modal');

  /* ---------- 提案模擬：分頁籤 + 影片 ---------- */
  const tabs = $('simTabs');
  const vids = [...document.querySelectorAll('#vidGrid video')];
  const pauseAll = () => vids.forEach(v => v.pause());
  if (tabs) {
    tabs.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
      ['sim', 'vid', 'art'].forEach(k => { const p = $('panel-' + k); if (p) p.hidden = (k !== b.dataset.p); });
      if (b.dataset.p !== 'vid') pauseAll();
      else vids.forEach(v => { const r = v.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { v.muted = true; v.play().catch(() => {}); } });
    });
  }
  if (vids.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target, panel = $('panel-vid');
      if (e.isIntersecting && panel && !panel.hidden) { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    }), { threshold: .35 });
    vids.forEach(v => { v.muted = true; io.observe(v); v.addEventListener('click', () => { v.paused ? v.play().catch(() => {}) : v.pause(); }); });
  }

  /* ---------- 高度尺 ---------- */
  const gmk = $('gmk'), gval = $('gval');
  if (gmk && gval) {
    const gauge = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      gmk.style.top = (p * 300) + 'px'; gval.textContent = (5.5 * (1 - p)).toFixed(1) + ' m';
    };
    addEventListener('scroll', gauge, { passive: true }); addEventListener('resize', gauge); gauge();
  }

  if (!modal) return;

  /* ---------- 燈箱 ---------- */
  const st = { item: null, g: 0, i: 0, opener: null };
  function paint() {
    const { item, g, i } = st, grp = item.groups[g], img = grp.imgs[i];
    $('panel').classList.toggle('wide', !!item.wide);
    $('mArt').classList.remove('zoomed');
    $('mArt').innerHTML = `<img src="${esc(img.src)}" alt="${esc(img.cap)}">`;
    $('mTitle').textContent = item.title; $('mMeta').textContent = item.meta || '';
    $('mCnt').textContent = grp.label + '　' + (i + 1) + ' / ' + grp.imgs.length;
    const t = $('mTabs'); t.hidden = item.groups.length < 2;
    t.innerHTML = item.groups.map((x, k) => `<button role="tab" data-g="${k}" aria-selected="${k === g}">${esc(x.label)}</button>`).join('');
    const multi = grp.imgs.length > 1;
    $('mThumbs').hidden = !multi; $('mPrev').hidden = !multi; $('mNext').hidden = !multi;
    $('mThumbs').innerHTML = grp.imgs.map((x, k) => `<button data-k="${k}" aria-label="第 ${k + 1} 張" ${k === i ? 'aria-current="true"' : ''}><img src="${esc(x.thumb || x.src)}" alt="" loading="lazy"></button>`).join('');
    const cur = $('mThumbs').querySelector('[aria-current="true"]'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function openM(item, start, opener) {
    if (!item || !item.groups || !item.groups.length || !item.groups[0].imgs.length) return;
    st.item = item; st.g = 0; st.i = start || 0; st.opener = opener;
    paint(); modal.classList.add('open'); document.body.style.overflow = 'hidden'; $('mClose').focus();
  }
  function closeM() { modal.classList.remove('open'); document.body.style.overflow = ''; if (st.opener) st.opener.focus(); }
  function step(d) { const n = st.item.groups[st.g].imgs.length; st.i = (st.i + d + n) % n; paint(); }

  const on = (id, sel, fn) => { const el = $(id); if (el) el.addEventListener('click', e => { const b = e.target.closest(sel); if (b) fn(b); }); };
  on('pitchGrid', '[data-i]', b => openM(D.pitches[+b.dataset.i], 0, b));
  on('simGrid', '[data-i]', b => openM({ title: '提案模擬圖', meta: '3D 模擬圖', groups: [{ label: '3D 模擬圖', imgs: D.sims }] }, +b.dataset.i, b));
  on('pdfStack', '[data-d]', b => { const d = D.pdfs[+b.dataset.d]; if (d) openM({ title: d.title || '施工圖', meta: '點一下圖面可放大檢視', wide: true, groups: [{ label: '施工圖', imgs: d.imgs }] }, 0, b); });

  $('mArt').addEventListener('click', e => { if (st.item && st.item.wide && e.target.tagName === 'IMG') $('mArt').classList.toggle('zoomed'); });
  $('mClose').onclick = closeM;
  modal.addEventListener('click', e => { if (e.target === modal) closeM(); });
  $('mPrev').onclick = () => step(-1); $('mNext').onclick = () => step(1);
  $('mTabs').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; st.g = +b.dataset.g; st.i = 0; paint(); });
  $('mThumbs').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; st.i = +b.dataset.k; paint(); });
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeM();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Tab') {
      const f = [...$('panel').querySelectorAll('button:not([hidden])')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
