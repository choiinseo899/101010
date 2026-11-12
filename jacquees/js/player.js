/* =========================================================
   JACQUEES — player
   · iTunes 미리듣기(30초) / 드래그한 전체 곡 파일 재생
   · LRCLIB 싱크 가사 → Apple Music 스타일 가사 화면
   · Web Audio 분석으로 배경/아트워크가 음악에 반응
   ========================================================= */
(function () {
  'use strict';

  const D = window.JQ_DATA;
  const JQ = (window.JQ = window.JQ || {});
  const $ = (s, r = document) => r.querySelector(s);
  const enc = encodeURIComponent;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  };
  JQ.fmt = fmt;
  JQ.esc = esc;

  /* ---------- tiny event bus ---------- */
  const bus = new EventTarget();
  JQ.on = (n, fn) => bus.addEventListener(n, (e) => fn(e.detail));
  const emit = (n, d) => bus.dispatchEvent(new CustomEvent(n, { detail: d }));

  /* ---------- toast ---------- */
  let toastTimer;
  JQ.toast = (msg, ms = 3800) => {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  };

  /* =========================================================
     iTunes Search API (JSONP — file:// 로 열어도 동작)
     ========================================================= */
  function jsonp(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const cb = 'jqcb_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      const s = document.createElement('script');
      const done = () => { delete window[cb]; s.remove(); clearTimeout(t); };
      const t = setTimeout(() => { done(); reject(new Error('timeout')); }, timeout);
      window[cb] = (data) => { done(); resolve(data); };
      s.onerror = () => { done(); reject(new Error('jsonp error')); };
      s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
      document.head.appendChild(s);
    });
  }

  const meta = (JQ.meta = {});
  JQ.art = (id, size = 600) => {
    const m = meta[id];
    if (!m || !m.artworkUrl100) return null;
    return m.artworkUrl100.replace(/\/\d+x\d+bb\./, '/' + size + 'x' + size + 'bb.');
  };

  JQ.metaReady = (async () => {
    const ids = [...D.tracks.map((t) => t.id), ...D.albums.map((a) => a.id)];
    try {
      const r = await jsonp('https://itunes.apple.com/lookup?id=' + ids.join(',') + '&country=us');
      (r.results || []).forEach((x) => {
        const id = x.wrapperType === 'track' ? x.trackId : x.collectionId;
        meta[id] = x;
      });
    } catch (e) {
      console.warn('[JQ] iTunes lookup failed', e);
      JQ.toast('앨범 아트·미리듣기를 불러오지 못했어요. 네트워크를 확인해 주세요.');
    }
    emit('meta', meta);
    return meta;
  })();

  /* =========================================================
     LRCLIB synced lyrics
     ========================================================= */
  const lyricCache = {};
  function parseLRC(str) {
    const out = [];
    str.split(/\r?\n/).forEach((line) => {
      const tags = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
      if (!tags.length) return;
      const text = line.replace(/\[[^\]]*\]/g, '').trim();
      tags.forEach((m) => out.push({ t: +m[1] * 60 + +m[2], text }));
    });
    return out.sort((a, b) => a.t - b.t);
  }

  async function fetchLyrics(track) {
    if (track.id in lyricCache) return lyricCache[track.id];
    const m = meta[track.id];
    const dur = m ? Math.round(m.trackTimeMillis / 1000) : track.dur;
    const name = track.lrc || track.title;
    let j = null;
    try {
      const r = await fetch('https://lrclib.net/api/get?artist_name=Jacquees&track_name=' + enc(name) + '&duration=' + dur);
      if (r.ok) j = await r.json();
    } catch (e) { /* fallthrough */ }
    if (!j || (!j.syncedLyrics && !j.plainLyrics)) {
      try {
        const r = await fetch('https://lrclib.net/api/search?artist_name=Jacquees&track_name=' + enc(name));
        if (r.ok) {
          const arr = await r.json();
          j = arr.find((x) => x.syncedLyrics) || arr.find((x) => x.plainLyrics) || j;
        }
      } catch (e) { /* ignore */ }
    }
    const res = j
      ? { synced: j.syncedLyrics ? parseLRC(j.syncedLyrics) : null, plain: j.plainLyrics || null, instrumental: !!j.instrumental }
      : null;
    lyricCache[track.id] = res;
    return res;
  }

  /* 화면용 줄: 긴 간주 구간에는 Apple Music처럼 ••• 를 넣는다 */
  function buildLines(synced, dur) {
    const lines = [];
    if (synced.length && synced[0].t > 4) lines.push({ t: 0, inter: true });
    synced.forEach((l, i) => {
      if (!l.text) { lines.push({ t: l.t, inter: true }); return; }
      lines.push({ t: l.t, text: l.text });
      const next = synced[i + 1];
      const end = next ? next.t : dur;
      if (end - l.t > 11) lines.push({ t: l.t + 6, inter: true });
    });
    for (let i = 0; i < lines.length; i++) lines[i].end = lines[i + 1] ? lines[i + 1].t : dur;
    return lines;
  }

  /* 30초 미리듣기가 곡의 어디서 시작하는지는 API가 알려주지 않는다.
     → 가장 많이 반복되는 줄(후렴)의 시작점으로 추정하고, 사용자가 줄을 눌러 보정 */
  function estimateOffset(synced, dur) {
    const L = synced.filter((l) => l.text);
    const maxStart = Math.max(0, dur - 30);
    if (!L.length) return clamp(dur * 0.3, 0, maxStart);
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const counts = {};
    L.forEach((l) => { const k = norm(l.text); if (k.length > 6) counts[k] = (counts[k] || 0) + 1; });
    let best = 1;
    Object.values(counts).forEach((c) => { if (c > best) best = c; });
    if (best < 2) return clamp(dur * 0.3, 0, maxStart);
    let i = L.findIndex((l) => counts[norm(l.text)] === best);
    while (i > 0 && (counts[norm(L[i - 1].text)] || 0) >= best && L[i].t - L[i - 1].t < 8) i--;
    return clamp(L[i].t - 1.2, 0, maxStart);
  }

  const offsetKey = (id) => 'jq-offset-' + id;
  const loadOffset = (id) => { try { const v = localStorage.getItem(offsetKey(id)); return v == null ? null : +v; } catch (e) { return null; } };
  const saveOffset = (id, v) => { try { localStorage.setItem(offsetKey(id), String(v)); } catch (e) { /* ignore */ } };
  const clearOffset = (id) => { try { localStorage.removeItem(offsetKey(id)); } catch (e) { /* ignore */ } };

  /* =========================================================
     Palette from artwork
     ========================================================= */
  function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  const hsl = (h, s, l) => 'hsl(' + Math.round(h * 360) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%)';
  function tone([h, s, l], maxL, minS) { return hsl(h, Math.max(s, minS), Math.min(l, maxL)); }

  function extractPalette(img) {
    const c = document.createElement('canvas');
    c.width = c.height = 36;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 36, 36);
    const data = ctx.getImageData(0, 0, 36, 36).data;
    const buckets = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = (r >> 5) + ',' + (g >> 5) + ',' + (b >> 5);
      const o = buckets[key] || (buckets[key] = { r: 0, g: 0, b: 0, n: 0 });
      o.r += r; o.g += g; o.b += b; o.n++;
    }
    const cols = Object.values(buckets).map((o) => {
      const rgb = [o.r / o.n, o.g / o.n, o.b / o.n];
      const [h, s, l] = rgbToHsl(...rgb);
      const lumW = l < 0.06 || l > 0.94 ? 0.15 : 1;
      return { rgb, hsl: [h, s, l], score: o.n * (0.25 + s) * lumW };
    }).sort((a, b) => b.score - a.score);
    const picked = [];
    for (const c2 of cols) {
      if (picked.every((p) => Math.hypot(p.rgb[0] - c2.rgb[0], p.rgb[1] - c2.rgb[1], p.rgb[2] - c2.rgb[2]) > 70)) picked.push(c2);
      if (picked.length === 4) break;
    }
    while (picked.length < 4) picked.push(picked[picked.length - 1] || cols[0]);
    return picked.map((p) => p.hsl);
  }

  function applyPalette(hsls) {
    hsls = hsls.filter(Boolean);
    if (!hsls.length) return;
    while (hsls.length < 4) hsls.push(hsls[hsls.length % Math.max(1, hsls.length - 1)] || hsls[0]);
    const root = document.documentElement.style;
    root.setProperty('--c1', tone(hsls[0], 0.34, 0.35));
    root.setProperty('--c2', tone(hsls[1], 0.30, 0.30));
    root.setProperty('--c3', tone(hsls[2], 0.55, 0.45));
    root.setProperty('--c4', tone(hsls[3], 0.50, 0.40));
    const lx = $('#lyrics').style;
    lx.setProperty('--lx1', tone(hsls[0], 0.45, 0.5));
    lx.setProperty('--lx2', tone(hsls[1], 0.55, 0.5));
    lx.setProperty('--lx3', tone(hsls[2], 0.40, 0.45));
  }

  function paletteForTrack(track) {
    applyPalette(track.palette.map((h) => rgbToHsl(...hexToRgb(h))));
    const url = JQ.art(track.id, 120);
    if (!url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { try { if (JQ.current() === track) applyPalette(extractPalette(img)); } catch (e) { /* tainted canvas → keep fallback */ } };
    img.src = url;
  }

  /* =========================================================
     Player core
     ========================================================= */
  const audio = $('#audio');
  const P = (JQ.player = {
    queue: D.tracks,
    index: 0,
    mode: 'preview',
    offset: 0,
    baseOffset: 0,
    lyrics: null,
    lines: [],
    full: {},
    ctx: null, analyser: null, freq: null,
    energy: 0,
    loaded: false
  });
  JQ.current = () => P.queue[P.index];

  function ensureGraph() {
    if (P.ctx) { if (P.ctx.state === 'suspended') P.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      P.ctx = new AC();
      const src = P.ctx.createMediaElementSource(audio);
      P.analyser = P.ctx.createAnalyser();
      P.analyser.fftSize = 256;
      P.analyser.smoothingTimeConstant = 0.82;
      src.connect(P.analyser);
      P.analyser.connect(P.ctx.destination);
      P.freq = new Uint8Array(P.analyser.frequencyBinCount);
    } catch (e) { console.warn('[JQ] audio graph unavailable', e); }
  }

  let firstPlayHint = true;
  let loadToken = 0;

  async function load(i, opts = {}) {
    const { autoplay = true } = opts;
    const token = ++loadToken;
    P.index = (i + P.queue.length) % P.queue.length;
    const t = P.queue[P.index];
    const full = P.full[t.id];
    P.mode = full ? 'full' : 'preview';
    P.loaded = true;
    P.lines = []; P.lyrics = null;
    emit('track', { track: t, index: P.index });
    paletteForTrack(t);
    setMediaSession(t);

    // 사용자 제스처 안에서 play()를 먼저 호출 (자동재생 정책)
    let src = full || (meta[t.id] && meta[t.id].previewUrl);
    if (!src && !full) {
      await JQ.metaReady;
      if (token !== loadToken) return;
      src = meta[t.id] && meta[t.id].previewUrl;
    }
    if (src) {
      audio.src = src;
      if (autoplay) {
        ensureGraph();
        audio.play().catch((e) => console.warn('[JQ] play blocked', e));
        if (firstPlayHint && P.mode === 'preview') {
          firstPlayHint = false;
          setTimeout(() => JQ.toast('30초 미리듣기 재생 중 · 전체 곡 파일을 화면에 끌어다 놓으면 처음부터 들을 수 있어요', 5200), 600);
        }
      }
    } else {
      JQ.toast('이 곡의 미리듣기를 찾지 못했어요');
    }

    emit('lyrics-loading', { track: t });
    const L = await fetchLyrics(t);
    if (token !== loadToken) return;
    const dur = meta[t.id] ? meta[t.id].trackTimeMillis / 1000 : t.dur;
    P.lyrics = L;
    P.lines = L && L.synced ? buildLines(L.synced, dur) : [];
    if (P.mode === 'full') P.baseOffset = 0;
    else P.baseOffset = L && L.synced ? estimateOffset(L.synced, dur) : 0;
    const saved = P.mode === 'preview' ? loadOffset(t.id) : null;
    P.offset = saved != null ? saved : P.baseOffset;
    emit('lyrics', { track: t, lyrics: L, lines: P.lines });
    emit('sync');
  }

  JQ.play = (i, opts) => load(i, opts);
  JQ.playId = (id, opts) => { const i = P.queue.findIndex((t) => t.id === id); if (i >= 0) load(i, opts); };
  JQ.toggle = () => {
    if (!P.loaded || !audio.src) { load(P.index); return; }
    ensureGraph();
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
  };
  JQ.next = () => load(P.index + 1);
  JQ.prev = () => {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    load(P.index - 1);
  };
  JQ.lyricTime = () => audio.currentTime + P.offset;

  audio.addEventListener('play', () => { document.body.classList.add('is-playing'); emit('state', true); });
  audio.addEventListener('pause', () => { document.body.classList.remove('is-playing'); emit('state', false); });
  audio.addEventListener('ended', () => JQ.next());
  let errStreak = 0;
  audio.addEventListener('playing', () => { errStreak = 0; });
  audio.addEventListener('error', () => {
    if (!audio.getAttribute('src')) return;
    errStreak++;
    if (errStreak >= 3) { JQ.toast('오디오를 불러올 수 없어요. 네트워크를 확인해 주세요.'); return; }
    JQ.toast('이 곡을 재생할 수 없어 다음 곡으로 넘어갑니다.');
    setTimeout(() => JQ.next(), 1200);
  });

  function setMediaSession(t) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title + (t.feat ? ' (feat. ' + t.feat + ')' : ''),
        artist: 'Jacquees',
        album: t.album,
        artwork: JQ.art(t.id, 512) ? [{ src: JQ.art(t.id, 512), sizes: '512x512', type: 'image/jpeg' }] : []
      });
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => JQ.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => JQ.prev());
    } catch (e) { /* ignore */ }
  }

  /* =========================================================
     Mini player
     ========================================================= */
  const mini = {
    play: $('#miniPlay'), title: $('#miniTitle'), sub: $('#miniSub'), time: $('#miniTime'),
    viz: $('#miniViz'), line: $('#playLine')
  };
  const vctx = mini.viz.getContext('2d');
  mini.play.addEventListener('click', () => JQ.toggle());
  $('#miniNext').addEventListener('click', () => JQ.next());
  $('#miniPrev').addEventListener('click', () => JQ.prev());
  $('#miniMeta').addEventListener('click', () => JQ.openLyrics());
  $('#navLyrics').addEventListener('click', () => JQ.openLyrics());

  JQ.on('track', ({ track }) => {
    mini.title.textContent = track.title;
    mini.sub.textContent = (track.feat ? 'FEAT. ' + track.feat + ' · ' : '') + (P.mode === 'full' ? 'FULL TRACK' : 'PREVIEW');
  });

  /* =========================================================
     Lyrics overlay (Apple Music style)
     ========================================================= */
  const LX = {
    root: $('#lyrics'), lines: $('#lxLines'), right: $('#lxRight'), status: $('#lxStatus'),
    art: $('#lxArt'), blur1: $('#lxBlur1'), blur2: $('#lxBlur2'),
    title: $('#lxTitle'), artist: $('#lxArtist'), tag: $('#lxTag'),
    fill: $('#lxFill'), prog: $('#lxProgress'), cur: $('#lxCur'), dur: $('#lxDur'), mode: $('#lxMode'),
    syncVal: $('#syncVal'), hint: $('#lxHint')
  };
  let els = [];
  let activeIdx = -2;
  let manual = 0, manualTimer = null, plainMode = false;

  JQ.isLyricsOpen = () => LX.root.classList.contains('open');
  JQ.openLyrics = () => {
    if (!P.loaded) load(P.index);
    LX.root.classList.add('open');
    LX.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lx-open');
    activeIdx = -2;
    requestAnimationFrame(() => layoutLyrics(true));
  };
  JQ.closeLyrics = () => {
    LX.root.classList.remove('open');
    LX.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lx-open');
  };
  $('#lxClose').addEventListener('click', JQ.closeLyrics);
  $('#lxPlay').addEventListener('click', () => JQ.toggle());
  $('#lxNext').addEventListener('click', () => JQ.next());
  $('#lxPrev').addEventListener('click', () => JQ.prev());

  JQ.on('track', ({ track, index }) => {
    const art600 = JQ.art(track.id, 600);
    const art1000 = JQ.art(track.id, 1000) || art600;
    LX.art.style.opacity = 0;
    if (art1000) {
      const pre = new Image();
      pre.crossOrigin = 'anonymous';
      pre.onload = () => { LX.art.src = art1000; LX.art.style.opacity = 1; };
      pre.src = art1000;
      LX.blur1.style.backgroundImage = 'url("' + art600 + '")';
      LX.blur2.style.backgroundImage = 'url("' + art600 + '")';
    } else {
      LX.blur1.style.backgroundImage = LX.blur2.style.backgroundImage = 'linear-gradient(135deg,' + track.palette.join(',') + ')';
    }
    LX.title.textContent = track.title;
    LX.artist.textContent = 'Jacquees' + (track.feat ? ' · feat. ' + track.feat : '');
    LX.tag.textContent = 'NOW PLAYING · ' + String(index + 1).padStart(2, '0') + '/' + String(P.queue.length).padStart(2, '0') + ' · ' + track.album;
    LX.mode.textContent = P.mode === 'full' ? 'FULL TRACK' : 'PREVIEW 30S';
    LX.root.classList.toggle('full-mode', P.mode === 'full');
    LX.hint.textContent = P.mode === 'full'
      ? '전체 곡 재생 중 · 가사 줄을 누르면 그 위치로 이동합니다.'
      : '미리듣기(30초) 구간이에요. 가사 줄을 누르면 지금 들리는 부분에 싱크를 맞춥니다. 전체 곡 파일(mp3·m4a)을 끌어다 놓으면 처음부터 정확한 싱크로 재생돼요.';
    LX.lines.innerHTML = '';
    els = [];
    LX.status.innerHTML = '';
  });

  JQ.on('lyrics-loading', () => {
    LX.status.innerHTML = '<span class="mono">LRCLIB</span>가사를 불러오는 중…';
  });

  JQ.on('lyrics', ({ lyrics, lines }) => {
    LX.status.innerHTML = '';
    manual = 0;
    plainMode = false;
    LX.right.classList.remove('lx-plain');
    if (lines.length) {
      LX.lines.innerHTML = lines.map((l, i) => l.inter
        ? '<div class="lx-line inter" data-i="' + i + '" aria-hidden="true"><i></i><i></i><i></i></div>'
        : '<button class="lx-line" data-i="' + i + '">' + esc(l.text) + '</button>').join('');
    } else if (lyrics && lyrics.plain) {
      plainMode = true;
      LX.right.classList.add('lx-plain');
      LX.lines.innerHTML = lyrics.plain.split(/\r?\n/).map((s) => s.trim()
        ? '<p class="lx-line">' + esc(s) + '</p>' : '<p class="lx-line" style="height:28px"></p>').join('');
      LX.status.innerHTML = '';
      JQ.toast('이 곡은 싱크 가사가 없어 전체 가사만 표시합니다 · 스크롤로 넘겨보세요');
    } else if (lyrics && lyrics.instrumental) {
      LX.lines.innerHTML = '';
      LX.status.innerHTML = '<span class="mono">INSTRUMENTAL</span>가사가 없는 곡이에요.';
    } else {
      LX.lines.innerHTML = '';
      LX.status.innerHTML = '<span class="mono">NO LYRICS</span>이 곡의 가사를 찾지 못했어요.';
    }
    els = [...LX.lines.children];
    activeIdx = -2;
    layoutLyrics(true);
  });

  // 가사 줄 클릭: 전체 곡이면 이동, 미리듣기면 싱크 맞춤
  LX.lines.addEventListener('click', (e) => {
    const b = e.target.closest('.lx-line');
    if (!b || plainMode || b.dataset.i == null) return;
    const line = P.lines[+b.dataset.i];
    if (!line) return;
    if (P.mode === 'full') {
      audio.currentTime = Math.max(0, line.t - P.offset + 0.05);
      if (audio.paused) JQ.toggle();
    } else {
      P.offset = line.t - audio.currentTime;
      saveOffset(JQ.current().id, P.offset);
      emit('sync');
      JQ.toast('싱크를 맞췄어요 — 이 곡에 저장됩니다');
    }
    manual = 0;
    activeIdx = -2;
  });

  // 수동 스크롤 (휠/터치) → 2.5초 뒤 자동 복귀
  function nudgeManual(dy) {
    manual += dy;
    clearTimeout(manualTimer);
    if (!plainMode) manualTimer = setTimeout(() => { manual = 0; activeIdx = -2; }, 2500);
    layoutLyrics(false, true);
  }
  LX.right.addEventListener('wheel', (e) => { e.preventDefault(); nudgeManual(e.deltaY); }, { passive: false });
  let touchY = null;
  LX.right.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  LX.right.addEventListener('touchmove', (e) => { if (touchY == null) return; const y = e.touches[0].clientY; nudgeManual(touchY - y); touchY = y; }, { passive: true });

  // 싱크 보정 버튼
  $('#syncMinus').addEventListener('click', () => { P.offset -= 0.5; afterNudge(); });
  $('#syncPlus').addEventListener('click', () => { P.offset += 0.5; afterNudge(); });
  $('#syncReset').addEventListener('click', () => { P.offset = P.baseOffset; clearOffset(JQ.current().id); emit('sync'); activeIdx = -2; });
  function afterNudge() { if (P.mode === 'preview') saveOffset(JQ.current().id, P.offset); emit('sync'); activeIdx = -2; }
  JQ.on('sync', () => {
    const d = P.offset - P.baseOffset;
    LX.syncVal.textContent = (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + 's';
  });

  // seek
  let seeking = false;
  function seekAt(x) {
    const r = LX.prog.getBoundingClientRect();
    const p = clamp((x - r.left) / r.width, 0, 1);
    if (isFinite(audio.duration)) audio.currentTime = p * audio.duration;
    activeIdx = -2;
  }
  LX.prog.addEventListener('pointerdown', (e) => { seeking = true; LX.prog.setPointerCapture(e.pointerId); seekAt(e.clientX); });
  LX.prog.addEventListener('pointermove', (e) => { if (seeking) seekAt(e.clientX); });
  LX.prog.addEventListener('pointerup', () => { seeking = false; });

  function findActive(time) {
    const L = P.lines;
    if (!L.length || time < L[0].t) return -1;
    let lo = 0, hi = L.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (L[mid].t <= time) lo = mid; else hi = mid - 1; }
    return lo;
  }

  function layoutLyrics(force, manualOnly) {
    if (!els.length) { LX.lines.style.transform = ''; return; }
    const h = LX.right.clientHeight;
    let a = plainMode ? -1 : findActive(JQ.lyricTime());
    if (a !== activeIdx || force) {
      activeIdx = a;
      if (!plainMode) {
        els.forEach((el, i) => {
          el.classList.toggle('active', i === a);
          el.classList.toggle('past', i < a);
          const dist = Math.abs(i - Math.max(a, 0));
          el.style.setProperty('--b', i === a ? '0px' : Math.min(dist * 0.55, 2.6).toFixed(2) + 'px');
        });
      }
    }
    if (plainMode) {
      const maxScroll = Math.max(0, LX.lines.scrollHeight - h * 0.6);
      manual = clamp(manual, -h * 0.25, maxScroll);
      LX.lines.style.transform = 'translateY(' + (h * 0.22 - manual) + 'px)';
      return;
    }
    const target = els[Math.max(a, 0)];
    const y = target ? target.offsetTop : 0;
    LX.lines.style.transform = 'translateY(' + Math.round(h * 0.34 - y - manual) + 'px)';
  }

  /* =========================================================
     Frame loop
     ========================================================= */
  const bars = new Array(9).fill(0);
  let lastLayoutIdx = -3;
  function frame() {
    requestAnimationFrame(frame);
    const playing = !audio.paused;

    // energy (저역 위주)
    let e = 0;
    if (P.analyser && playing) {
      P.analyser.getByteFrequencyData(P.freq);
      let s = 0;
      for (let i = 1; i < 18; i++) s += P.freq[i];
      e = s / (17 * 255);
      for (let k = 0; k < bars.length; k++) {
        const v = P.freq[2 + k * 5] / 255;
        bars[k] += (v - bars[k]) * 0.35;
      }
    } else {
      for (let k = 0; k < bars.length; k++) bars[k] += (0.08 + 0.04 * Math.sin(performance.now() / 600 + k) - bars[k]) * 0.1;
    }
    P.energy += (e - P.energy) * 0.25;
    if (JQ.isLyricsOpen()) LX.root.style.setProperty('--energy', P.energy.toFixed(3));
    document.documentElement.style.setProperty('--energy', P.energy.toFixed(3));

    // mini viz
    const W = mini.viz.width, H = mini.viz.height;
    vctx.clearRect(0, 0, W, H);
    vctx.fillStyle = '#fff';
    const bw = 3, gap = (W - bars.length * bw) / (bars.length - 1);
    for (let k = 0; k < bars.length; k++) {
      const bh = Math.max(2, bars[k] * H);
      vctx.fillRect(k * (bw + gap), H - bh, bw, bh);
    }

    // time
    const cur = audio.currentTime || 0;
    const dur = isFinite(audio.duration) ? audio.duration : 30;
    if (P.loaded) {
      mini.time.textContent = fmt(cur);
      mini.line.style.transform = 'scaleX(' + (cur / dur || 0) + ')';
    }

    // lyrics
    if (JQ.isLyricsOpen()) {
      LX.fill.style.width = (cur / dur * 100 || 0) + '%';
      LX.cur.textContent = fmt(cur);
      LX.dur.textContent = fmt(dur);
      LX.root.classList.toggle('is-paused-lx', !playing);
      if (!plainMode && P.lines.length) {
        const t = JQ.lyricTime();
        const a = findActive(t);
        if (a !== lastLayoutIdx || activeIdx === -2) { lastLayoutIdx = a; layoutLyrics(true); }
        if (a >= 0 && els[a]) {
          const L = P.lines[a];
          const p = clamp((t - L.t) / Math.max(0.6, (L.end - L.t) * 0.9), 0, 1);
          els[a].style.setProperty('--p', (p * 100).toFixed(1) + '%');
        }
      }
    }
  }
  requestAnimationFrame(frame);
  window.addEventListener('resize', () => layoutLyrics(true));

  /* =========================================================
     Keyboard
     ========================================================= */
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.code === 'Space') { e.preventDefault(); JQ.toggle(); }
    else if (e.key === 'l' || e.key === 'L' || e.key === 'ㅣ') { JQ.isLyricsOpen() ? JQ.closeLyrics() : JQ.openLyrics(); }
    else if (e.key === 'Escape' && JQ.isLyricsOpen()) JQ.closeLyrics();
    else if (e.key === 'ArrowRight' && JQ.isLyricsOpen()) JQ.next();
    else if (e.key === 'ArrowLeft' && JQ.isLyricsOpen()) JQ.prev();
  });

  /* =========================================================
     Drag & drop full track
     ========================================================= */
  const dz = $('#dropzone');
  let depth = 0;
  const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; depth++; dz.classList.add('show'); });
  window.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) dz.classList.remove('show'); });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0; dz.classList.remove('show');
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('audio') || /\.(mp3|m4a|aac|wav|flac|ogg)$/i.test(f.name));
    if (!files.length) { JQ.toast('오디오 파일(mp3, m4a 등)만 놓을 수 있어요'); return; }
    const norm = (s) => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]/g, '');
    let firstIdx = null;
    files.forEach((f) => {
      const n = norm(f.name);
      let best = -1, bestLen = 0;
      P.queue.forEach((t, i) => { const k = norm(t.title); if (k.length > bestLen && n.includes(k)) { best = i; bestLen = k.length; } });
      if (best < 0) best = P.index;
      if (P.full[P.queue[best].id]) URL.revokeObjectURL(P.full[P.queue[best].id]);
      P.full[P.queue[best].id] = URL.createObjectURL(f);
      if (firstIdx == null) firstIdx = best;
    });
    load(firstIdx);
    JQ.openLyrics();
    JQ.toast('전체 곡으로 재생합니다 · 가사가 처음부터 정확히 따라와요');
  });
})();
