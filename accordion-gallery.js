/**
 * Qadam Accordion Gallery — vanilla JS + GSAP port of the React Bits
 * AccordionGallery component. No React, no build step.
 *
 * Requires GSAP loaded globally before this file:
 *   <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
 *
 * Usage:
 *   new AccordionGallery(document.getElementById('qadamGallery'), items, options);
 */
(function (global) {
  function createEl(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  class AccordionGallery {
    constructor(root, items, options = {}) {
      if (!root) throw new Error('AccordionGallery: root element required');
      if (!window.gsap) throw new Error('AccordionGallery: GSAP must be loaded first');

      this.root = root;
      this.items = items && items.length ? items : [];
      this.opts = Object.assign(
        {
          defaultIndex: 2,
          accentColor: '#c1440e',
          overlayColor: '#0b0b0c',
          textColor: '#f5f1ea',
          height: 460,
          gap: 10,
          radius: 4,
          expandRatio: 0.52,
          orientation: 'horizontal', // 'horizontal' | 'vertical'
          duration: 0.6,
          ease: 'power3.out',
          parallax: 0.5,
          tilt: 8,
          stagger: 0.06,
          trigger: 'hover', // 'hover' | 'click'
          showLabels: true,
          showTag: true, // shows item.tag (e.g. price / condition) under the label
          grayscale: true
        },
        options
      );

      this.vertical = this.opts.orientation === 'vertical';
      this.count = this.items.length;
      this.active = Math.min(Math.max(this.opts.defaultIndex, 0), this.count - 1);
      this.mediaSize = 320;
      this.tl = null;
      this.firstRun = true;

      this.prefersReduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.panels = [];
      this.mediaEls = [];
      this.barEls = [];
      this.textEls = [];
      this.tagEls = [];

      this._build();
      this._bindResize();
      this.applyLayout(false);
      this.firstRun = false;
    }

    _build() {
      const { opts } = this;
      this.root.classList.add('ag-root');
      if (this.vertical) this.root.classList.add('ag-root--vertical');
      this.root.setAttribute('role', 'list');
      this.root.setAttribute('aria-label', 'Image accordion gallery');

      this.root.style.setProperty('--ag-accent', opts.accentColor);
      this.root.style.setProperty('--ag-overlay', opts.overlayColor);
      this.root.style.setProperty('--ag-text', opts.textColor);
      this.root.style.setProperty('--ag-gap', opts.gap + 'px');
      this.root.style.setProperty('--ag-radius', opts.radius + 'px');
      this.root.style.height = this.vertical
        ? Math.round(opts.height * 1.6) + 'px'
        : opts.height + 'px';

      this.items.forEach((item, i) => {
        const isActive = i === this.active;
        const tag = item.link ? 'a' : 'div';
        const panel = createEl(tag, 'ag-panel' + (isActive ? ' ag-panel--active' : ''));
        panel.style.borderRadius = opts.radius + 'px';
        if (item.link) panel.href = item.link;
        panel.setAttribute('role', 'listitem');
        panel.tabIndex = 0;
        if (isActive) panel.setAttribute('aria-current', 'true');
        if (item.label) panel.setAttribute('aria-label', item.label);

        const frame = createEl('span', 'ag-panel__frame');
        const media = createEl('span', 'ag-panel__media');
        const img = createEl('img');
        img.src = item.image;
        img.alt = item.alt || item.label || '';
        img.draggable = false;
        media.appendChild(img);
        const overlay = createEl('span', 'ag-panel__overlay');
        overlay.setAttribute('aria-hidden', 'true');
        frame.appendChild(media);
        frame.appendChild(overlay);
        panel.appendChild(frame);

        let bar = null;
        let text = null;
        let tagEl = null;
        if (opts.showLabels) {
          const label = createEl('span', 'ag-panel__label');
          label.setAttribute('aria-hidden', 'true');
          bar = createEl('span', 'ag-panel__bar');
          const textWrap = createEl('span');
          text = createEl('span', 'ag-panel__text');
          text.textContent = item.label || '';
          textWrap.appendChild(text);
          if (opts.showTag && item.tag) {
            tagEl = createEl('span', 'ag-panel__tag');
            tagEl.textContent = item.tag;
            textWrap.appendChild(tagEl);
          }
          label.appendChild(bar);
          label.appendChild(textWrap);
          panel.appendChild(label);
        }

        panel.addEventListener('mouseenter', () => {
          if (opts.trigger === 'hover') this.setActive(i);
        });
        panel.addEventListener('focus', () => this.setActive(i));
        panel.addEventListener('click', (e) => {
          if (i !== this.active) {
            e.preventDefault();
            this.setActive(i);
          }
        });
        panel.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.setActive((i + 1) % this.count);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.setActive((i - 1 + this.count) % this.count);
          }
        });

        this.root.appendChild(panel);
        this.panels.push(panel);
        this.mediaEls.push(media);
        this.barEls.push(bar);
        this.textEls.push(text);
        this.tagEls.push(tagEl);
      });
    }

    _bindResize() {
      const measure = () => {
        const rect = this.root.getBoundingClientRect();
        const total = this.vertical ? rect.height : rect.width;
        const usable = Math.max(total - this.opts.gap * (this.count - 1), 120);
        const r = Math.min(Math.max(this.opts.expandRatio, 0.2), 0.9);
        const size = Math.max(140, usable * r * 1.22);
        this.mediaSize = size;
        this.root.style.setProperty('--ag-media-size', size + 'px');
        this.applyLayout(!this.firstRun);
      };
      measure();
      this.ro = new ResizeObserver(measure);
      this.ro.observe(this.root);
    }

    setActive(i) {
      if (i === this.active) return;
      this.active = i;
      this.panels.forEach((p, idx) => {
        p.classList.toggle('ag-panel--active', idx === this.active);
        if (idx === this.active) p.setAttribute('aria-current', 'true');
        else p.removeAttribute('aria-current');
      });
      this.applyLayout(true);
    }

    applyLayout(animate) {
      const { opts, count, active } = this;
      if (!this.panels.length) return;

      const r = Math.min(Math.max(opts.expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;

      if (this.tl) this.tl.kill();
      const dur = animate && !this.prefersReduced ? opts.duration : 0;
      const tl = gsap.timeline();

      this.panels.forEach((panel, i) => {
        const isActive = i === active;
        const media = this.mediaEls[i];
        const bar = this.barEls[i];
        const text = this.textEls[i];
        const tagEl = this.tagEls[i];

        const rot = isActive ? 0 : i < active ? opts.tilt : -opts.tilt;
        const rotProp = this.vertical ? { rotateX: -rot } : { rotateY: rot };

        tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease: opts.ease }, 0);

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i));
          const shift = drift * opts.parallax * this.mediaSize * 0.06;
          const gray = opts.grayscale ? (isActive ? 0 : 1) : 0;
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: this.vertical ? 0 : isActive ? 0 : shift,
              y: this.vertical ? (isActive ? 0 : shift) : 0,
              '--ag-gray': gray,
              '--ag-dim': isActive ? 0 : 0.35,
              duration: dur,
              ease: opts.ease
            },
            0
          );
        }

        if (opts.showLabels && bar && text) {
          const targets = tagEl ? [bar, text, tagEl] : [bar, text];
          if (isActive) {
            tl.to(targets, { opacity: 1, x: 0, duration: dur, ease: opts.ease, stagger: this.prefersReduced ? 0 : opts.stagger }, 0);
          } else {
            tl.to(targets, { opacity: 0, x: -14, duration: dur * 0.6, ease: opts.ease }, 0);
          }
        }
      });

      this.tl = tl;
    }

    destroy() {
      if (this.tl) this.tl.kill();
      if (this.ro) this.ro.disconnect();
      this.root.innerHTML = '';
    }
  }

  global.AccordionGallery = AccordionGallery;
})(window);
