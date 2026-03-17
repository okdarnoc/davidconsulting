/**
 * David Licence Consulting - Main JavaScript
 * Trilingual professional website (EN / TC / SC)
 * Vanilla ES6+ | No dependencies
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. LANGUAGE SWITCHER
     Supports 'en' (English), 'tc' (Traditional Chinese), 'sc' (Simplified Chinese).
     Elements use data-lang="en|tc|sc" to declare which language they belong to.
     ========================================================================== */

  const LANG_KEY = 'dlc-lang';
  const SUPPORTED_LANGS = ['en', 'tc', 'sc'];

  /**
   * Switch the visible language across the entire page.
   * @param {string} lang - 'en' | 'tc' | 'sc'
   */
  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';

    // Persist choice
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) { /* private mode */ }

    // Update <html lang>
    document.documentElement.lang = lang === 'tc' ? 'zh-Hant' : lang === 'sc' ? 'zh-Hans' : 'en';

    // Show / hide translatable elements
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      // An element may declare multiple langs: data-lang="en tc"
      const langs = el.getAttribute('data-lang').split(/\s+/);
      if (langs.includes(lang)) {
        el.style.display = '';
        el.removeAttribute('hidden');
      } else {
        el.style.display = 'none';
        el.setAttribute('hidden', '');
      }
    });

    // Update active state on language-switcher buttons
    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-set-lang') === lang);
      btn.setAttribute('aria-pressed', btn.getAttribute('data-set-lang') === lang);
    });
  }

  /** Read stored language or fall back to browser language then 'en'. */
  function getSavedLanguage() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (_) { /* ignore */ }

    // Detect from browser
    var nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('zh')) {
      // zh-TW, zh-HK => Traditional; zh-CN, zh-SG => Simplified
      return /tw|hk|hant/.test(nav) ? 'tc' : 'sc';
    }
    return 'en';
  }

  /** Initialise language switcher: bind buttons & apply saved language. */
  function initLanguageSwitcher() {
    // Event delegation on document for language buttons
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-set-lang]');
      if (!btn) return;
      e.preventDefault();
      setLanguage(btn.getAttribute('data-set-lang'));
    });

    // Apply saved / detected language on load
    setLanguage(getSavedLanguage());
  }

  /* ==========================================================================
     2. STICKY HEADER
     Adds .scrolled class to <header> after scrolling past 50 px.
     ========================================================================== */

  function initStickyHeader() {
    var header = document.querySelector('header');
    if (!header) return;

    var threshold = 50;
    var ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          header.classList.toggle('scrolled', window.scrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Run once in case page is already scrolled (e.g. refresh)
    onScroll();
  }

  /* ==========================================================================
     3. MOBILE MENU
     Toggle nav, close on link click, close on outside click, lock body scroll.
     ========================================================================== */

  function initMobileMenu() {
    var toggle = document.querySelector('.mobile-menu-toggle, .hamburger, [data-menu-toggle]');
    var nav = document.querySelector('.mobile-nav, .nav-menu, [data-mobile-nav]');
    if (!toggle || !nav) return;

    var isOpen = false;

    function openMenu() {
      isOpen = true;
      nav.classList.add('open');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      isOpen = false;
      nav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    // Close when a nav link is clicked
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (isOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
  }

  /* ==========================================================================
     4. SCROLL ANIMATIONS
     IntersectionObserver for .fade-up, .fade-in, .slide-in-left, .slide-in-right.
     Adds .visible when element enters the viewport. Animates once only.
     Grid children receive staggered animation-delay.
     ========================================================================== */

  function initScrollAnimations() {
    var animatedSelectors = '.fade-up, .fade-in, .slide-in-left, .slide-in-right';
    var elements = document.querySelectorAll(animatedSelectors);
    if (!elements.length) return;

    // Stagger: if parent is a grid / flex container, add incremental delay
    function applyStagger(el) {
      var parent = el.parentElement;
      if (!parent) return;
      var siblings = Array.from(parent.children).filter(function (c) {
        return c.matches(animatedSelectors);
      });
      var idx = siblings.indexOf(el);
      if (idx > 0) {
        el.style.transitionDelay = (idx * 0.1) + 's';
      }
    }

    elements.forEach(applyStagger);

    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything
      elements.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate once only
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ==========================================================================
     5. FAQ ACCORDION
     Only one answer open at a time. Smooth height transition. Icon rotation.
     ========================================================================== */

  function initFAQAccordion() {
    var faqContainer = document.querySelector('.faq, .faq-section, [data-faq]');
    if (!faqContainer) return;

    // Event delegation
    faqContainer.addEventListener('click', function (e) {
      var question = e.target.closest('.faq-question, [data-faq-question]');
      if (!question) return;

      var item = question.closest('.faq-item, [data-faq-item]');
      if (!item) return;

      var answer = item.querySelector('.faq-answer, [data-faq-answer]');
      if (!answer) return;

      var isOpen = item.classList.contains('open');

      // Close all other open items
      faqContainer.querySelectorAll('.faq-item.open, [data-faq-item].open').forEach(function (openItem) {
        if (openItem === item) return;
        openItem.classList.remove('open');
        var openAnswer = openItem.querySelector('.faq-answer, [data-faq-answer]');
        if (openAnswer) {
          openAnswer.style.maxHeight = null;
        }
        // Reset icon
        var openIcon = openItem.querySelector('.faq-icon, [data-faq-icon]');
        if (openIcon) openIcon.classList.remove('rotated');
      });

      // Toggle clicked item
      if (isOpen) {
        item.classList.remove('open');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }

      // Toggle icon rotation
      var icon = item.querySelector('.faq-icon, [data-faq-icon]');
      if (icon) icon.classList.toggle('rotated', !isOpen);
    });

    // Recalculate max-height on window resize (content may reflow)
    window.addEventListener('resize', debounce(function () {
      var openAnswer = faqContainer.querySelector('.faq-item.open .faq-answer, [data-faq-item].open [data-faq-answer]');
      if (openAnswer) {
        openAnswer.style.maxHeight = openAnswer.scrollHeight + 'px';
      }
    }, 200));
  }

  /* ==========================================================================
     6. SMOOTH SCROLL + ACTIVE NAV LINK
     Scrolls to section accounting for sticky header offset.
     Highlights the currently-visible section link in the nav.
     ========================================================================== */

  function initSmoothScroll() {
    var header = document.querySelector('header');
    var headerOffset = header ? header.offsetHeight : 0;

    // Smooth scroll for anchor links
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var targetId = link.getAttribute('href');
      if (targetId === '#' || targetId.length < 2) return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      // Recalculate in case header height changed
      headerOffset = header ? header.offsetHeight : 0;

      var top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 16;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth'
      });
    });

    // Active nav link highlight on scroll
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('nav a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    var ticking = false;

    function updateActiveLink() {
      headerOffset = header ? header.offsetHeight : 0;
      var scrollPos = window.scrollY + headerOffset + 50;

      var currentId = '';
      sections.forEach(function (section) {
        if (section.offsetTop <= scrollPos) {
          currentId = section.getAttribute('id');
        }
      });

      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
      });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateActiveLink();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    updateActiveLink();
  }

  /* ==========================================================================
     7. BLOG CATEGORY FILTER
     Shows/hides blog cards by data-category. Filter buttons use data-filter.
     ========================================================================== */

  function initBlogFilter() {
    var filterContainer = document.querySelector('.blog-filters, [data-blog-filters]');
    if (!filterContainer) return;

    var posts = document.querySelectorAll('[data-category]');
    if (!posts.length) return;

    filterContainer.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;

      var category = btn.getAttribute('data-filter');

      // Update active button
      filterContainer.querySelectorAll('[data-filter]').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });

      // Filter posts
      posts.forEach(function (post) {
        if (category === 'all' || post.getAttribute('data-category') === category) {
          post.style.display = '';
          post.removeAttribute('hidden');
        } else {
          post.style.display = 'none';
          post.setAttribute('hidden', '');
        }
      });
    });
  }

  /* ==========================================================================
     8. WHATSAPP FLOATING BUTTON
     Hides near the footer contact section, pulse animation timing.
     ========================================================================== */

  function initWhatsAppButton() {
    var btn = document.querySelector('.whatsapp-float, [data-whatsapp]');
    if (!btn) return;

    var footer = document.querySelector('footer, .contact-section, #contact');
    if (!footer) return;

    var ticking = false;

    function checkVisibility() {
      var footerRect = footer.getBoundingClientRect();
      var windowH = window.innerHeight;

      // Hide when footer contact area is in view
      if (footerRect.top < windowH - 100) {
        btn.classList.add('hidden');
      } else {
        btn.classList.remove('hidden');
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          checkVisibility();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Initial pulse delay so it doesn't pulse immediately on load
    btn.classList.add('no-pulse');
    setTimeout(function () {
      btn.classList.remove('no-pulse');
    }, 3000);

    checkVisibility();
  }

  /* ==========================================================================
     9. COUNTER ANIMATION
     Animates numbers from 0 to their target value when they scroll into view.
     Target value read from data-count or textContent.
     ========================================================================== */

  function initCounterAnimation() {
    var counters = document.querySelectorAll('.counter, [data-count]');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: just show final numbers
      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count') || el.textContent, 10);
        el.textContent = isNaN(target) ? el.textContent : target.toLocaleString();
      });
      return;
    }

    /**
     * Animate a single counter element from 0 to its target.
     * @param {Element} el
     */
    function animateCounter(el) {
      var target = parseInt(el.getAttribute('data-count') || el.textContent, 10);
      if (isNaN(target) || target <= 0) return;

      var suffix = (el.getAttribute('data-count-suffix') || '').trim();
      var duration = 2000; // ms
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease-out quad
        var easedProgress = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(easedProgress * target);

        el.textContent = current.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString() + suffix;
        }
      }

      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ==========================================================================
     10. SCROLL PROGRESS BAR
     Thin bar at the very top of the page showing read progress.
     Creates the element if not already present.
     ========================================================================== */

  function initScrollProgress() {
    var bar = document.querySelector('.scroll-progress, [data-scroll-progress]');

    // Auto-create if not in markup
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'scroll-progress';
      bar.setAttribute('aria-hidden', 'true');
      document.body.prepend(bar);
    }

    var ticking = false;

    function updateProgress() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  }

  /* ==========================================================================
     11. PAGE LOAD
     Removes loading state and triggers hero animations.
     ========================================================================== */

  function initPageLoad() {
    // Remove loading overlay / class
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');

    var loader = document.querySelector('.loader, .loading-overlay, [data-loader]');
    if (loader) {
      loader.classList.add('fade-out');
      loader.addEventListener('transitionend', function () {
        loader.remove();
      });
      // Safety net in case transitionend doesn't fire
      setTimeout(function () {
        if (loader.parentNode) loader.remove();
      }, 1000);
    }

    // Trigger hero animations after a brief delay for paint
    requestAnimationFrame(function () {
      var heroElements = document.querySelectorAll('.hero .animate, .hero [data-animate]');
      heroElements.forEach(function (el, i) {
        setTimeout(function () {
          el.classList.add('visible', 'animated');
        }, i * 150);
      });
    });
  }

  /* ==========================================================================
     12. BLOG PAGE FEATURES
     - Table of contents generated from headings
     - Reading progress bar
     - Back to top button
     ========================================================================== */

  function initBlogPage() {
    var articleBody = document.querySelector('.blog-content, .article-body, [data-blog-content]');
    if (!articleBody) return; // Not a blog post page

    // ---- Table of Contents ----
    var tocContainer = document.querySelector('.table-of-contents, [data-toc]');
    if (tocContainer) {
      var headings = articleBody.querySelectorAll('h2, h3');
      if (headings.length) {
        var tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        headings.forEach(function (heading, index) {
          // Ensure heading has an id
          if (!heading.id) {
            heading.id = 'heading-' + index;
          }

          var li = document.createElement('li');
          li.className = 'toc-item toc-' + heading.tagName.toLowerCase();

          var a = document.createElement('a');
          a.href = '#' + heading.id;
          a.textContent = heading.textContent;
          a.className = 'toc-link';

          li.appendChild(a);
          tocList.appendChild(li);
        });

        tocContainer.appendChild(tocList);

        // Highlight active heading in TOC on scroll
        var tocLinks = tocContainer.querySelectorAll('.toc-link');
        var tocTicking = false;

        window.addEventListener('scroll', function () {
          if (!tocTicking) {
            window.requestAnimationFrame(function () {
              var header = document.querySelector('header');
              var offset = (header ? header.offsetHeight : 0) + 60;
              var currentId = '';

              headings.forEach(function (h) {
                if (h.getBoundingClientRect().top <= offset) {
                  currentId = h.id;
                }
              });

              tocLinks.forEach(function (link) {
                link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
              });
              tocTicking = false;
            });
            tocTicking = true;
          }
        }, { passive: true });
      }
    }

    // ---- Reading Progress Bar ----
    var readingBar = document.querySelector('.reading-progress, [data-reading-progress]');
    if (!readingBar) {
      readingBar = document.createElement('div');
      readingBar.className = 'reading-progress';
      readingBar.setAttribute('aria-hidden', 'true');
      document.body.prepend(readingBar);
    }

    var readTicking = false;

    function updateReadingProgress() {
      var rect = articleBody.getBoundingClientRect();
      var articleTop = rect.top + window.scrollY;
      var articleHeight = articleBody.offsetHeight;
      var scrolled = window.scrollY - articleTop;
      var progress = Math.min(Math.max(scrolled / (articleHeight - window.innerHeight), 0), 1) * 100;
      readingBar.style.width = progress + '%';
    }

    window.addEventListener('scroll', function () {
      if (!readTicking) {
        window.requestAnimationFrame(function () {
          updateReadingProgress();
          readTicking = false;
        });
        readTicking = true;
      }
    }, { passive: true });

    // ---- Back to Top Button ----
    var backToTop = document.querySelector('.back-to-top, [data-back-to-top]');
    if (!backToTop) {
      backToTop = document.createElement('button');
      backToTop.className = 'back-to-top';
      backToTop.setAttribute('aria-label', 'Back to top');
      backToTop.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 16V4M4 10l6-6 6 6"/></svg>';
      document.body.appendChild(backToTop);
    }

    var bttTicking = false;

    window.addEventListener('scroll', function () {
      if (!bttTicking) {
        window.requestAnimationFrame(function () {
          backToTop.classList.toggle('visible', window.scrollY > 400);
          bttTicking = false;
        });
        bttTicking = true;
      }
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ==========================================================================
     UTILITY: Debounce
     ========================================================================== */

  /**
   * Returns a debounced version of the given function.
   * @param {Function} fn
   * @param {number} delay - milliseconds
   * @returns {Function}
   */
  function debounce(fn, delay) {
    var timer;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  /* ==========================================================================
     INIT
     Boot everything when the DOM is ready.
     ========================================================================== */

  function init() {
    initLanguageSwitcher();   // 1
    initStickyHeader();       // 2
    initMobileMenu();         // 3
    initScrollAnimations();   // 4
    initFAQAccordion();       // 5
    initSmoothScroll();       // 6
    initBlogFilter();         // 7
    initWhatsAppButton();     // 8
    initCounterAnimation();   // 9
    initScrollProgress();     // 10
    initPageLoad();           // 11
    initBlogPage();           // 12
  }

  // Run on DOMContentLoaded if not already fired, otherwise run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
