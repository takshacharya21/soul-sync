/* ═══════════════════════════════════════════════════
   SOUL SYYNC  —  script.js
   ═══════════════════════════════════════════════════ */

const API = '';

// Initialize Lenis Smooth Scroll
const lenis = new Lenis({
  duration: 0.8,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1.2,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

/* ── Cursor Aura ──────────────────────────────────── */
const cursorAura = document.getElementById('cursorAura');
document.addEventListener('mousemove', (e) => {
  cursorAura.style.left = e.clientX + 'px';
  cursorAura.style.top = e.clientY + 'px';
});

/* ── Navigation ───────────────────────────────────── */
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
});

// Close nav on link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id], div[id]');
const navAs = navLinks.querySelectorAll('a[href^="#"]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAs.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + entry.target.id) {
          a.style.color = 'var(--gold)';
        }
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => observer.observe(s));

/* ── Starfield ────────────────────────────────────── */
(function buildStars() {
  const field = document.getElementById('starField');
  if (!field) return;
  const count = 80;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    const size = Math.random() * 2 + 0.5;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const delay = Math.random() * 6;
    const dur = 3 + Math.random() * 4;
    star.style.cssText = `
      position:absolute;
      left:${x}%; top:${y}%;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:rgba(212,175,120,${0.1 + Math.random() * 0.5});
      animation:starTwinkle ${dur}s ease-in-out ${delay}s infinite;
    `;
    field.appendChild(star);
  }
  // Inject keyframe
  if (!document.getElementById('starStyle')) {
    const sty = document.createElement('style');
    sty.id = 'starStyle';
    sty.textContent = `
      @keyframes starTwinkle {
        0%,100% { opacity:.15; transform:scale(1); }
        50%      { opacity:1;   transform:scale(1.4); }
      }
    `;
    document.head.appendChild(sty);
  }
})();

/* ── Scroll-triggered Animations ─────────────────── */
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.service-card, .why-item, .testi-card, .faq-item, .about-grid, .centre-about-grid, .contact-grid').forEach(el => {
  el.setAttribute('data-animate', '');
  animObserver.observe(el);
});

/* ── FAQ Toggle ───────────────────────────────────── */
function toggleFAQ(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('.faq-icon');
  const isOpen = answer.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-a.open').forEach(a => {
    a.classList.remove('open');
    a.previousElementSibling.querySelector('.faq-icon').textContent = '+';
    a.previousElementSibling.querySelector('.faq-icon').style.transform = 'rotate(0deg)';
  });

  if (!isOpen) {
    answer.classList.add('open');
    icon.textContent = '−';
    icon.style.transform = 'rotate(180deg)';
  }
}

/* ── Modal ────────────────────────────────────────── */
const modal = document.getElementById('bookingModal');

function openBooking(service) {
  modal.classList.add('open');
  document.body.classList.add('modal-open');   // lock background scroll
  modal.scrollTop = 0;                          // start from top
  if (typeof lenis !== 'undefined') lenis.stop();
  if (service) {
    const sel = document.getElementById('bService');
    if (sel) {
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text === service) {
          sel.selectedIndex = i;
          break;
        }
      }
    }
  }
  // Set min date to today
  const dateInput = document.getElementById('bDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }
}

function closeBooking() {
  modal.classList.remove('open');
  document.body.classList.remove('modal-open'); // unlock background scroll
  document.body.style.overflow = '';
  if (typeof lenis !== 'undefined') lenis.start();
  
  const successEl = document.getElementById('bookingSuccess');
  successEl.style.display = 'none';
  successEl.classList.remove('animate-in');
  
  const formEl = document.getElementById('bookingForm');
  formEl.style.display = '';
  formEl.style.opacity = '';
  formEl.style.transform = '';
  formEl.reset();
  
  // Reset session mode toggle
  selectMode('online');
}

function closeModalOnOverlay(e) {
  if (e.target === modal) closeBooking();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBooking();
});

