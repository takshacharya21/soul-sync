/**
 * Card Fan Carousel – Soul Syync Gallery
 * Integrates GSAP Fan Layout with 19 photos
 */
(function () {
  function initFanCarousel() {
    var container = document.getElementById("fan-container");
    if (!container) return;

    if (typeof gsap === "undefined") {
      setTimeout(initFanCarousel, 80);
      return;
    }

    var cardElements = Array.from(container.querySelectorAll(".fan-card"));
    if (!cardElements.length) return;

    var totalCards = cardElements.length;
    var MAX_VISIBLE = 7;
    var HALF = 3;
    var needsPagination = totalCards > MAX_VISIBLE;
    var centerIndex = needsPagination ? HALF : (totalCards >> 1);
    var isAnimating = false;
    var hasEntered = false;
    var direction = null;
    var prevVisible = new Set();

    var FAN_POSITIONS = [
      { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
      { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
      { rot: -7,  scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
      { rot: 0,   scale: 1.0,    x: 0,   y: 0.0, zIndex: 10 },
      { rot: 7,   scale: 0.9346, x: 11,  y: 1.3, zIndex: 3 },
      { rot: 14,  scale: 0.8498, x: 22,  y: 4.0, zIndex: 2 },
      { rot: 21,  scale: 0.7756, x: 30,  y: 7.3, zIndex: 1 },
    ];

    function getResponsiveMultiplier(width) {
      if (width < 480) return 0.28;
      if (width < 640) return 0.38;
      if (width < 768) return 0.5;
      if (width < 1024) return 0.75;
      return 1.0;
    }

    function getHeightMultiplier(width) {
      var idealPx = width < 480 ? 352 : width < 640 ? 416 : width < 768 ? 448 : width < 1024 ? 544 : 608;
      var available = window.innerHeight * 0.7;
      if (available >= idealPx) return 1;
      return available / idealPx;
    }

    function getSlotConfig(slot) {
      var slotCount = needsPagination ? MAX_VISIBLE : totalCards;
      if (slotCount >= MAX_VISIBLE) return FAN_POSITIONS[slot];
      var center = slotCount >> 1;
      var distance = slotCount > 1 ? (slot - center) / center : 0;
      var absDistance = Math.abs(distance);
      return {
        rot: distance * 21,
        scale: 1.0 - 0.2244 * absDistance * absDistance,
        x: distance * 30,
        y: absDistance * absDistance * 7.3,
        zIndex: 10 - Math.abs(slot - center),
      };
    }

    function getVisibleMap(center) {
      var map = new Map();
      if (!needsPagination) {
        cardElements.forEach(function (_, i) { map.set(i, i); });
        return map;
      }
      for (var slot = 0; slot < MAX_VISIBLE; slot++) {
        var cardIndex = ((center + slot - HALF) % totalCards + totalCards) % totalCards;
        map.set(cardIndex, slot);
      }
      return map;
    }

    // Set base coordinates on all cards
    cardElements.forEach(function (card) {
      gsap.set(card, {
        position: "absolute",
        left: "50%",
        top: "50%",
        xPercent: -50,
        yPercent: -50,
        opacity: 0,
        scale: 0.3,
        zIndex: 0
      });
    });

    // Pagination elements
    var pagination = document.getElementById("fan-pagination");
    var dotsWrap = document.getElementById("fan-dots");
    var prevBtn = document.getElementById("fan-prev");
    var nextBtn = document.getElementById("fan-next");

    if (dotsWrap && needsPagination) {
      dotsWrap.innerHTML = "";
      cardElements.forEach(function (_, i) {
        var dot = document.createElement("span");
        dot.className = "fan-dot" + (i === centerIndex ? " active" : "");
        dotsWrap.appendChild(dot);
      });
    }

    function updateDots() {
      if (!dotsWrap) return;
      var dots = dotsWrap.querySelectorAll(".fan-dot");
      dots.forEach(function (dot, i) {
        dot.className = "fan-dot" + (i === centerIndex ? " active" : "");
      });
    }

    function renderLayout() {
      var visibleMap = getVisibleMap(centerIndex);
      var previouslyVisible = prevVisible;
      var isFirstMount = !hasEntered;
      var multiplier = getResponsiveMultiplier(window.innerWidth);
      var hMult = getHeightMultiplier(window.innerWidth);

      if (isFirstMount) isAnimating = true;

      var completedCount = 0;
      var visibleCount = visibleMap.size;
      function onCardDone() {
        completedCount++;
        if (completedCount >= visibleCount) {
          isAnimating = false;
          if (isFirstMount) hasEntered = true;
        }
      }

      cardElements.forEach(function (card, cardIndex) {
        var slot = visibleMap.get(cardIndex);
        var wasVisible = previouslyVisible.has(cardIndex);

        if (slot !== undefined) {
          var cfg = getSlotConfig(slot);
          var targetX = cfg.x * multiplier * 16; // convert rem to px relative to center
          var targetY = cfg.y * hMult * 16;

          var target = {
            x: targetX,
            y: targetY,
            rotation: cfg.rot,
            scale: cfg.scale,
            opacity: 1,
            zIndex: cfg.zIndex,
          };

          if (isFirstMount) {
            gsap.set(card, { x: 0, y: 12 * hMult * 16, rotation: 0, scale: 0.5, opacity: 0 });
            gsap.to(card, Object.assign({}, target, {
              duration: 1.1,
              ease: "elastic.out(1.05, 0.78)",
              delay: 0.15 + slot * 0.05,
              onComplete: onCardDone,
            }));
          } else if (!wasVisible) {
            var enterX = direction === "right" ? 40 * 16 : -40 * 16;
            gsap.set(card, {
              x: enterX,
              y: targetY,
              rotation: direction === "right" ? 30 : -30,
              scale: 0.5,
              opacity: 0,
            });
            gsap.to(card, Object.assign({}, target, {
              duration: 0.55,
              ease: "power2.out",
              onComplete: onCardDone,
            }));
          } else {
            gsap.to(card, Object.assign({}, target, {
              duration: 0.45,
              ease: "power2.out",
              onComplete: onCardDone,
            }));
          }
        } else if (wasVisible) {
          var exitX = direction === "right" ? -40 * 16 : 40 * 16;
          gsap.to(card, {
            x: exitX,
            opacity: 0,
            scale: 0.5,
            rotation: direction === "right" ? -30 : 30,
            duration: 0.38,
            ease: "power2.in",
            zIndex: 0,
          });
        } else if (isFirstMount) {
          gsap.set(card, { opacity: 0, scale: 0.3, zIndex: 0 });
        }
      });

      prevVisible = new Set(visibleMap.keys());
      updateDots();
      setupHover(visibleMap);
    }

    function setupHover(visibleMap) {
      var visibleEntries = [];
      cardElements.forEach(function (el, i) {
        var slot = visibleMap.get(i);
        if (slot !== undefined) visibleEntries.push({ el: el, slot: slot });
      });
      visibleEntries.sort(function (a, b) { return a.slot - b.slot; });

      var activeSlot = null;
      var leaveTimer = null;
      var centerSlot = visibleEntries.length >> 1;

      function updateHoverLayout(hoveredSlot) {
        var mult = getResponsiveMultiplier(window.innerWidth);
        var hM = getHeightMultiplier(window.innerWidth);

        visibleEntries.forEach(function (item) {
          var el = item.el;
          var slot = item.slot;
          var base = getSlotConfig(slot);
          var targetX = base.x * mult * 16;
          var targetY = base.y * hM * 16;
          var targetRot = base.rot;
          var targetScale = base.scale;
          var delay = 0;

          if (hoveredSlot !== null) {
            var distance = Math.abs(slot - hoveredSlot);
            delay = distance * 0.02;

            if (slot === hoveredSlot) {
              targetY -= 2.5 * hM * 16;
              targetScale *= 1.08;
            } else {
              var normalized = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
              var pushStrength = 8 * (1 - Math.abs(normalized)) * (1 + 0.2 * Math.max(0, 3 - distance));
              var sign = slot < hoveredSlot ? -1 : 1;
              targetX += sign * pushStrength * mult * 16;
              targetRot += sign * 3 / (distance + 1);
            }
          } else {
            delay = Math.abs(slot - centerSlot) * 0.02;
          }

          gsap.to(el, {
            x: targetX,
            y: targetY,
            rotation: targetRot,
            scale: targetScale,
            duration: 0.45,
            delay: delay,
            ease: "elastic.out(1, 0.75)",
            overwrite: "auto",
          });
          gsap.set(el, { zIndex: base.zIndex });
        });
      }

      visibleEntries.forEach(function (item) {
        item.el.onmouseenter = function () {
          if (isAnimating) return;
          if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
          if (activeSlot !== item.slot) {
            activeSlot = item.slot;
            updateHoverLayout(item.slot);
          }
        };
      });

      container.onmouseleave = function () {
        if (isAnimating) return;
        if (leaveTimer) clearTimeout(leaveTimer);
        leaveTimer = setTimeout(function () {
          activeSlot = null;
          updateHoverLayout(null);
        }, 50);
      };
    }

    function cycle(dir) {
      if (isAnimating || !needsPagination) return;
      isAnimating = true;
      direction = dir;
      centerIndex = dir === "right"
        ? (centerIndex + 1) % totalCards
        : (centerIndex - 1 + totalCards) % totalCards;
      renderLayout();
    }

    if (prevBtn) prevBtn.onclick = function () { cycle("left"); };
    if (nextBtn) nextBtn.onclick = function () { cycle("right"); };

    var touchStartX = 0;
    container.addEventListener("touchstart", function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    container.addEventListener("touchend", function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) cycle(diff > 0 ? "right" : "left");
    }, { passive: true });

    document.addEventListener("keydown", function (e) {
      var rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        if (e.key === "ArrowLeft") cycle("left");
        if (e.key === "ArrowRight") cycle("right");
      }
    });

    window.addEventListener("resize", function () {
      if (!isAnimating) renderLayout();
    });

    renderLayout();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFanCarousel);
  } else {
    initFanCarousel();
  }
})();
