/* ═══════════════════════════════════════════════════
   SOUL SYYNC  —  script.js
   ═══════════════════════════════════════════════════ */

const API = '';

/* ── Cursor Aura ──────────────────────────────────── */
const cursorAura = document.getElementById('cursorAura');
document.addEventListener('mousemove', (e) => {
  cursorAura.style.left = e.clientX + 'px';
  cursorAura.style.top  = e.clientY + 'px';
});

/* ── Navigation ───────────────────────────────────── */
const nav      = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

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
const navAs    = navLinks.querySelectorAll('a[href^="#"]');
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
    const size  = Math.random() * 2 + 0.5;
    const x     = Math.random() * 100;
    const y     = Math.random() * 100;
    const delay = Math.random() * 6;
    const dur   = 3 + Math.random() * 4;
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

document.querySelectorAll('.service-card, .why-item, .testi-card, .faq-item, .about-grid, .contact-grid').forEach(el => {
  el.setAttribute('data-animate', '');
  animObserver.observe(el);
});

/* ── FAQ Toggle ───────────────────────────────────── */
function toggleFAQ(btn) {
  const answer = btn.nextElementSibling;
  const icon   = btn.querySelector('.faq-icon');
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
  document.body.style.overflow = 'hidden';
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
  document.body.style.overflow = '';
  document.getElementById('bookingSuccess').style.display = 'none';
  document.getElementById('bookingForm').style.display = '';
  document.getElementById('bookingForm').reset();
  // Reset session mode toggle
  selectMode('online');
}

function closeModalOnOverlay(e) {
  if (e.target === modal) closeBooking();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBooking();
});

/* ── Booking Submission ───────────────────────────── */
async function submitBooking(e) {
  e.preventDefault();
  const btn = document.getElementById('bSubmitBtn');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span>Sending…</span>';
  btn.disabled = true;

  const payload = {
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
    const r = await fetch(`${API}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    if (d.success) {
      document.getElementById('bookingForm').style.display = 'none';
      document.getElementById('bookingSuccess').style.display = 'block';
      showToast('Booking confirmed! ✦');
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

/* ── Contact Submission ───────────────────────────── */
async function submitContact(e) {
  e.preventDefault();
  const btn = document.getElementById('cSubmitBtn');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span>Sending…</span>';
  btn.disabled = true;

  const payload = {
    name:    document.getElementById('cName').value,
    email:   document.getElementById('cEmail').value,
    phone:   document.getElementById('cPhone').value,
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
      const top = target.getBoundingClientRect().top + window.scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ── Parallax subtle on hero ─────────────────────── */
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const hero = document.querySelector('.hero-content');
  if (hero && scrolled < window.innerHeight) {
    hero.style.transform = `translateY(${scrolled * 0.15}px)`;
    hero.style.opacity   = 1 - scrolled / (window.innerHeight * 0.8);
  }
});