/* ── Booking Submission with Razorpay Payment ─────── */
async function submitBooking(e) {
  e.preventDefault();
  const btn = document.getElementById('bSubmitBtn');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span>Processing…</span>';
  btn.disabled = true;

  const booking = {
    name:         document.getElementById('bName').value,
    email:        document.getElementById('bEmail').value,
    phone:        document.getElementById('bPhone').value,
    service:      document.getElementById('bService').value,
    date:         document.getElementById('bDate').value,
    time:         document.getElementById('bTime').value,
    message:      document.getElementById('bMessage').value,
    session_mode: document.getElementById('bMode').value,
  };

  try {
    // ── 10-minute cancel cooldown check ─────────────────────────────────
    const cancelKey  = `rzp_cancel_${booking.phone}`;
    const cancelTime = localStorage.getItem(cancelKey);
    if (cancelTime) {
      const waitMs   = 10 * 60 * 1000; // 10 minutes
      const elapsed  = Date.now() - parseInt(cancelTime);
      if (elapsed < waitMs) {
        const remaining = Math.ceil((waitMs - elapsed) / 60000);
        showToast(`Payment was cancelled. Please try again in ${remaining} minute(s).`);
        btn.innerHTML = orig;
        btn.disabled = false;
        return;
      } else {
        localStorage.removeItem(cancelKey);
      }
    }
    // ───────────────────────────────────────────────────

    // Step 1: Create Razorpay order (₹499)
    const orderRes = await fetch(`${API}/api/create-order`, { method: 'POST' });
    const orderData = await orderRes.json();

    if (!orderData.success) {
      showToast(orderData.message || 'Could not initiate payment');
      btn.innerHTML = orig;
      btn.disabled = false;
      return;
    }

    // Step 2: Open Razorpay Payment Popup
    const options = {
      key:         orderData.key_id,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'Soul Syync',
      description: 'Session Booking Fee',
      image:       '/logo.png.PNG',
      order_id:    orderData.order_id,
      prefill: {
        name:    booking.name,
        email:   booking.email,
        contact: booking.phone,
      },
      theme: { color: '#C9A84C' },

      handler: async function(response) {
        // Step 3: Verify payment + save booking
        btn.innerHTML = '<span>Confirming…</span>';
        try {
          const verifyRes = await fetch(`${API}/api/verify-payment`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              booking:             booking,
            })
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            const formEl = document.getElementById('bookingForm');
            formEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            formEl.style.opacity = '0';
            formEl.style.transform = 'scale(0.96)';
            setTimeout(() => {
              formEl.style.display = 'none';
              const successEl = document.getElementById('bookingSuccess');
              successEl.style.display = 'block';
              successEl.classList.add('animate-in');
              showToast('Payment successful! Booking confirmed ✦');
            }, 300);
          } else {
            showToast(verifyData.message || 'Payment verification failed');
            btn.innerHTML = orig;
            btn.disabled = false;
          }
        } catch(err) {
          showToast('Could not verify payment');
          btn.innerHTML = orig;
          btn.disabled = false;
        }
      },

      modal: {
        ondismiss: function() {
          // Start 10-min cooldown on dismiss
          localStorage.setItem(`rzp_cancel_${booking.phone}`, Date.now().toString());
          showToast('Payment cancelled. You can retry in 10 minutes.');
          btn.innerHTML = orig;
          btn.disabled = false;
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    showToast('Could not connect to server');
    btn.innerHTML = orig;
    btn.disabled = false;
  }
}

/* ── Contact Submission ───────────────────────────── */
async function submitContact(e) {
  e.preventDefault();
  const btn = document.getElementById('cSubmitBtn');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span>Sending…</span>';
  btn.disabled = true;

  const payload = {
    name: document.getElementById('cName').value,
    email: document.getElementById('cEmail').value,
    phone: document.getElementById('cPhone').value,
    message: document.getElementById('cMessage').value,
  };

  try {
    const r = await fetch(`${API}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    if (d.success) {
      document.getElementById('contactForm').style.display = 'none';
      document.getElementById('formSuccess').style.display = 'block';
      showToast('Message sent! ✦');
    } else {
      showToast(d.message || 'Something went wrong');
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  } catch (err) {
    showToast('Could not connect to server');
    btn.innerHTML = orig;
    btn.disabled = false;
  }
}

/* ── Toast ────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── Instagram Smart Open ─────────────────────────── */
// Mobile ma Instagram app open kare, PC ma browser ma open kare
function openInstagram() {
  const webUrl = 'https://www.instagram.com/_soul_syync?igsh=MXZnNDhhNmx2bWpxbQ%3D%3D&utm_source=qr';
  const appUrl = 'instagram://user?username=_soul_syync';
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Try to open app first
    const start = Date.now();
    window.location = appUrl;
    // If app not installed, fallback to web after 1.5s
    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(webUrl, '_blank');
      }
    }, 1500);
  } else {
    // PC — open in browser tab
    window.open(webUrl, '_blank');
  }
}

/* ── Session Mode Toggle ─────────────────────────── */
function selectMode(mode) {
  document.getElementById('bMode').value = mode;
  document.getElementById('btnOnline').classList.toggle('active', mode === 'online');
  document.getElementById('btnOffline').classList.toggle('active', mode === 'offline');
}

/* ── Smooth scroll for anchor links ──────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      lenis.scrollTo(target, { offset: -offset });
    }
  });
});

/* ── Parallax subtle on hero ─────────────────────── */
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const hero = document.querySelector('.hero-content');
  if (hero && scrolled < window.innerHeight) {
    hero.style.transform = `translateY(${scrolled * 0.15}px)`;
    hero.style.opacity = 1 - scrolled / (window.innerHeight * 0.8);
  }
});

/* ── Intro Splash Screen Controller ──────────────── */
(function handleIntroSplash() {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  // Add scroll locking class immediately
  document.documentElement.classList.add('intro-active');
  document.body.classList.add('intro-active');
  if (typeof lenis !== 'undefined') lenis.stop();

  // Build stars specifically for the intro (Galaxy effect)
  const field = document.getElementById('introStarField');
  if (field) {
    const count = 120;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      const size = Math.random() * 2.2 + 0.4;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 5;
      const dur = 2 + Math.random() * 4;

      // Randomize star color: 60% white/light-blue, 35% gold/orange, 5% soft purple
      let color = 'rgba(255,255,255,';
      const randType = Math.random();
      if (randType > 0.95) {
        color = 'rgba(184,168,200,'; // purple
      } else if (randType > 0.6) {
        color = 'rgba(212,175,120,'; // gold
      } else if (randType > 0.4) {
        color = 'rgba(173,216,230,'; // light blue
      }

      const opacity = 0.25 + Math.random() * 0.75;

      star.style.cssText = `
        position:absolute;
        left:${x}%; top:${y}%;
        width:${size}px; height:${size}px;
        border-radius:50%;
        background:${color}${opacity});
        animation:starTwinkle ${dur}s ease-in-out ${delay}s infinite;
        ${size > 1.8 ? `box-shadow: 0 0 ${size * 1.5}px ${color}${opacity * 0.6});` : ''}
      `;
      field.appendChild(star);
    }
  }

  // Fade out transition after 7 seconds
  setTimeout(() => {
    overlay.classList.add('fade-out');

    // Unlock scrolling slightly before cleanup for a smooth feel
    setTimeout(() => {
      document.documentElement.classList.remove('intro-active');
      document.body.classList.remove('intro-active');
      if (typeof lenis !== 'undefined') lenis.start();
    }, 400);

    // Remove overlay from DOM once transition is finished
    setTimeout(() => {
      overlay.remove();
    }, 1000);

  }, 7000); // 7 seconds duration
})();

// ── Image Copy & Save Protection ───────────────────
function protectImages() {
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
    img.addEventListener('dragstart', e => e.preventDefault());
  });
}
protectImages();
document.addEventListener('DOMContentLoaded', protectImages);
