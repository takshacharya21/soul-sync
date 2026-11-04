/**
 * Fan Carousel – Vanilla JS + GSAP
 * Soul Syync Gallery Section
 */
(function () {
  /* ── Wait for DOM ── */
  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* ── Wait for GSAP ── */
  function waitForGSAP(fn, tries) {
    tries = tries || 0;
    if (typeof gsap !== "undefined") { fn(); return; }
    if (tries > 50) { console.error("GSAP not loaded"); return; }
    setTimeout(function () { waitForGSAP(fn, tries + 1); }, 100);
  }

  /* ── Image list (all 19 gallery photos) ── */
  var CARDS = [
    "/static/images/gallery/gallery_1.jpg",
    "/static/images/gallery/gallery_2.jpg",
    "/static/images/gallery/gallery_3.jpg",
    "/static/images/gallery/gallery_4.jpg",
    "/static/images/gallery/gallery_5.jpg",
    "/static/images/gallery/gallery_6.jpg",
    "/static/images/gallery/gallery_7.jpg",
    "/static/images/gallery/gallery_8.jpg",
    "/static/images/gallery/gallery_9.jpg",
    "/static/images/gallery/gallery_10.jpg",
    "/static/images/gallery/gallery_11.jpg",
    "/static/images/gallery/gallery_12.jpg",
    "/static/images/gallery/gallery_13.jpg",
    "/static/images/gallery/gallery_14.jpg",
    "/static/images/gallery/gallery_15.jpg",
    "/static/images/gallery/gallery_16.jpg",
    "/static/images/gallery/gallery_17.jpg",
    "/static/images/gallery/gallery_18.jpg",
    "/static/images/gallery/gallery_19.jpg"
  ];

  /* ── Constants ── */
  var MAX_VISIBLE = 7;
  var HALF = 3;

  var FAN = [
    { rot: -21, scale: 0.776, x: -30, y: 7.3,  z: 1  },
    { rot: -14, scale: 0.850, x: -22, y: 4.0,  z: 2  },
    { rot:  -7, scale: 0.935, x: -11, y: 1.3,  z: 3  },
    { rot:   0, scale: 1.000, x:   0, y: 0.0,  z: 10 },
    { rot:   7, scale: 0.935, x:  11, y: 1.3,  z: 3  },
    { rot:  14, scale: 0.850, x:  22, y: 4.0,  z: 2  },
    { rot:  21, scale: 0.776, x:  30, y: 7.3,  z: 1  }
  ];

  function rMult() {
    var w = window.innerWidth;
    if (w < 480)  return 0.28;
    if (w < 640)  return 0.38;
    if (w < 768)  return 0.50;
    if (w < 1024) return 0.75;
    return 1.0;
  }

  function hMult() {
    var w = window.innerWidth;
    var ideal;
    if (w < 480)       ideal = 22 * 16;
    else if (w < 640)  ideal = 26 * 16;
    else if (w < 768)  ideal = 28 * 16;
    else if (w < 1024) ideal = 34 * 16;
    else               ideal = 38 * 16;
    var avail = window.innerHeight * 0.7;
    return avail >= ideal ? 1 : avail / ideal;
  }

  function slotCfg(total, slot) {
    if (total >= MAX_VISIBLE) return FAN[slot];
    var center = total >> 1;
    var dist   = total > 1 ? (slot - center) / center : 0;
    var abs    = Math.abs(dist);
    return {
      rot: dist * 21,
      scale: 1.0 - 0.2244 * abs * abs,
      x: dist * 30,
      y: abs * abs * 7.3,
      z: 10 - Math.abs(slot - center)
    };
  }

  /* ── State ── */
  var total      = CARDS.length;
  var paging     = total > MAX_VISIBLE;
  var center     = paging ? HALF : (total >> 1);
  var animating  = false;
  var entered    = false;
  var direction  = null;
  var prevVis    = {};

  /* ── Build DOM ── */
  var container = document.getElementById("fan-container");
  var pagination = document.getElementById("fan-pagination");
  var dotsWrap  = document.getElementById("fan-dots");
  var prevBtn   = document.getElementById("fan-prev");
  var nextBtn   = document.getElementById("fan-next");

  if (!container) return;

  /* Create card elements */
  var cardEls = [];
  CARDS.forEach(function (src, i) {
    var div = document.createElement("div");
    div.className = "fan-card";
    var img = document.createElement("img");
    img.src     = src;
    img.alt     = "Soul Syync Gallery " + (i + 1);
    img.loading = i < 7 ? "eager" : "lazy";
    div.appendChild(img);
    container.appendChild(div);
    cardEls.push(div);
  });

  /* Create dots */
  if (paging) {
    pagination.style.display = "flex";
    CARDS.forEach(function (_, i) {
      var d = document.createElement("span");
      d.className = "fan-dot" + (i === center ? " active" : "");
      dotsWrap.appendChild(d);
    });
  }

  function updateDots() {
    var dots = dotsWrap.querySelectorAll(".fan-dot");
    dots.forEach(function (d, i) {
      d.className = "fan-dot" + (i === center ? " active" : "");
    });
  }

  /* ── Visible map: cardIndex → slot ── */
  function visibleMap() {
    var map = {};
    if (!paging) {
      CARDS.forEach(function (_, i) { map[i] = i; });
      return map;
    }
    for (var slot = 0; slot < MAX_VISIBLE; slot++) {
      var ci = ((center + slot - HALF) % total + total) % total;
      map[ci] = slot;
    }
    return map;
  }

  /* ── Apply layout ── */
  function applyLayout() {
    var vm    = visibleMap();
    var isFirst = !entered;
    var rm    = rMult();
    var hm    = hMult();
    var sCount = paging ? MAX_VISIBLE : total;
    var cfg   = function (s) { return slotCfg(sCount, s); };
    var dir   = direction;

    if (isFirst) animating = true;

    var done = 0;
    var visCount = Object.keys(vm).length;

    function onDone() {
      done++;
      if (done >= visCount) {
        animating = false;
        if (isFirst) entered = true;
      }
    }

    cardEls.forEach(function (card, ci) {
      var slot     = vm[ci];
      var wasVis   = prevVis[ci] !== undefined;

      if (slot !== undefined) {
        var c = cfg(slot);
        var target = {
          x:        (c.x * rm) + "rem",
          y:        (c.y * hm) + "rem",
          rotation: c.rot,
          scale:    c.scale,
          opacity:  1,
          zIndex:   c.z
        };

        if (isFirst) {
          gsap.set(card, { x: 0, y: (12 * hm) + "rem", rotation: 0, scale: 0.5, opacity: 0 });
          gsap.to(card, Object.assign({}, target, {
            duration: 1.2,
            ease: "elastic.out(1.05,0.78)",
            delay: 0.2 + slot * 0.06,
            onComplete: onDone
          }));
        } else if (!wasVis) {
          var enterX = dir === "right" ? 40 : -40;
          gsap.set(card, { x: enterX + "rem", y: (c.y * hm) + "rem",
            rotation: dir === "right" ? 30 : -30, scale: 0.5, opacity: 0 });
          gsap.to(card, Object.assign({}, target, {
            duration: 0.6, ease: "power2.out", onComplete: onDone
          }));
        } else {
          gsap.to(card, Object.assign({}, target, {
            duration: 0.5, ease: "power2.out", onComplete: onDone
          }));
        }
      } else if (wasVis) {
        var exitX = dir === "right" ? -40 : 40;
        gsap.to(card, {
          x: exitX + "rem", opacity: 0, scale: 0.5,
          rotation: dir === "right" ? -30 : 30,
          duration: 0.4, ease: "power2.in", zIndex: 0
        });
      } else if (isFirst) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVis = vm;
    updateDots();
    attachHover(vm, cfg, rm, hm, sCount);
  }

  /* ── Hover ── */
  function attachHover(vm, cfg, rm, hm, sCount) {
    var centerSlot = (paging ? MAX_VISIBLE : total) >> 1;
    var leaveTimer = null;
    var activeSlot = null;

    /* Collect visible entries */
    var entries = [];
    cardEls.forEach(function (el, ci) {
      var slot = vm[ci];
      if (slot !== undefined) entries.push({ el: el, slot: slot });
    });
    entries.sort(function (a, b) { return a.slot - b.slot; });

    function doHover(hovSlot) {
      var rm2 = rMult(), hm2 = hMult();
      entries.forEach(function (e) {
        var c    = cfg(e.slot);
        var tx   = c.x * rm2;
        var ty   = c.y * hm2;
        var tr   = c.rot;
        var ts   = c.scale;
        var dist = Math.abs(e.slot - hovSlot);
        var delay = dist * 0.02;

        if (hovSlot !== null) {
          if (e.slot === hovSlot) {
            ty -= 2.5 * hm2;
            ts *= 1.08;
          } else {
            var norm = centerSlot > 0 ? (e.slot - centerSlot) / centerSlot : 0;
            var push = 8 * (1 - Math.abs(norm)) * (1 + 0.2 * Math.max(0, 3 - dist));
            if (e.slot < hovSlot) { tx -= push * rm2; tr -= 3 / (dist + 1); }
            else                  { tx += push * rm2; tr += 3 / (dist + 1); }
          }
        } else {
          delay = Math.abs(e.slot - centerSlot) * 0.02;
        }

        gsap.to(e.el, {
          x: tx + "rem", y: ty + "rem",
          rotation: tr, scale: ts,
          duration: 0.5, delay: delay,
          ease: "elastic.out(1,0.75)",
          overwrite: "auto"
        });
        gsap.set(e.el, { zIndex: c.z });
      });
    }

    /* Remove old listeners by cloning container's listener — use flags */
    entries.forEach(function (e) {
      e.el.onmouseenter = function () {
        if (animating) return;
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        if (activeSlot !== e.slot) {
          activeSlot = e.slot;
          doHover(e.slot);
        }
      };
    });

    container.onmouseleave = function () {
      if (animating) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function () {
        activeSlot = null;
        doHover(null);
      }, 50);
    };
  }

  /* ── Cycle ── */
  function cycle(dir) {
    if (animating || !paging) return;
    animating = true;
    direction = dir;
    center = dir === "right"
      ? (center + 1) % total
      : (center - 1 + total) % total;
    applyLayout();
  }

  /* ── Button listeners ── */
  if (prevBtn) prevBtn.addEventListener("click", function () { cycle("left"); });
  if (nextBtn) nextBtn.addEventListener("click", function () { cycle("right"); });

  /* ── Touch / Swipe ── */
  var touchX = 0;
  container.addEventListener("touchstart", function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  container.addEventListener("touchend", function (e) {
    var diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) cycle(diff > 0 ? "right" : "left");
  }, { passive: true });

  /* ── Keyboard ── */
  document.addEventListener("keydown", function (e) {
    var gallery = document.getElementById("gallery");
    if (!gallery) return;
    var r = gallery.getBoundingClientRect();
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (e.key === "ArrowLeft")  cycle("left");
    if (e.key === "ArrowRight") cycle("right");
  });

  /* ── Resize ── */
  window.addEventListener("resize", function () {
    if (!animating) {
      var vm  = visibleMap();
      var cfg2 = function (s) { return slotCfg(paging ? MAX_VISIBLE : total, s); };
      attachHover(vm, cfg2, rMult(), hMult(), paging ? MAX_VISIBLE : total);
    }
  });

  /* ── Init ── */
  onReady(function () {
    waitForGSAP(function () {
      applyLayout();
    });
  });

})();
