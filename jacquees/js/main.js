/* =========================================================
   JACQUEES — page interactions
   ========================================================= */
(function () {
  'use strict';

  const D = window.JQ_DATA;
  const JQ = window.JQ;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = JQ.esc;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     Render: swatches, timeline, tiles, tracklist, albums, marquee, live
     ========================================================= */
  $('#swatches').innerHTML = D.palette.map((p) =>
    '<div class="swatch" style="--sw:' + p.hex + '" data-cursor="' + p.hex + '">' +
    '<span class="mono">' + p.hex + '</span><b>' + esc(p.name) + '</b><small>' + esc(p.note) + '</small></div>').join('');

  $('#tlTrack').innerHTML = D.timeline.map((t) =>
    '<article class="tl-item"><span class="y">' + t.y + '</span><span class="mono">' + esc(t.tag) + '</span>' +
    '<h4>' + esc(t.t) + '</h4><p>' + esc(t.d) + '</p></article>').join('');

  const featured = D.tracks.filter((t) => t.featured);
  $('#workGrid').innerHTML = featured.map((t, k) => {
    const i = D.tracks.indexOf(t);
    return '<button class="tile reveal-clip" data-i="' + i + '" data-id="' + t.id + '" data-cursor="PLAY" style="--t1:' + t.palette[0] + ';--t2:' + t.palette[2] + '">' +
      '<img class="tile-img" alt="">' +
      '<span class="mono tile-num">' + String(k + 1).padStart(2, '0') + ' / ' + String(featured.length).padStart(2, '0') + '</span>' +
      '<span class="mono tile-note">' + esc(t.note) + '</span>' +
      '<span class="tile-meta">' +
      '<span class="mono"><span class="eq"><i></i><i></i><i></i><i></i></span>&nbsp; <span data-scramble>' + esc(t.tag) + ' · ' + t.year + '</span></span>' +
      '<span class="tile-title">' + esc(t.title) + (t.feat ? ' <small>feat. ' + esc(t.feat) + '</small>' : '') + '</span>' +
      '<span class="tile-desc">' + esc(t.desc) + '</span>' +
      '</span></button>';
  }).join('');

  $('#tracklist').innerHTML = D.tracks.map((t, i) =>
    '<li><button class="track" data-i="' + i + '" data-id="' + t.id + '" data-cursor="PLAY">' +
    '<span class="mono t-idx">' + String(i + 1).padStart(2, '0') + '</span>' +
    '<span class="t-title">' + esc(t.title) + (t.feat ? '<small>feat. ' + esc(t.feat) + '</small>' : '') + '</span>' +
    '<span class="t-album">' + esc(t.album) + '</span>' +
    '<span class="mono t-year">' + t.year + '</span>' +
    '<span class="mono t-dur">' + JQ.fmt(t.dur) + '</span>' +
    '<span class="eq"><i></i><i></i><i></i><i></i></span>' +
    '</button></li>').join('');

  $('#albumGrid').innerHTML = D.albums.map((a) =>
    '<div class="album" data-id="' + a.id + '" data-reveal>' +
    '<button class="album-stage" data-cursor="' + (a.play ? 'PLAY' : 'VIEW') + '" aria-label="' + esc(a.title) + '">' +
    '<div class="vinyl"><div class="spin"><div class="label"><img alt=""></div></div></div>' +
    '<div class="sleeve"><img alt=""></div>' +
    '</button>' +
    '<div class="album-meta">' +
    '<span class="mono">' + a.date.slice(0, 4) + ' · ' + esc(a.type) + ' · ' + a.tracks + ' TRACKS</span>' +
    '<h3>' + esc(a.title) + '</h3>' +
    (a.chart ? '<span class="album-chart">' + esc(a.chart) + '</span>' : '') +
    '</div>' +
    '<a class="ghost album-link" target="_blank" rel="noopener" href="https://music.apple.com/us/album/' + a.id + '">Apple Music ↗</a>' +
    '</div>').join('');

  const mq = D.collaborators.map((n) => '<span class="marquee-item" data-cursor="FEAT.">' + esc(n) + '</span><span class="marquee-sep">✦</span>').join('');
  $('#marqueeTrack').innerHTML = mq + mq;

  /* =========================================================
     Artwork once iTunes meta arrives
     ========================================================= */
  function setImg(img, url) {
    if (!url) return;
    img.crossOrigin = 'anonymous';
    img.onload = () => img.classList.add('loaded');
    img.src = url;
  }
  JQ.on('meta', () => {
    $$('.tile').forEach((el) => setImg($('.tile-img', el), JQ.art(+el.dataset.id, 1000)));
    $$('.album').forEach((el) => {
      const id = +el.dataset.id;
      setImg($('.sleeve img', el), JQ.art(id, 600));
      setImg($('.label img', el), JQ.art(id, 200));
      const m = JQ.meta[id];
      if (m && m.collectionViewUrl) $('.album-link', el).href = m.collectionViewUrl;
    });
    // hero wall
    const urls = [...new Set([...D.albums.map((a) => JQ.art(a.id, 300)), ...D.tracks.map((t) => JQ.art(t.id, 300))].filter(Boolean))];
    if (urls.length) {
      $$('.wall-row').forEach((row, r) => {
        const list = urls.slice(r * 4).concat(urls.slice(0, r * 4));
        const html = list.map((u) => '<div class="wall-tile"><img src="' + u + '" alt="" loading="lazy"></div>').join('');
        row.innerHTML = html + html;
      });
    }
  });
  // placeholders before meta
  $$('.wall-row').forEach((row) => { row.innerHTML = '<div class="wall-tile"></div>'.repeat(16); });

  /* =========================================================
     Loader → hero intro
     ========================================================= */
  const loader = $('#loader');
  const count = $('#loaderCount'), take = $('#loaderTake'), lbar = $('#loaderBar');
  let loaderDone = false;
  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    loader.classList.add('done');
    document.body.classList.remove('is-loading');
    setTimeout(() => $('#heroWord').classList.add('in'), 250);
    setTimeout(() => loader.remove(), 1400);
  }
  (function runLoader() {
    const dur = reduced ? 200 : 1700;
    const t0 = performance.now();
    function step(now) {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(e * 100);
      count.textContent = v;
      take.textContent = String(Math.floor(e * 24)).padStart(2, '0');
      lbar.style.width = v + '%';
      if (p < 1 && !loaderDone) requestAnimationFrame(step);
      else setTimeout(finishLoader, 200);
    }
    requestAnimationFrame(step);
  })();
  loader.addEventListener('click', finishLoader);

  /* =========================================================
     Hero word — 글자 분리, 마우스 파동, 호버 시 세리프 전환
     ========================================================= */
  const word = $('#heroWord');
  word.innerHTML = [...word.textContent].map((c, i) =>
    '<span class="mask"><span class="ch-in" style="transition-delay:' + (i * 0.06) + 's"><span class="ch" aria-hidden="true">' + c + '</span></span></span>').join('');
  const chars = $$('.ch', word);
  const masks = $$('.mask', word);
  const charState = chars.map(() => ({ y: 0, r: 0 }));
  let heroMouse = { x: -9999, y: -9999, active: false };
  const hero = $('#hero');
  hero.addEventListener('pointermove', (e) => { heroMouse = { x: e.clientX, y: e.clientY, active: true }; });
  hero.addEventListener('pointerleave', () => { heroMouse.active = false; });
  chars.forEach((ch) => {
    ch.addEventListener('pointerenter', () => {
      ch.classList.add('serif');
      clearTimeout(ch._t);
      ch._t = setTimeout(() => ch.classList.remove('serif'), 1400);
    });
  });

  /* hero dust in projector beam */
  const dust = $('#heroDust');
  const dctx = dust.getContext('2d');
  let parts = [], heroVisible = true;
  function sizeDust() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    dust.width = hero.clientWidth * dpr; dust.height = hero.clientHeight * dpr;
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: reduced ? 0 : 110 }, () => ({
      x: Math.random() * hero.clientWidth, y: Math.random() * hero.clientHeight,
      vx: (Math.random() - 0.5) * 0.15, vy: -0.05 - Math.random() * 0.2,
      r: Math.random() * 1.4 + 0.3, a: Math.random() * 0.6 + 0.2, ph: Math.random() * 6.28
    }));
  }
  sizeDust();
  window.addEventListener('resize', sizeDust);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

  /* =========================================================
     Cursor + magnetic
     ========================================================= */
  const cursor = $('#cursor');
  const ring = $('.cursor-ring', cursor), dot = $('.cursor-dot', cursor), clabel = $('#cursorLabel');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 }, ringPos = { x: mouse.x, y: mouse.y };
  if (finePointer) {
    document.body.classList.add('has-cursor');
    window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button');
      if (lab) { clabel.textContent = lab.dataset.cursor; cursor.classList.add('is-label'); cursor.classList.remove('is-hover'); }
      else { cursor.classList.remove('is-label'); cursor.classList.toggle('is-hover', !!hov); }
    });
    document.addEventListener('pointerleave', () => { cursor.style.opacity = 0; });
    document.addEventListener('pointerenter', () => { cursor.style.opacity = 1; });

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * 0.3 + 'px,' + dy * 0.4 + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      el.style.transition = 'transform .35s cubic-bezier(.2,.7,.1,1)';
    });
  }

  /* =========================================================
     Text scramble
     ========================================================= */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/&*+';
  function scramble(el) {
    if (el._scr) return;
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    let f = 0; const total = 18;
    el._scr = true;
    (function tick() {
      el.textContent = [...final].map((c, i) => {
        if (c === ' ' || c === '·') return c;
        return i < (f / total) * final.length ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }).join('');
      if (++f <= total) requestAnimationFrame(tick); else { el.textContent = final; el._scr = false; }
    })();
  }
  document.addEventListener('pointerover', (e) => {
    const host = e.target.closest('[data-scramble], .tile');
    if (!host) return;
    const el = host.matches('[data-scramble]') ? host : $('[data-scramble]', host);
    if (el && !(e.relatedTarget && host.contains(e.relatedTarget))) scramble(el);
  });

  /* =========================================================
     Reveal on scroll
     ========================================================= */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.dataset.count != null) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], .reveal-clip, .swatch, .chart, [data-count]').forEach((el) => io.observe(el));

  function countUp(el) {
    const target = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1600;
    (function step(now) {
      const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + Math.round(target * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* manifesto words */
  const wordBlocks = $$('[data-words]').map((p) => {
    p.innerHTML = p.innerHTML.split(/\s+/).map((w) => '<span class="w">' + w + '</span>').join(' ');
    return { el: p, words: $$('.w', p) };
  });

  /* =========================================================
     Timeline (sticky horizontal)
     ========================================================= */
  const tl = $('#timeline'), tlTrack = $('#tlTrack'), tlItems = $$('.tl-item'), tlRail = $('#tlRail'), tlProg = $('#tlProgress');

  /* =========================================================
     Music interactions
     ========================================================= */
  $('#workGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.tile'); if (!b) return;
    const i = +b.dataset.i;
    if (JQ.player.index === i && JQ.player.loaded) JQ.toggle(); else JQ.play(i);
    JQ.openLyrics();
  });
  $('#tracklist').addEventListener('click', (e) => {
    const b = e.target.closest('.track'); if (!b) return;
    const i = +b.dataset.i;
    if (JQ.player.index === i && JQ.player.loaded) JQ.toggle(); else JQ.play(i);
  });

  // 트랙 리스트 호버 시 커버 미리보기가 커서를 따라다님
  const thumb = document.createElement('div');
  thumb.className = 'track-thumb';
  thumb.innerHTML = '<img alt="">';
  document.body.appendChild(thumb);
  const thumbImg = $('img', thumb);
  const thumbPos = { x: 0, y: 0 };
  let thumbOn = false;
  if (finePointer) {
    $('#tracklist').addEventListener('pointerover', (e) => {
      const b = e.target.closest('.track'); if (!b) return;
      const u = JQ.art(+b.dataset.id, 400);
      if (u) { thumbImg.src = u; thumb.classList.add('show'); thumbOn = true; }
    });
    $('#tracklist').addEventListener('pointerleave', () => { thumb.classList.remove('show'); thumbOn = false; });
  }

  $('#heroCue').addEventListener('click', () => { JQ.playId(6779428971); JQ.openLyrics(); });

  // 앨범: 기울기 + 레코드, 클릭 시 대표곡
  $$('.album').forEach((al) => {
    const stage = $('.album-stage', al), sleeve = $('.sleeve', al);
    const a = D.albums.find((x) => x.id === +al.dataset.id);
    if (finePointer) {
      stage.addEventListener('pointermove', (e) => {
        const r = sleeve.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        sleeve.style.transform = 'rotateY(' + ((px - 0.5) * 16) + 'deg) rotateX(' + ((0.5 - py) * 16) + 'deg)';
        sleeve.style.setProperty('--gx', px * 100 + '%');
        sleeve.style.setProperty('--gy', py * 100 + '%');
      });
      stage.addEventListener('pointerleave', () => { sleeve.style.transform = ''; });
    }
    stage.addEventListener('click', () => {
      if (a.play) { JQ.playId(a.play); JQ.toast('『' + a.title + '』 대표곡 재생'); }
      else { const m = JQ.meta[a.id]; window.open(m && m.collectionViewUrl ? m.collectionViewUrl : 'https://music.apple.com/us/album/' + a.id, '_blank', 'noopener'); }
    });
  });

  // 현재 곡 표시
  JQ.on('track', ({ track }) => {
    $$('.tile, .track').forEach((el) => el.classList.toggle('is-current', +el.dataset.id === track.id));
    $$('.album').forEach((el) => {
      const a = D.albums.find((x) => x.id === +el.dataset.id);
      el.classList.toggle('is-current', !!a && a.play === track.id);
    });
  });

  /* =========================================================
     Live — tours + chart
     ========================================================= */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  $('#tourTabs').innerHTML = D.tours.map((t, i) =>
    '<button class="tour-tab' + (i === 0 ? ' on' : '') + '" role="tab" data-k="' + t.key + '">' + esc(t.name) + '<sup>' + t.year + '</sup></button>').join('');
  function renderTour(key) {
    const t = D.tours.find((x) => x.key === key);
    $('#tourNote').textContent = (t.with ? t.with + ' — ' : '') + t.note;
    $('#shows').innerHTML = t.shows.map(([d, city, venue]) => {
      const dt = new Date(d + 'T00:00:00');
      const up = dt >= today;
      return '<li class="show"><span class="mono date"><b>' + d.replace(/-/g, '.') + '</b> · ' + DOW[dt.getDay()] + '</span>' +
        '<span class="city">' + esc(city) + '</span><span class="venue">' + esc(venue) + '</span>' +
        '<span class="mono state">' + (up ? 'UPCOMING' : 'PAST SHOW') + '</span></li>';
    }).join('');
    $$('#shows .show').forEach((el, i) => setTimeout(() => el.classList.add('in'), 60 + i * 55));
  }
  let tourRendered = false;
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting && !tourRendered) { tourRendered = true; renderTour(D.tours[0].key); obs.disconnect(); }
  }, { threshold: 0.1 }).observe($('#live'));
  $('#tourTabs').addEventListener('click', (e) => {
    const b = e.target.closest('.tour-tab'); if (!b) return;
    $$('.tour-tab').forEach((x) => x.classList.toggle('on', x === b));
    renderTour(b.dataset.k);
  });

  const maxShows = Math.max(...D.showsPerYear.map((x) => x[1]));
  $('#bars').innerHTML = D.showsPerYear.map(([y, n], i) =>
    '<div class="bar" data-y="' + y + '" data-n="' + n + '" data-cursor="' + n + '"><i style="--h:' + (n / maxShows * 100).toFixed(1) + '%;transition-delay:' + (i * 0.05) + 's"></i><span>' + String(y).slice(2) + '</span></div>').join('');
  $('#bars').addEventListener('pointerover', (e) => {
    const b = e.target.closest('.bar'); if (!b) return;
    $('#chartRead').textContent = b.dataset.y + ' — ' + b.dataset.n + ' SHOWS';
  });
  $('#bars').addEventListener('pointerleave', () => { $('#chartRead').textContent = 'HOVER A BAR'; });

  /* =========================================================
     Smooth anchor offset (nav)
     ========================================================= */
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const t = id === '#top' ? document.body : $(id);
    if (!t) return;
    e.preventDefault();
    if (JQ.isLyricsOpen()) JQ.closeLyrics();
    window.scrollTo({ top: id === '#top' ? 0 : t.getBoundingClientRect().top + scrollY, behavior: reduced ? 'auto' : 'smooth' });
  }));

  /* =========================================================
     Main loop
     ========================================================= */
  const logo = $('#logo'), sline = $('#scrollLine');
  const rows = $$('.wall-row');
  const rowX = rows.map(() => 0);
  const mqTrack = $('#marqueeTrack');
  let mqX = 0, mqHover = false, lastY = scrollY, vel = 0;
  $('#marquee').addEventListener('pointerenter', () => { mqHover = true; });
  $('#marquee').addEventListener('pointerleave', () => { mqHover = false; });

  function loop(now) {
    requestAnimationFrame(loop);
    const y = scrollY, vh = innerHeight;
    vel = lerp(vel, y - lastY, 0.15);
    lastY = y;

    // cursor
    if (finePointer) {
      ringPos.x = lerp(ringPos.x, mouse.x, 0.18);
      ringPos.y = lerp(ringPos.y, mouse.y, 0.18);
      dot.style.transform = 'translate(' + mouse.x + 'px,' + mouse.y + 'px)';
      ring.style.transform = 'translate(' + ringPos.x + 'px,' + ringPos.y + 'px)';
    }
    if (thumbOn) {
      thumbPos.x = lerp(thumbPos.x, mouse.x + 30, 0.14);
      thumbPos.y = lerp(thumbPos.y, mouse.y - 110, 0.14);
      thumb.style.left = thumbPos.x + 'px';
      thumb.style.top = thumbPos.y + 'px';
    }

    // progress + logo
    const maxS = document.documentElement.scrollHeight - vh;
    sline.style.transform = 'scaleX(' + (maxS > 0 ? y / maxS : 0) + ')';
    logo.classList.toggle('small', y > 80);

    // hero
    if (heroVisible && !reduced) {
      const energy = JQ.player.energy || 0;
      rows.forEach((row, i) => {
        const dir = +row.dataset.dir;
        rowX[i] -= dir * (0.35 + Math.abs(vel) * 0.08 + energy * 2);
        const half = row.scrollWidth / 2 || 1;
        if (rowX[i] < -half) rowX[i] += half;
        if (rowX[i] > 0) rowX[i] -= half;
        row.style.transform = 'translate3d(' + rowX[i] + 'px,0,0)';
      });
      // letters wave toward cursor
      chars.forEach((ch, i) => {
        const r = masks[i].getBoundingClientRect();
        const cx = r.left + r.width / 2;
        let ty = 0, rot = 0;
        if (heroMouse.active) {
          const dx = heroMouse.x - cx;
          const f = Math.exp(-(dx * dx) / (2 * 140 * 140));
          ty = -f * 38 * clamp((heroMouse.y - r.top) / r.height, -0.5, 1.5);
          rot = f * clamp(dx / 30, -6, 6);
        }
        ty += Math.sin(now / 1100 + i * 0.7) * 4 - energy * 14 * Math.sin(i + now / 200);
        const s = charState[i];
        s.y = lerp(s.y, ty, 0.12); s.r = lerp(s.r, rot, 0.12);
        ch.style.transform = 'translate3d(0,' + s.y.toFixed(2) + 'px,0) rotate(' + s.r.toFixed(2) + 'deg)';
      });
      // hero parallax on scroll
      word.style.opacity = clamp(1 - y / (vh * 0.8), 0, 1);
      word.style.translate = '0 ' + (y * 0.35) + 'px';
      // dust
      const W = hero.clientWidth, H = hero.clientHeight;
      dctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx + Math.sin(now / 2000 + p.ph) * 0.05; p.y += p.vy;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        const beam = Math.max(0, 1 - Math.abs(p.x - W / 2) / (60 + p.y * 0.42));
        const a = p.a * (0.12 + beam * 0.9) * (0.7 + 0.3 * Math.sin(now / 700 + p.ph));
        if (a < 0.02) continue;
        dctx.fillStyle = 'rgba(255,240,230,' + a.toFixed(3) + ')';
        dctx.beginPath(); dctx.arc(p.x, p.y, p.r, 0, 6.283); dctx.fill();
      }
    }

    // manifesto words
    wordBlocks.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    });

    // timeline pin
    const tr = tl.getBoundingClientRect();
    if (tr.top < vh && tr.bottom > 0) {
      const total = tl.offsetHeight - vh;
      const p = clamp(-tr.top / total, 0, 1);
      const dist = tlTrack.scrollWidth - innerWidth + 120;
      tlTrack.style.transform = 'translate3d(' + (-p * dist) + 'px,0,0)';
      tlRail.style.transform = 'scaleX(' + p + ')';
      const ai = Math.min(tlItems.length - 1, Math.round(p * (tlItems.length - 1)));
      tlItems.forEach((it, i) => it.classList.toggle('active', i === ai));
      tlProg.textContent = D.timeline[ai].y + ' — ' + String(ai + 1).padStart(2, '0') + '/' + String(tlItems.length).padStart(2, '0');
    }

    // marquee
    if (!reduced) {
      const speed = (mqHover ? 0.25 : 1.1) + Math.abs(vel) * 0.25;
      mqX -= speed * (vel < -0.5 ? -1 : 1);
      const half = mqTrack.scrollWidth / 2 || 1;
      if (mqX < -half) mqX += half;
      if (mqX > 0) mqX -= half;
      mqTrack.style.transform = 'translate3d(' + mqX + 'px,0,0)';
    }
  }
  requestAnimationFrame(loop);
})();
