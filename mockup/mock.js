/* ============================================================
   Bachat — Mockup interactions (vanilla JS, no deps)
   Three behaviors:
     1. Segmented period switcher (Week / Biweek / Month)
     2. DNA streaming replay (fake typewriter)
     3. Modal open/close (invest Explain modal)
     4. Sidebar active-state helper based on location.pathname
   Everything else is static. No real data flows.
   ============================================================ */

(function () {
  'use strict';

  /* ---- 1. Segmented period switcher ---- */
  document.querySelectorAll('.segmented').forEach(function (group) {
    group.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('button').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        var label = group.getAttribute('data-label-target');
        if (label) {
          var target = document.querySelector(label);
          if (target) target.textContent = btn.textContent.toLowerCase();
        }
      });
    });
  });

  /* ---- 2. Sidebar active-state helper ---- */
  (function markActiveNav() {
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      var href = (item.getAttribute('href') || '').toLowerCase();
      if (!href) return;
      var target = href.split('/').pop();
      if (target === path) item.classList.add('active');
    });
  })();

  /* ---- 3. Modal open/close ---- */
  document.querySelectorAll('[data-modal-open]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var id = trigger.getAttribute('data-modal-open');
      var modal = document.getElementById(id);
      if (modal) modal.classList.add('open');
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      if (e.target !== trigger && e.target.closest('.modal') && !e.target.matches('[data-modal-close]')) return;
      var modal = trigger.closest('.modal-backdrop');
      if (modal) modal.classList.remove('open');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(function (m) {
        m.classList.remove('open');
      });
    }
  });

  /* ---- 4. DNA typewriter replay ---- */
  var DNA_SCRIPT = [
    'Analyzing 63 transactions across 90 days...\n',
    '\n',
    'Archetype: Night Owl Splurger\n',
    'Primary bias: Ego Depletion\n',
    '\n',
    'You tend to spend most between 9 and 11 PM on weeknights. ',
    '64% of your food-delivery orders land in that window, ',
    'costing you roughly $280/month more than your daytime ordering.\n',
    '\n',
    'This is not a willpower problem. After a long workday, your ',
    'mental willpower is genuinely drained — and DoorDash is the ',
    'path of least resistance. Not laziness. Depleted resources.\n',
    '\n',
    'Pattern: Late weeknight → Order DoorDash → $280/mo drain',
  ].join('');

  var typewriterBtn = document.querySelector('[data-typewriter]');
  var streamBox = document.querySelector('.stream-box');
  var streamStatus = document.querySelector('.stream-status');
  var streamComplete = document.querySelector('.stream-complete');

  function runTypewriter() {
    if (!streamBox) return;
    if (streamComplete) streamComplete.classList.add('hidden');
    streamBox.classList.remove('hidden');
    streamBox.innerHTML = '<span class="text-content"></span><span class="cursor"></span>';
    if (streamStatus) {
      streamStatus.classList.remove('hidden');
      streamStatus.innerHTML = '<span class="pulse"></span> Claude is analyzing...';
    }
    var textEl = streamBox.querySelector('.text-content');
    var i = 0;
    var interval = setInterval(function () {
      if (i >= DNA_SCRIPT.length) {
        clearInterval(interval);
        var cursor = streamBox.querySelector('.cursor');
        if (cursor) cursor.remove();
        if (streamStatus) streamStatus.classList.add('hidden');
        setTimeout(function () {
          streamBox.classList.add('hidden');
          if (streamComplete) streamComplete.classList.remove('hidden');
        }, 600);
        return;
      }
      textEl.textContent += DNA_SCRIPT[i];
      i++;
      streamBox.scrollTop = streamBox.scrollHeight;
    }, 18);
  }

  if (typewriterBtn) {
    typewriterBtn.addEventListener('click', runTypewriter);
  }

  /* ---- 5. Avatar dropdown ---- */
  document.querySelectorAll('.avatar-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      alert('Mockup: would open a user menu with Sign Out.');
    });
  });

  /* ---- 6. Form submit stubs ---- */
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.getAttribute('data-mock-message') || 'Mockup: submitted (no real action).';
      alert(msg);
    });
  });
})();
