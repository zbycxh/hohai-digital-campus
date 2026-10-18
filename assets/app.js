// assets/app.js — 页面交互（Mock 演示）
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 滚动进度 + 顶栏状态 ---------- */
  var progress = $('#progress');
  var topbar = $('#topbar');
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (topbar) topbar.classList.toggle('scrolled', y > 20);
    spy();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 进入视口淡入 ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 数字滚动 ---------- */
  var counters = $$('.count');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); io2.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io2.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-target'); });
  }

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
      // 切换后补一次 reveal
      var pane = panes[key];
      if (pane) $$('.reveal', pane).forEach(function (el) { el.classList.add('in'); });
    });
  });

  /* ---------- Bento 卡片跳转 ---------- */
  $$('.card[data-goto]').forEach(function (card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) return;
      var id = card.getAttribute('data-goto');
      var t = document.getElementById(id);
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- 侧边圆点导览 + 滚动高亮 ---------- */
  var dots = $$('.dotnav button');
  var sections = dots.map(function (d) { return document.getElementById(d.getAttribute('data-target')); }).filter(Boolean);
  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      var t = document.getElementById(d.getAttribute('data-target'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  function spy() {
    var mid = window.innerHeight * 0.4;
    var current = sections[0];
    sections.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.top <= mid) current = s;
    });
    if (!current) return;
    dots.forEach(function (d) {
      d.classList.toggle('on', d.getAttribute('data-target') === current.id);
    });
  }

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
    var order = ['water', 'smart', 'env', 'sea'];
    order.forEach(function (k) { if (count[k] > bestN) { bestN = count[k]; best = k; } });
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
      var key = tally();
      var d = resultData[key];
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

  onScroll();
})();
