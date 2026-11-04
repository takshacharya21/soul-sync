/**
 * Fan Carousel – Vanilla JS + GSAP
 * Soul Syync Gallery Section
 */
(function () {
  /* ── Image list (all 19 gallery photos) ── */
  const CARDS = [
    { src: "/static/images/gallery/gallery_1.jpg",  alt: "Soul Syync Session 1"  },
    { src: "/static/images/gallery/gallery_2.jpg",  alt: "Soul Syync Session 2"  },
    { src: "/static/images/gallery/gallery_3.jpg",  alt: "Soul Syync Session 3"  },
    { src: "/static/images/gallery/gallery_4.jpg",  alt: "Soul Syync Session 4"  },
    { src: "/static/images/gallery/gallery_5.jpg",  alt: "Soul Syync Session 5"  },
    { src: "/static/images/gallery/gallery_6.jpg",  alt: "Soul Syync Session 6"  },
    { src: "/static/images/gallery/gallery_7.jpg",  alt: "Soul Syync Session 7"  },
    { src: "/static/images/gallery/gallery_8.jpg",  alt: "Soul Syync Session 8"  },
    { src: "/static/images/gallery/gallery_9.jpg",  alt: "Soul Syync Session 9"  },
    { src: "/static/images/gallery/gallery_10.jpg", alt: "Soul Syync Session 10" },
    { src: "/static/images/gallery/gallery_11.jpg", alt: "Soul Syync Session 11" },
    { src: "/static/images/gallery/gallery_12.jpg", alt: "Soul Syync Session 12" },
    { src: "/static/images/gallery/gallery_13.jpg", alt: "Soul Syync Session 13" },
    { src: "/static/images/gallery/gallery_14.jpg", alt: "Soul Syync Session 14" },
    { src: "/static/images/gallery/gallery_15.jpg", alt: "Soul Syync Session 15" },
    { src: "/static/images/gallery/gallery_16.jpg", alt: "Soul Syync Session 16" },
    { src: "/static/images/gallery/gallery_17.jpg", alt: "Soul Syync Session 17" },
    { src: "/static/images/gallery/gallery_18.jpg", alt: "Soul Syync Session 18" },
    { src: "/static/images/gallery/gallery_19.jpg", alt: "Soul Syync Session 19" },
  ];

  /* ── Constants ── */
  const MAX_VISIBLE = 7;
  const HALF = 3;

  const FAN_POSITIONS = [
    { rot: -21, scale: 0.7756, x: -30, y: 7.3,  zIndex: 1  },
    { rot: -14, scale: 0.8498, x: -22, y: 4.0,  zIndex: 2  },
    { rot: -7,  scale: 0.9346, x: -11, y: 1.3,  zIndex: 3  },
    { rot:  0,  scale: 1.0,    x:   0, y: 0.0,  zIndex: 10 },
    { rot:  7,  scale: 0.9346, x:  11, y: 1.3,  zIndex: 3  },
    { rot: 14,  scale: 0.8498, x:  22, y: 4.0,  zIndex: 2  },
    { rot: 21,  scale: 0.7756, x:  30, y: 7.3,  zIndex: 1  },
  ];

  function getResponsiveMultiplier(w) {
    if (w < 480)  return 0.28;
    if (w < 640)  return 0.38;
    if (w < 768)  return 0.50;
    if (w < 1024) return 0.75;
    return 1.0;
  }

  function getHeightMultiplier(w) {
    let idealPx;
    if (w < 480)       idealPx = 22 * 16;
    else if (w < 640)  idealPx = 26 * 16;
    else if (w < 768)  idealPx = 28 * 16;
    else if (w < 1024) idealPx = 34 * 16;
    else               idealPx = 38 * 16;
    const available = window.innerHeight * 0.7;
    return available >= idealPx ? 1 : available / idealPx;
  }

  function getSlotConfig(totalCards, slot) {
    if (totalCards >= MAX_VISIBLE) return FAN_POSITIONS[slot];
    const center = totalCards >> 1;
    const distance = totalCards > 1 ? (slot - center) / center : 0;
    const abs = Math.abs(distance);
    return {
      rot:    distance * 21,
      scale:  1.0 - 0.2244 * abs * abs,
      x:      distance * 30,
      y:      abs * abs * 7.3,
      zIndex: 10 - Math.abs(slot - center),
    };
  }

  /* ── State ── */
  const totalCards   = CARDS.length;
  const needsPaging  = totalCards > MAX_VISIBLE;
  let   centerIndex  = needsPaging ? HALF : (totalCards >> 1);
  let   isAnimating  = false;
  let   hasEntered   = false;
  let   directionRef = null;
  let   prevVisible  = new Set();

  /* ── DOM refs ── */
  const container  = document.getElementById("fan-container");
  const pagination = document.getElementById("fan-pagination");
  const dotsWrap   = document.getElementById("fan-dots");
  const prevBtn    = document.getElementById("fan-prev");
  const nextBtn    = document.getElementById("fan-next");

  if (!container) return; // section not on this page

  /* ── Build card elements ── */
  const cardEls = CARDS.map((c, i) => {
    const el  = document.createElement("div");
    el.className = "fan-card";
    const img = document.createElement("img");
    img.src     = c.src;
    img.alt     = c.alt;
    img.loading = "lazy";
    el.appendChild(img);
    container.appendChild(el);
    return el;
  });

  /* ── Dots ── */
  if (needsPaging) {
    pagination.style.display = "flex";
    CARDS.forEach((_, i) => {
      const d = document.createElement("span");
      d.className = "fan-dot" + (i === centerIndex ? " active" : "");
      dotsWrap.appendChild(d);
    });
  }

  function updateDots() {
    const dots = dotsWrap.querySelectorAll(".fan-dot");
    dots.forEach((d, i) => d.classList.toggle("active", i === centerIndex));
  }

  /* ── Visible map ── */
  function getVisibleMap(center) {
    const map = new Map();
    if (!needsPaging) {
      CARDS.forEach((_, i) => map.set(i, i));
      return map;
    }
    for (let slot = 0; slot < MAX_VISIBLE; slot++) {
      const cardIdx = ((center + slot - HALF) % totalCards + totalCards) % totalCards;
      map.set(cardIdx, slot);
    }
    return map;
  }

  /* ── Core layout function ── */
  function applyLayout() {
    const visibleMap  = getVisibleMap(centerIndex);
    const direction   = directionRef;
    const isFirst     = !hasEntered;
    const mult        = getResponsiveMultiplier(window.innerWidth);
    const hMult       = getHeightMultiplier(window.innerWidth);
    const slotCount   = needsPaging ? MAX_VISIBLE : totalCards;
    const cfg         = slot => getSlotConfig(slotCount, slot);

    if (isFirst) isAnimating = true;

    let done = 0;
    const visibleCount = visibleMap.size;
    function onCardDone() {
      done++;
      if (done >= visibleCount) {
        isAnimating = false;
        if (isFirst) hasEntered = true;
      }
    }

    cardEls.forEach((card, cardIndex) => {
      const slot       = visibleMap.get(cardIndex);
      const wasVisible = prevVisible.has(cardIndex);

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = cfg(slot);
        const target = {
          x:        x * mult + "rem",
          y:        y * hMult + "rem",
          rotation: rot,
          scale,
          opacity:  1,
          zIndex,
        };

        if (isFirst) {
          gsap.set(card, { x: 0, y: (12 * hMult) + "rem", rotation: 0, scale: 0.5, opacity: 0 });
          gsap.to(card, { ...target, duration: 1.2, ease: "elastic.out(1.05,.78)", delay: 0.2 + slot * 0.06, onComplete: onCardDone });
        } else if (!wasVisible) {
          const enterX = direction === "right" ? 40 : -40;
          gsap.set(card, { x: enterX + "rem", y: (y * hMult) + "rem", rotation: direction === "right" ? 30 : -30, scale: 0.5, opacity: 0 });
          gsap.to(card, { ...target, duration: 0.6, ease: "power2.out", onComplete: onCardDone });
        } else {
          gsap.to(card, { ...target, duration: 0.5, ease: "power2.out", onComplete: onCardDone });
        }
      } else if (wasVisible) {
        const exitX = direction === "right" ? -40 : 40;
        gsap.to(card, { x: exitX + "rem", opacity: 0, scale: 0.5, rotation: direction === "right" ? -30 : 30, duration: 0.4, ease: "power2.in", zIndex: 0 });
      } else if (isFirst) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVisible = new Set(visibleMap.keys());
    updateDots();

    /* ── Hover interactions ── */
    const visibleEntries = [];
    cardEls.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    const centerSlot = visibleEntries.length >> 1;
    let activeSlot   = null;
    let leaveTimer   = null;

    function updateHoverLayout(hoveredSlot) {
      const m  = getResponsiveMultiplier(window.innerWidth);
      const hM = getHeightMultiplier(window.innerWidth);
      visibleEntries.forEach(({ el, slot }) => {
        const base = cfg(slot);
        let tx = base.x * m, ty = base.y * hM, tr = base.rot, ts = base.scale, delay = 0;

        if (hoveredSlot !== null) {
          const dist = Math.abs(slot - hoveredSlot);
          delay = dist * 0.02;
          if (slot === hoveredSlot) {
            ty -= 2.5 * hM;
            ts *= 1.08;
          } else {
            const norm = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
            const push = 8 * (1 - Math.abs(norm)) * (1 + 0.2 * Math.max(0, 3 - dist));
            if (slot < hoveredSlot) { tx -= push * m; tr -= 3 / (dist + 1); }
            else                    { tx += push * m; tr += 3 / (dist + 1); }
          }
        } else {
          delay = Math.abs(slot - centerSlot) * 0.02;
        }

        gsap.to(el, { x: tx + "rem", y: ty + "rem", rotation: tr, scale: ts, duration: 0.5, delay, ease: "elastic.out(1,.75)", overwrite: "auto" });
        gsap.set(el, { zIndex: base.zIndex });
      });
    }

    // Remove old listeners by cloning (simple approach for carousel reset)
    visibleEntries.forEach(({ el, slot }) => {
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      // Update our references
      visibleEntries.find(e => e.el === el).el = newEl;
      cardEls[CARDS.findIndex((_, i) => visibleMap.get(i) === slot)] = newEl;
    });

    // Re-query fresh elements
    const freshEntries = Array.from(container.querySelectorAll(".fan-card"));

    freshEntries.forEach((el, fi) => {
      // We need to match fresh element to a slot
      const cardIndex = CARDS.findIndex((_, ci) => {
        // find which fresh card index corresponds
        return false; // skip — use direct forEach below
      });
    });

    // Simpler: attach hover to container delegate
    container.onmouseenter = null;
    container.onmouseleave = null;

    const allCards = Array.from(container.querySelectorAll(".fan-card"));
    const freshVisible = [];
    allCards.forEach((el, fi) => {
      const slot = visibleMap.get(fi);
      if (slot !== undefined) freshVisible.push({ el, slot });
    });
    freshVisible.sort((a, b) => a.slot - b.slot);

    freshVisible.forEach(({ el, slot }) => {
      el.addEventListener("mouseenter", () => {
        if (isAnimating) return;
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        if (activeSlot !== slot) {
          activeSlot = slot;
          // recalc with fresh entries
          const m  = getResponsiveMultiplier(window.innerWidth);
          const hM = getHeightMultiplier(window.innerWidth);
          freshVisible.forEach(({ el: fEl, slot: fSlot }) => {
            const base = cfg(fSlot);
            let tx = base.x * m, ty = base.y * hM, tr = base.rot, ts = base.scale;
            const dist  = Math.abs(fSlot - slot);
            const delay = dist * 0.02;
            if (fSlot === slot) { ty -= 2.5 * hM; ts *= 1.08; }
            else {
              const norm = centerSlot > 0 ? (fSlot - centerSlot) / centerSlot : 0;
              const push = 8 * (1 - Math.abs(norm)) * (1 + 0.2 * Math.max(0, 3 - dist));
              if (fSlot < slot) { tx -= push * m; tr -= 3 / (dist + 1); }
              else              { tx += push * m; tr += 3 / (dist + 1); }
            }
            gsap.to(fEl, { x: tx + "rem", y: ty + "rem", rotation: tr, scale: ts, duration: 0.5, delay, ease: "elastic.out(1,.75)", overwrite: "auto" });
          });
        }
      });
    });

    container.addEventListener("mouseleave", () => {
      if (isAnimating) return;
      leaveTimer = setTimeout(() => {
        activeSlot = null;
        const m  = getResponsiveMultiplier(window.innerWidth);
        const hM = getHeightMultiplier(window.innerWidth);
        freshVisible.forEach(({ el: fEl, slot: fSlot }) => {
          const base = cfg(fSlot);
          gsap.to(fEl, { x: (base.x * m) + "rem", y: (base.y * hM) + "rem", rotation: base.rot, scale: base.scale, duration: 0.5, ease: "elastic.out(1,.75)", overwrite: "auto" });
          gsap.set(fEl, { zIndex: base.zIndex });
        });
      }, 50);
    }, { once: true });
  }

  /* ── Cycle ── */
  function cycle(direction) {
    if (isAnimating || !needsPaging) return;
    isAnimating  = true;
    directionRef = direction;
    centerIndex  = direction === "right"
      ? (centerIndex + 1) % totalCards
      : (centerIndex - 1 + totalCards) % totalCards;
    applyLayout();
  }

  /* ── Button listeners ── */
  if (prevBtn) prevBtn.addEventListener("click", () => cycle("left"));
  if (nextBtn) nextBtn.addEventListener("click", () => cycle("right"));

  /* ── Keyboard ── */
  document.addEventListener("keydown", e => {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;
    const rect = gallery.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    if (e.key === "ArrowLeft")  cycle("left");
    if (e.key === "ArrowRight") cycle("right");
  });

  /* ── Touch / Swipe ── */
  let touchStartX = 0;
  container.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener("touchend",   e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) cycle(diff > 0 ? "right" : "left");
  }, { passive: true });

  /* ── Resize ── */
  window.addEventListener("resize", () => {
    if (!isAnimating) applyLayout();
  });

  /* ── Init (wait for GSAP to be ready) ── */
  function init() {
    if (typeof gsap === "undefined") {
      setTimeout(init, 100);
      return;
    }
    applyLayout();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
