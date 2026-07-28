(function () {
  if (document.getElementById('bubble-fx-styles')) return;

  const style = document.createElement('style');
  style.id = 'bubble-fx-styles';
  style.textContent = `
    .bubbles-layer,
    .bubbles {
      pointer-events: none;
    }

    .bubbles-interactive {
      position: fixed;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      overflow: hidden;
    }

    .bubble-fx {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.32), rgba(126,200,212,0.07));
      border: 1px solid rgba(126, 200, 212, 0.18);
      pointer-events: none;
      touch-action: manipulation;
    }

    .bubble-fx.rise {
      animation: bubble-rise linear forwards;
    }

    .bubble-fx.poppable {
      pointer-events: auto;
      cursor: pointer;
      border-color: rgba(126, 200, 212, 0.35);
      box-shadow:
        0 0 8px rgba(94, 196, 212, 0.15),
        inset 0 0 12px rgba(255, 255, 255, 0.12);
    }

    .bubble-fx.poppable:hover {
      filter: brightness(1.12);
      border-color: rgba(94, 196, 212, 0.55);
    }

    .bubble-fx.popped {
      animation: none !important;
      pointer-events: none;
      opacity: 0;
      transform: scale(1.7);
      transition: transform 0.22s ease-out, opacity 0.22s ease-out;
    }

    .bubble-pop-splash {
      position: fixed;
      border-radius: 50%;
      border: 2px solid rgba(126, 200, 212, 0.55);
      pointer-events: none;
      z-index: 50;
      animation: bubble-pop-ring 0.45s ease-out forwards;
    }

    @keyframes bubble-rise {
      0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
      8% { opacity: 1; }
      100% { transform: translateY(-110vh) translateX(var(--drift, 24px)) scale(1.08); opacity: 0; }
    }

    @keyframes bubble-pop-ring {
      0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.85; }
      100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  const POP_MIN = 14;
  var popListeners = [];

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function popBubble(bubble) {
    if (!bubble || bubble.classList.contains('popped')) return;

    const rect = bubble.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const splash = document.createElement('span');
    splash.className = 'bubble-pop-splash';
    splash.style.width = splash.style.height = Math.max(rect.width * 1.6, 20) + 'px';
    splash.style.left = cx + 'px';
    splash.style.top = cy + 'px';
    document.body.appendChild(splash);
    setTimeout(function () { splash.remove(); }, 500);

    bubble.classList.add('popped');
    setTimeout(function () { bubble.remove(); }, 260);

    popListeners.forEach(function (fn) {
      fn({ bubble: bubble, x: cx, y: cy });
    });
  }

  function attachPopHandler(bubble) {
    if (!bubble.classList.contains('poppable')) return;

    function handler(e) {
      e.preventDefault();
      e.stopPropagation();
      popBubble(bubble);
    }

    bubble.addEventListener('click', handler);
    bubble.addEventListener('touchend', function (e) {
      handler(e);
    }, { passive: false });
  }

  function createBubble(container, interactiveContainer, options) {
    options = options || {};
    const bubble = document.createElement('div');
    bubble.className = 'bubble-fx rise';

    const size = options.size != null ? options.size : random(5, 28);
    const isPoppable = size >= POP_MIN;
    if (isPoppable) bubble.classList.add('poppable');

    const duration = options.duration != null ? options.duration : random(6, 14);
    const delay = options.delay != null ? options.delay : random(0, 10);
    const drift = options.drift != null ? options.drift : random(-30, 30) + 'px';

    if (options.x != null && options.y != null) {
      bubble.style.left = options.x + 'px';
      bubble.style.top = options.y + 'px';
    } else {
      bubble.style.left = random(0, 100) + '%';
      bubble.style.bottom = '-24px';
    }

    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.setProperty('--drift', drift);
    bubble.style.animationDuration = duration + 's';
    bubble.style.animationDelay = delay + 's';

    var target = isPoppable && interactiveContainer ? interactiveContainer : container;
    target.appendChild(bubble);
    attachPopHandler(bubble);

    const lifetime = (duration + delay) * 1000 + 500;
    setTimeout(function () {
      if (bubble.parentNode && !bubble.classList.contains('popped')) {
        bubble.remove();
      }
    }, lifetime);

    return bubble;
  }

  window.BubbleFX = {
    initAmbient: function (container, count, interactiveContainer) {
      if (!container) return;
      for (var i = 0; i < count; i++) {
        createBubble(container, interactiveContainer, {
          size: Math.random() < 0.35 ? random(POP_MIN, 32) : random(5, POP_MIN - 1),
          delay: random(0, 12),
        });
      }
    },

    spawn: function (container, x, y, count, interactiveContainer) {
      if (!container) return;
      count = count || 1;
      for (var i = 0; i < count; i++) {
        var size = Math.random() < 0.4 ? random(POP_MIN, 28) : random(6, POP_MIN - 1);
        var startX = x != null ? x + random(-40, 40) : random(0, window.innerWidth);
        var startY = y != null ? y : window.innerHeight + 10;
        createBubble(container, interactiveContainer, {
          size: size,
          x: startX,
          y: startY,
          duration: random(3, 7),
          delay: 0,
        });
      }
    },

    pop: popBubble,

    onPop: function (fn) {
      if (typeof fn === 'function') popListeners.push(fn);
    },
  };
})();
