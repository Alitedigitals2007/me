document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
  }

  var aiBtn = document.getElementById('aiDraftBtn');
  var aiStatus = document.getElementById('aiStatus');
  if (aiBtn && aiStatus) {
    aiBtn.addEventListener('click', async function () {
      var topic = document.getElementById('postTitle').value;
      if (!topic) { aiStatus.textContent = 'Enter a title/topic first.'; return; }
      aiStatus.textContent = 'Generating draft with AI...';
      aiBtn.disabled = true;
      try {
        var res = await fetch('/admin/blog/ai-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic })
        });
        var data = await res.json();
        if (data.ok) {
          document.getElementById('postContent').value = data.content;
          var excerpt = document.querySelector('textarea[name="excerpt"]');
          if (excerpt && !excerpt.value) excerpt.value = data.excerpt;
          aiStatus.textContent = 'Draft generated — review before saving.';
        } else {
          aiStatus.textContent = data.error || 'AI draft failed.';
        }
      } catch (e) {
        aiStatus.textContent = 'Request failed: ' + e.message;
      }
      aiBtn.disabled = false;
    });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var targets = document.querySelectorAll('.grid > *, .timeline-item, .section-head, .tags, .stat');
  var heroEls = document.querySelectorAll('.hero-text > *, .hero-photo');
  var heroSet = new Set(Array.prototype.slice.call(heroEls));

  targets.forEach(function (el, i) {
    if (heroSet.has(el)) return;
    el.classList.add('reveal');
    el.style.transitionDelay = ((i % 8) * 60) + 'ms';
  });

  var revealAll = function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('revealed'); });
  };

  // Failsafe #1: reveal everything shortly after load, no matter what
  setTimeout(revealAll, 1200);

  // Failsafe #2: no IntersectionObserver support → show everything
  if (!('IntersectionObserver' in window)) { revealAll(); return; }

  // Normal path: reveal as elements scroll into view
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
});
