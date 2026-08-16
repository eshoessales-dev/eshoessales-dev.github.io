// ===== CONFIG — replace with your real details =====
const WHATSAPP_NUMBER = "923402528708"; // <-- put your real WhatsApp number here (no + or spaces)
const CONTACT_EMAIL   = "eshoessales@gmail.com"; // <-- confirm/replace with your real email

// ===== Mobile nav toggle =====
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // ===== WhatsApp order buttons =====
  document.querySelectorAll('[data-order]').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = btn.getAttribute('data-order');
      const price   = btn.getAttribute('data-price') || '';
      const msg = `Hi Qadam! I'd like to order: ${product}${price ? ' (' + price + ')' : ''}. Is it still available?`;
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    });
  });

  // ===== Shop filter tabs =====
  const tabs = document.querySelectorAll('.filter-tabs button');
  const cards = document.querySelectorAll('.product-grid .card');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.getAttribute('data-filter');
      cards.forEach(card => {
        const match = cat === 'all' || card.getAttribute('data-cat') === cat;
        card.style.display = match ? '' : 'none';
      });
    });
  });

  // ===== Contact form -> opens email client with prefilled message =====
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const subject = `Website enquiry from ${name || 'a customer'}`;
      const body = `${message}\n\n— ${name} (${email})`;
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  // ===== General WhatsApp CTA buttons =====
  document.querySelectorAll('[data-whatsapp]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const msg = "Hi Qadam! I'd like to know more about your pre-loved sneakers.";
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  });

  // ===== Scroll-reveal animations =====
  // Fades/rises elements into view as the user scrolls. Falls back to
  // showing everything immediately if IntersectionObserver isn't supported.
  const revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && revealTargets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in-view'));
  }
});
