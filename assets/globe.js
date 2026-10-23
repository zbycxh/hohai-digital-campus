// assets/globe.js - immersive campus globe + VR pano
(function () {
  var EARTH_SRC = 'assets/earth.jpg';
  var EARTH_MIN = window.__HH_EARTH_URI || '';

  var campuses = [
    { id: 'xk', name: '西康路校区', loc: '南京 · 鼓楼区', lat: 32.06, lon: 118.77,
      photo: 'assets/official/xk_gate.jpg',
      desc: '河海大学历史最悠久的校区，民国风格的校门、黄墙绿瓦的水利馆与林荫道承载着百年记忆。' },
    { id: 'jn', name: '江宁校区', loc: '南京 · 江宁区', lat: 31.92, lon: 118.79,
      photo: 'assets/official/jn_xld.jpg',
      desc: '占地最广的现代化校区，湖泊、图书馆、运动场与教学区交错，是校园生活的主场。' },
    { id: 'cz', name: '常州校区', loc: '江苏 · 常州', lat: 31.78, lon: 119.97,
      photo: 'assets/official/cz_ruoshui.jpg',
      desc: '面向新工科的年轻校区，校园水景与现代楼宇交织，呈现出另一种河海气质。' }
  ];

  var stage = document.getElementById('globe-stage');
  console.log('[Globe] script start, stage=', !!stage, 'THREE=', typeof window.THREE);
  if (!stage) return;

  var tip = document.getElementById('globe-tip');
  if (tip) {
    tip.addEventListener('click', function (e) { e.stopPropagation(); });
    tip.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }
  var fallback = stage.querySelector('.globe-css');
  var renderer, scene, camera, earth, markers = [];
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var width = 0, height = 0;
  var selected = null;
  var dragging = false, lastX = 0, lastY = 0;
  var autoRotate = true;

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function llToPos(lat, lon, r) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  function setTip(c) {
    if (!tip) return;
    tip.innerHTML = '<img src="' + c.photo + '" alt="' + c.name + '"><div class="tt"><b>' + c.name + '<em>' + c.loc + '</em></b><p>' + c.desc + '</p><button class="globe-enter" data-cid="' + c.id + '">进入沉浸 VR</button></div>';
    tip.classList.add('on');
    var btn = tip.querySelector('.globe-enter');
    if (btn) btn.addEventListener('click', function () { openPano(c); });
  }

  function hideTip() {
    if (tip) tip.classList.remove('on');
  }

  function openPano(c) {
    var modal = document.getElementById('pano-modal');
    var view = document.getElementById('pano-view');
    if (!modal || !view) return;
    view.style.backgroundImage = 'url("' + c.photo + '")';
    view.style.backgroundSize = 'auto 100%';
    view.style.backgroundRepeat = 'repeat-x';
    view.style.backgroundPosition = 'center';
    modal.classList.add('on');
  }

  (function initPano() {
    var modal = document.getElementById('pano-modal');
    var view = document.getElementById('pano-view');
    var close = document.getElementById('pano-close');
    if (!modal || !view) return;
    if (close) close.addEventListener('click', function () { modal.classList.remove('on'); });
    var drag = false, sx = 0, sp = 0, x = 0;
    view.addEventListener('pointerdown', function (e) { drag = true; sx = e.clientX; sp = x; view.style.cursor = 'grabbing'; });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      x = sp - (e.clientX - sx);
      var w = view.clientWidth || 1;
      x = ((x % w) + w) % w;
      view.style.backgroundPosition = (x - w) + 'px center';
    });
    window.addEventListener('pointerup', function () { drag = false; view.style.cursor = 'grab'; });
  })();

  function initWebGL() {
    if (!hasWebGL()) return false;
    scene = new THREE.Scene();
    width = stage.clientWidth;
    height = stage.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height || 1, 0.1, 1000);
    camera.position.z = 3.4;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stage.appendChild(renderer.domElement);

    var ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    var dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(5, 3, 5);
    scene.add(dir);
    var back = new THREE.DirectionalLight(0x445566, 0.35);
    back.position.set(-5, -2, -5);
    scene.add(back);

    var geometry = new THREE.SphereGeometry(1, 64, 64);
    var loader = new THREE.TextureLoader();
    function applyTexture(src) {
      loader.load(src, function (tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        var mat = new THREE.MeshPhongMaterial({ map: tex, specular: 0x111111, shininess: 10 });
        earth = new THREE.Mesh(geometry, mat);
        scene.add(earth);
        addMarkers();
        animate();
      }, undefined, function () {
        if (src !== EARTH_MIN) applyTexture(EARTH_MIN);
      });
    }
    applyTexture(EARTH_SRC);
    return true;
  }

  function addMarkers() {
    campuses.forEach(function (c) {
      var pos = llToPos(c.lat, c.lon, 1.02);
      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x49E0B0 })
      );
      dot.position.copy(pos);
      dot.userData = c;
      earth.add(dot);
      markers.push(dot);

      var el = document.createElement('button');
      el.className = 'globe-mark';
      el.innerHTML = '<i></i><span>' + c.name + '</span>';
      el.setAttribute('aria-label', c.name);
      stage.appendChild(el);
      c.el = el;
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        select(c);
      });
    });
  }

  function select(c) {
    selected = c;
    setTip(c);
    markers.forEach(function (m) {
      var u = m.userData;
      if (u.el) u.el.classList.toggle('on', u.id === c.id);
    });
    if (campusBar) {
      $$('button', campusBar).forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-cid') === c.id);
      });
    }
  }

  var campusBar = document.getElementById('globe-campus');
  if (campusBar) {
    $$('button', campusBar).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var cid = btn.getAttribute('data-cid');
        var c = campuses.find(function (x) { return x.id === cid; });
        if (c) select(c);
      });
    });
  }

  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  function resize() {
    if (!renderer || !camera) return;
    width = stage.clientWidth;
    height = stage.clientHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function projectMarkers() {
    if (!camera || !earth) return;
    markers.forEach(function (m) {
      var c = m.userData;
      var v = new THREE.Vector3();
      m.getWorldPosition(v);
      v.project(camera);
      var x = (v.x * 0.5 + 0.5) * width;
      var y = (-v.y * 0.5 + 0.5) * height;
      var visible = v.z < 1;
      c.el.style.display = visible ? 'block' : 'none';
      c.el.style.left = x + 'px';
      c.el.style.top = y + 'px';
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    if (earth) earth.rotation.y += autoRotate && !dragging ? 0.0006 : 0;
    projectMarkers();
    renderer.render(scene, camera);
  }

  stage.addEventListener('pointerdown', function (e) {
    dragging = true;
    autoRotate = false;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('pointermove', function (e) {
    if (!dragging || !earth) return;
    earth.rotation.y += (e.clientX - lastX) * 0.005;
    earth.rotation.x += (e.clientY - lastY) * 0.003;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('pointerup', function () { dragging = false; });
  stage.addEventListener('click', function (e) {
    if (!camera || !earth) return;
    var rect = stage.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(markers);
    if (hits.length) select(hits[0].object.userData);
    else hideTip();
  });

  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) {
    try { new ResizeObserver(resize).observe(stage); } catch (_) {}
  }
  window.hhGlobeResize = resize;
  console.log('[Globe] resize exposed');

  if (!initWebGL()) {
    console.log('[Globe] WebGL unavailable, showing CSS fallback');
    if (fallback) fallback.style.display = 'grid';
  } else {
    console.log('[Globe] WebGL init');
  }
})();
