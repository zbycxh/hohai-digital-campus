// assets/app.js — 杂志版式 · 单板块切换交互（Mock 演示）
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 收集所有板块 ---------- */
  var pages = $$('main#viewer > section.page');
  var rail = $('#rail');
  var dotnav = $('#dotnav');
  var pageind = $('#pageind');
  var prevBtn = $('#prev');
  var nextBtn = $('#next');
  var viewer = $('#viewer');
  var progress = $('#progress');
  var current = 0;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function nameOf(p) { return p.getAttribute('data-name') || p.id; }

  /* ---------- 顶部按钮条 + 右侧索引：按板块生成 ---------- */
  pages.forEach(function (p, i) {
    var raw = nameOf(p);
    var m = raw.match(/^(\d+)\s+(.*)$/);
    var no = m ? m[1] : '';
    var label = m ? m[2] : raw;

    if (rail) {
      var b = document.createElement('button');
      b.setAttribute('data-go', p.id);
      b.innerHTML = (no ? '<i>' + no + '</i>' : '') + label;
      rail.appendChild(b);
    }
    if (dotnav) {
      var d = document.createElement('button');
      d.setAttribute('data-target', p.id);
      d.setAttribute('data-label', raw);
      d.setAttribute('aria-label', raw);
      dotnav.appendChild(d);
    }
  });

  var railBtns = rail ? $$('button', rail) : [];
  var dotBtns = dotnav ? $$('button', dotnav) : [];

  /* ---------- 板块切换 ---------- */
  function goTo(id, updateHash) {
    var idx = pages.findIndex(function (p) { return p.id === id; });
    if (idx < 0) return;
    current = idx;

    pages.forEach(function (p, i) { p.classList.toggle('is-on', i === idx); });
    railBtns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-go') === id); });
    dotBtns.forEach(function (d) { d.classList.toggle('on', d.getAttribute('data-target') === id); });

    if (pageind) pageind.textContent = pad2(idx + 1) + ' / ' + pad2(pages.length);
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === pages.length - 1;
    if (progress) progress.style.width = ((idx + 1) / pages.length) * 100 + '%';

    if (viewer) viewer.scrollTop = 0;
    if (updateHash !== false && history.replaceState) history.replaceState(null, '', '#' + id);

    var page = pages[idx];
    revealPage(page);
    runCounters(page);
    syncVideos(page);
    onShow(page);

    // 让当前按钮在按钮条中可见
    var activeBtn = railBtns[idx];
    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function revealPage(page) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $$('.reveal', page).forEach(function (el) { el.classList.add('in'); });
      });
    });
  }

  function step(delta) {
    var n = current + delta;
    if (n < 0 || n >= pages.length) return;
    goTo(pages[n].id);
  }

  /* ---------- 数字滚动 ---------- */
  function runCount(el) {
    if (el.getAttribute('data-counted')) return;
    el.setAttribute('data-counted', '1');
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var dur = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }
  function runCounters(page) { $$('.count', page).forEach(runCount); }

  /* ---------- 视频：只播放当前板块的水面影像 ---------- */
  var allVideos = $$('#viewer video'); // 排除贯穿全站的底纹水视频
  function syncVideos(page) {
    allVideos.forEach(function (v) {
      if (page.contains(v)) {
        var pr = v.play();
        if (pr && pr.catch) pr.catch(function () {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  }

  /* ---------- 按钮绑定 ---------- */
  railBtns.forEach(function (b) {
    b.addEventListener('click', function () { goTo(b.getAttribute('data-go')); });
  });
  dotBtns.forEach(function (d) {
    d.addEventListener('click', function () { goTo(d.getAttribute('data-target')); });
  });
  $$('[data-go]').forEach(function (el) {
    if (rail && rail.contains(el)) return; // 顶部按钮条已单独绑定
    el.addEventListener('click', function (e) {
      e.preventDefault();
      goTo(el.getAttribute('data-go'));
    });
  });
  if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    if (e.key === 'Home') { e.preventDefault(); goTo(pages[0].id); }
    if (e.key === 'End') { e.preventDefault(); goTo(pages[pages.length - 1].id); }
  });

  window.addEventListener('hashchange', function () {
    var id = (location.hash || '').replace('#', '');
    if (id && id !== pages[current].id) goTo(id, false);
  });

  /* ---------- 校区切换 ---------- */
  var tabs = $$('.tab');
  var panes = { xk: $('#pane-xk'), jn: $('#pane-jn'), cz: $('#pane-cz') };
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('on'); });
      t.classList.add('on');
      var key = t.getAttribute('data-campus');
      Object.keys(panes).forEach(function (k) {
        if (panes[k]) panes[k].classList.toggle('on', k === key);
      });
      var pane = panes[key];
      if (pane) $$('.reveal', pane).forEach(function (el) { el.classList.add('in'); });
    });
  });

  /* ---------- 契合度测试 ---------- */
  var answers = { 0: null, 1: null, 2: null };
  var resultData = {
    water: { title: '水利水电工程方向', pill: '上善若水 · 治水兴邦', desc: '你沉稳务实、愿意扎根一线。河海的水利工程国家一级重点学科，正是培养治水兴邦人才的地方。' },
    env:   { title: '环境与生态方向', pill: '绿水青山 · 碧水长流', desc: '你严谨求实、关心人与自然的和谐。水环境与水生态方向，适合让河湖更健康的你。' },
    sea:   { title: '海洋与海岸方向', pill: '经略蓝土 · 向海图强', desc: '你向往开阔与远方。港口海岸与近海工程、海洋相关方向，等待你去描绘蓝色国土。' },
    smart: { title: '智慧水利方向', pill: '数字孪生 · 拥抱未来', desc: '你敢想敢闯、热爱数据与模型。智慧水利、人工智能等交叉方向，让你的技术与水利碰撞火花。' }
  };

  $$('.opts').forEach(function (group) {
    var qi = group.getAttribute('data-q');
    $$('.opt', group).forEach(function (opt) {
      opt.addEventListener('click', function () {
        $$('.opt', group).forEach(function (o) { o.classList.remove('sel'); });
        opt.classList.add('sel');
        answers[qi] = opt.getAttribute('data-v');
        var hint = $('#quiz-hint');
        if (hint && answers[0] && answers[1] && answers[2]) hint.textContent = '已完成，点击按钮查看结果';
      });
    });
  });

  function tally() {
    var count = { water: 0, env: 0, sea: 0, smart: 0 };
    [0, 1, 2].forEach(function (i) { if (answers[i]) count[answers[i]]++; });
    var best = 'water', bestN = -1;
    ['water', 'smart', 'env', 'sea'].forEach(function (k) { if (count[k] > bestN) { bestN = count[k]; best = k; } });
    return best;
  }

  var submit = $('#quiz-submit');
  if (submit) {
    submit.addEventListener('click', function () {
      var hint = $('#quiz-hint');
      if (!answers[0] || !answers[1] || !answers[2]) {
        if (hint) hint.textContent = '还有题目没选哦～';
        return;
      }
      var d = resultData[tally()];
      $('#result-title').textContent = '你的方向是：' + d.title;
      $('#result-pill').textContent = d.pill;
      $('#result-desc').textContent = d.desc;
      $('#quiz-result').classList.add('on');
      $('#quiz-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  var reset = $('#quiz-reset');
  if (reset) {
    reset.addEventListener('click', function () {
      answers = { 0: null, 1: null, 2: null };
      $$('.opt').forEach(function (o) { o.classList.remove('sel'); });
      $('#quiz-result').classList.remove('on');
      var hint = $('#quiz-hint');
      if (hint) hint.textContent = '请完成全部三道题';
    });
  }

  /* ================================================================
     新增板块交互
     ================================================================ */
  function isActive(id) { return pages[current] && pages[current].id === id; }

  /* ---------- 贯穿全站：数字河流 · 实时水波纹 ---------- */
  (function waterCanvas() {
    var cv = $('.waterbg-canvas');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var waves = [
      { fr: .24, amp: 16, len: 330, spd: .62, ph: 0.0, lw: 1.6, s: 'rgba(10,126,146,.30)', f: 'rgba(10,126,146,.05)' },
      { fr: .42, amp: 24, len: 520, spd: .46, ph: 1.6, lw: 1.8, s: 'rgba(73,182,203,.34)', f: 'rgba(73,182,203,.05)' },
      { fr: .62, amp: 30, len: 430, spd: .34, ph: 3.1, lw: 1.4, s: 'rgba(10,126,146,.22)', f: 'rgba(73,182,203,.05)' },
      { fr: .80, amp: 22, len: 640, spd: .28, ph: 4.4, lw: 1.8, s: 'rgba(73,182,203,.26)', f: 'rgba(73,182,203,.04)' }
    ];

    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function frame(t) {
      var s = t / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < waves.length; i++) {
        var w = waves[i], y0 = H * w.fr, x, y;
        ctx.beginPath();
        for (x = 0; x <= W + 6; x += 6) {
          y = y0 + Math.sin((x / w.len) + s * w.spd + w.ph) * w.amp
                + Math.sin((x / (w.len * .5)) + s * w.spd * 1.6 + w.ph * 1.7) * w.amp * .3;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
        ctx.fillStyle = w.f; ctx.fill();
        ctx.beginPath();
        for (x = 0; x <= W + 6; x += 6) {
          y = y0 + Math.sin((x / w.len) + s * w.spd + w.ph) * w.amp
                + Math.sin((x / (w.len * .5)) + s * w.spd * 1.6 + w.ph * 1.7) * w.amp * .3;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = w.s; ctx.lineWidth = w.lw; ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- 板块激活钩子 ---------- */
  var talentBars = $$('.talent-bar i');
  function onShow(page) {
    if (!page) return;
    if (page.id === 's10') {
      talentBars.forEach(function (b) { b.style.width = (b.getAttribute('data-w') || 0) + '%'; });
    } else {
      talentBars.forEach(function (b) { b.style.width = '0'; });
    }
    if (page.id === 's13' && filmLayout) filmLayout();
    if (page.id === 's15' && window.hhGlobeResize) window.hhGlobeResize();
    if (page.id === 's18' && window.hhSizeMap) window.hhSizeMap();

    var panoModal = $('#pano-modal');
    if (panoModal && page.id !== 's15') panoModal.classList.remove('on');
  }

  /* ---------- 06 实时数据与创新 ---------- */
  (function liveBoard() {
    var clockEl = $('#board-clock');
    var tickEl = $('#board-tick');
    var feed = $('#science-feed');
    var kpis = $$('[data-live]');
    if (!clockEl && !tickEl && !feed && !kpis.length) return;

    var msgs = [
      '国家重点研发计划「水资源高效利用」项目组发布阶段性成果',
      '数字孪生流域平台新增接入三处水文监测站点',
      '水环境团队完成太湖蓝藻遥感预警模型的一次迭代',
      '港口海岸团队完成近海工程数字孪生仿真的整周期验证',
      '校友参与的跨流域调水工程进入通水调试阶段'
    ];
    var mi = 0;

    function tickClock() {
      if (!isActive('s10')) return;
      var d = new Date();
      clockEl.textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
    }
    function tickMsg() {
      if (!isActive('s10') || !tickEl) return;
      mi = (mi + 1) % msgs.length;
      tickEl.style.opacity = 0;
      setTimeout(function () {
        tickEl.innerHTML = '<b>·</b> ' + msgs[mi];
        tickEl.style.transition = 'opacity .5s';
        tickEl.style.opacity = 1;
      }, 380);
    }
    function tickFeed() {
      if (!isActive('s10') || !feed) return;
      var items = $$('li', feed);
      var at = items.findIndex(function (li) { return li.classList.contains('on'); });
      items.forEach(function (li, i) { li.classList.toggle('on', i === (at + 1) % items.length); });
    }
    function tickKpi() {
      if (!isActive('s10')) return;
      kpis.forEach(function (el) {
        var base = parseInt(el.getAttribute('data-live'), 10) || 0;
        var delta = Math.round((Math.random() - .42) * base * .012);
        var v = Math.max(0, base + delta);
        el.textContent = v.toLocaleString('en-US');
      });
    }

    if (clockEl) { tickClock(); setInterval(tickClock, 1000); }
    if (tickEl) setInterval(tickMsg, 3600);
    if (feed) {
      var first = $$('li', feed)[0];
      if (first) first.classList.add('on');
      setInterval(tickFeed, 2700);
    }
    if (kpis.length) setInterval(tickKpi, 2600);
  })();

  /* ---------- 04 人物胶片 · 3D 立体 coverflow ---------- */
  var film = $('#film');
  var filmStage = $('#film-stage');
  var filmCount = $('#film-count');
  var filmLayout = null;

  if (film && filmStage) {
    var fCells = $$('.film-cell', filmStage);
    var fN = fCells.length, fIdx = 0, fAuto = true, fDrag = false, fSx = 0, fMoved = 0;

    function fLayout() {
      var w = film.clientWidth;
      var gap = Math.max(118, Math.min(206, w * .17));
      var ang = 46, dep = 200;
      fCells.forEach(function (c, i) {
        var off = i - fIdx;
        var a = Math.abs(off);
        var x = off * gap;
        var z = -a * dep;
        var ry = Math.max(-72, Math.min(72, -off * ang));
        var s = Math.max(.58, 1 - a * .13);
        var op = a > 4 ? 0 : Math.max(.12, 1 - a * .26);
        c.style.transform = 'translate(-50%,-50%) translateX(' + x.toFixed(1) + 'px) translateZ(' +
          z.toFixed(1) + 'px) rotateY(' + ry.toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
        c.style.opacity = op;
        c.style.zIndex = String(60 - a);
        c.style.pointerEvents = a > 4 ? 'none' : 'auto';
        c.classList.toggle('is-center', off === 0);
      });
      if (filmCount) filmCount.textContent = pad2(fIdx + 1) + ' / ' + pad2(fN);
    }

    function fGo(i) {
      fIdx = ((i % fN) + fN) % fN;
      fLayout();
    }

    filmLayout = fLayout;
    fLayout();
    window.addEventListener('resize', fLayout);

    var fReduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!fReduce) {
      setInterval(function () {
        if (fAuto && !fDrag && isActive('s13')) fGo(fIdx + 1);
      }, 3400);
    }

    film.addEventListener('mouseenter', function () { fAuto = false; });
    film.addEventListener('mouseleave', function () { if (!fDrag) fAuto = true; });

    fCells.forEach(function (c, i) {
      c.addEventListener('click', function () {
        if (Math.abs(fMoved) > 6) return;   // 刚刚是拖拽，不当作点击
        fGo(i === fIdx ? i + 1 : i);
      });
    });

    film.addEventListener('pointerdown', function (e) {
      fDrag = true; fAuto = false; fSx = e.clientX; fMoved = 0;
      film.style.cursor = 'grabbing';
      if (film.setPointerCapture) { try { film.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    film.addEventListener('pointermove', function (e) {
      if (!fDrag) return;
      fMoved = e.clientX - fSx;
      if (Math.abs(fMoved) > 8) e.preventDefault();
    });
    function filmEnd() {
      if (!fDrag) return;
      fDrag = false; fAuto = true; film.style.cursor = 'grab';
      if (fMoved <= -48) fGo(fIdx + 1);
      else if (fMoved >= 48) fGo(fIdx - 1);
    }
    film.addEventListener('pointerup', filmEnd);
    film.addEventListener('pointercancel', filmEnd);

    var fPrev = $('#film-prev'), fNext = $('#film-next');
    if (fPrev) fPrev.addEventListener('click', function () { fGo(fIdx - 1); });
    if (fNext) fNext.addEventListener('click', function () { fGo(fIdx + 1); });

    film.tabIndex = 0;
    film.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { fGo(fIdx + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { fGo(fIdx - 1); e.preventDefault(); }
    });
  }

  /* ---------- 10 校友治水地图 · 真实中国地图 + 3D 柱状 ---------- */
  (function alumniMap3D() {
    var scene = $('#hmap-scene');
    var plane = $('#hmap-plane');
    var tip = $('#hmap-tip');
    var C = window.__HH_CHINA;
    if (!scene || !plane || !C || !C.prov) return;

    var MX = 1;
    Object.keys(C.cnt || {}).forEach(function (k) { if (C.cnt[k] > MX) MX = C.cnt[k]; });

    // 1) 真实省级行政区轮廓
    var svg = '<svg viewBox="0 0 ' + C.w + ' ' + C.h + '" preserveAspectRatio="xMidYMid meet">';
    C.prov.forEach(function (p) {
      svg += '<path class="prov" data-name="' + p[0] + '" d="' + p[1] + '"></path>';
    });
    svg += '</svg><div class="htrack"></div>';
    plane.innerHTML = svg;

    var track = $('.htrack', plane);
    track.style.width = '100%';
    track.style.height = '100%';
    var bars = {};

    // 2) 柱高按各地校友规模（示意）缩放；高度与地图宽度成比例，换屏不变形
    function buildBars(pw) {
      track.innerHTML = '';
      bars = {};
      C.prov.forEach(function (p) {
        var n = C.cnt[p[0]] || 0;
        var t = Math.pow(n / MX, .75);
        var h = Math.min(126, Math.max(11, pw * (.03 + .15 * t)));
        var b = document.createElement('div');
        b.className = 'hbar s';
        b.style.left = p[2] + '%';
        b.style.top = p[3] + '%';
        b.style.height = h.toFixed(1) + 'px';
        track.appendChild(b);
        bars[p[0]] = b;
      });
    }

    // 3) 地图尺寸自适应（板块 display:none 时为 0，需在展示时重算）
    function sizePlane() {
      var sw = scene.clientWidth, sh = scene.clientHeight;
      if (!sw || !sh) return;
      var pw = Math.min(sw * .94, sh * 2.0, 1000);
      plane.style.setProperty('--pw', pw.toFixed(0) + 'px');
      plane.style.setProperty('--ph', (pw * C.h / C.w).toFixed(0) + 'px');
      buildBars(pw);
    }
    window.hhSizeMap = sizePlane;

    // 4) 悬停联动：高亮省份 + 对应柱体 + 气泡
    $$('.prov', plane).forEach(function (pa) {
      pa.addEventListener('mouseenter', function () {
        var nm = pa.getAttribute('data-name');
        pa.classList.add('hot');
        if (bars[nm]) bars[nm].classList.add('on');
        if (tip) {
          tip.textContent = nm + ' · 校友约 ' + (C.cnt[nm] || 0) + ' 人（示意）';
          var r = pa.getBoundingClientRect(), sr = scene.getBoundingClientRect();
          tip.style.left = (r.left + r.width / 2 - sr.left).toFixed(1) + 'px';
          tip.style.top = (r.top - sr.top + 4).toFixed(1) + 'px';
          tip.style.opacity = 1;
        }
      });
      pa.addEventListener('mouseleave', function () {
        var nm = pa.getAttribute('data-name');
        pa.classList.remove('hot');
        if (bars[nm]) bars[nm].classList.remove('on');
        if (tip) tip.style.opacity = 0;
      });
    });

    window.addEventListener('resize', function () { if (isActive('s18')) sizePlane(); });
  })();

  /* ---------- 11 校友留言板 · 本地持久化 ---------- */
  (function guestbook() {
    var form = $('#gb-form'), nameEl = $('#gb-name'), msgEl = $('#gb-msg');
    var list = $('#gb-list'), hint = $('#gb-hint');
    if (!form || !list) return;
    var KEY = 'hohai-gb-v1';
    var seed = [
      { n: '95级 水利', t: '愿母校的河水，永远清澈。', av: '河' },
      { n: '江宁在读', t: '在图书馆看到河，忽然就懂了什么叫「上善若水」。', av: '水' },
      { n: '一线校友', t: '毕业后在大坝上守了十年，回来看这页，还是会心动。', av: '海' }
    ];

    function load() {
      try { var raw = localStorage.getItem(KEY); if (raw) { var d = JSON.parse(raw); if (Array.isArray(d)) return d; } }
      catch (e) {}
      return null;
    }
    function save(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {} }

    var notes = load() || seed.slice();

    function render() {
      list.innerHTML = '';
      if (!notes.length) {
        var p = document.createElement('p');
        p.className = 'gb-empty';
        p.textContent = '还没有留言，来写下第一句吧。';
        list.appendChild(p);
        return;
      }
      notes.forEach(function (o) {
        var div = document.createElement('div');
        div.className = 'gb-note';
        var p = document.createElement('p');
        p.textContent = o.t;
        div.appendChild(p);
        var who = document.createElement('div');
        who.className = 'who';
        var av = document.createElement('span');
        av.className = 'av';
        av.textContent = o.av || (o.n ? o.n.charAt(0) : '水');
        who.appendChild(av);
        var sp = document.createElement('span');
        sp.textContent = o.n || '匿名';
        who.appendChild(sp);
        div.appendChild(who);
        list.appendChild(div);
      });
    }
    render();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = (msgEl.value || '').trim();
      if (!t) { if (hint) hint.textContent = '先写点什么再发表吧～'; return; }
      var n = (nameEl.value || '').trim() || '匿名';
      notes.unshift({ n: n, t: t, av: n.charAt(0) });
      save(notes);
      render();
      msgEl.value = '';
      if (hint) hint.textContent = '留言已保存到本机浏览器（演示用，不会上传）。';
    });
  })();

  /* ---------- 初始化：按 hash 打开对应板块，默认封面 ---------- */
  var initial = (location.hash || '').replace('#', '');
  var hasInit = pages.some(function (p) { return p.id === initial; });
  goTo(hasInit ? initial : pages[0].id, false);
})();
