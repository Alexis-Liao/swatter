(function () {
  if (!document.getElementById('bubble-fx-styles')) {
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
        z-index: 50;
        pointer-events: none;
        overflow: visible;
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
        border-color: rgba(126, 200, 212, 0.45);
        box-shadow:
          0 0 10px rgba(94, 196, 212, 0.22),
          inset 0 0 12px rgba(255, 255, 255, 0.14);
        animation: bubble-rise linear forwards, bubble-pulse 2.4s ease-in-out infinite;
      }

      .bubble-fx.poppable:hover {
        filter: brightness(1.15);
        border-color: rgba(94, 196, 212, 0.65);
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
        z-index: 60;
        animation: bubble-pop-ring 0.45s ease-out forwards;
      }

      @keyframes bubble-rise {
        0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
        8% { opacity: 1; }
        100% { transform: translateY(-110vh) translateX(var(--drift, 24px)) scale(1.08); opacity: 0; }
      }

      @keyframes bubble-pulse {
        0%, 100% { box-shadow: 0 0 10px rgba(94, 196, 212, 0.22), inset 0 0 12px rgba(255, 255, 255, 0.14); }
        50% { box-shadow: 0 0 16px rgba(94, 196, 212, 0.38), inset 0 0 14px rgba(255, 255, 255, 0.2); }
      }

      @keyframes bubble-pop-ring {
        0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.85; }
        100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  const POP_MIN = 14;
  var popListeners = [];
  var boundInteractiveLayers = typeof WeakSet !== 'undefined' ? new WeakSet() : null;

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function resolveInteractiveLayer(interactiveContainer) {
    if (interactiveContainer && interactiveContainer.appendChild) return interactiveContainer;
    var el = document.getElementById('bubblesInteractive');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'bubblesInteractive';
    el.className = 'bubbles-interactive';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    bindInteractiveLayer(el);
    return el;
  }

  function findPoppableAt(x, y) {
    var layers = document.querySelectorAll('.bubbles-interactive');
    for (var l = 0; l < layers.length; l++) {
      var bubbles = layers[l].querySelectorAll('.bubble-fx.poppable:not(.popped)');
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        var r = b.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var radius = Math.max(r.width, r.height) * 0.65;
        if (Math.hypot(x - cx, y - cy) <= radius) return b;
      }
    }
    return null;
  }

  function bindInteractiveLayer(layer) {
    if (!layer) return;
    if (boundInteractiveLayers) {
      if (boundInteractiveLayers.has(layer)) return;
      boundInteractiveLayers.add(layer);
    } else if (layer.dataset.popBound) {
      return;
    } else {
      layer.dataset.popBound = '1';
    }

    function handlePointer(e) {
      var bubble = e.target.closest
        ? e.target.closest('.bubble-fx.poppable:not(.popped)')
        : null;
      if (!bubble) bubble = findPoppableAt(e.clientX, e.clientY);
      if (!bubble) return;
      e.preventDefault();
      e.stopPropagation();
      popBubble(bubble);
    }

    layer.addEventListener('pointerup', handlePointer);
    layer.addEventListener('click', handlePointer);
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

    var target = container;
    if (isPoppable) {
      target = resolveInteractiveLayer(interactiveContainer);
      bindInteractiveLayer(target);
    }
    target.appendChild(bubble);

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
      var layer = resolveInteractiveLayer(interactiveContainer);
      bindInteractiveLayer(layer);
      for (var i = 0; i < count; i++) {
        createBubble(container, layer, {
          size: Math.random() < 0.45 ? random(POP_MIN, 32) : random(5, POP_MIN - 1),
          delay: random(0, 12),
        });
      }
    },

    spawn: function (container, x, y, count, interactiveContainer) {
      if (!container) return;
      var layer = resolveInteractiveLayer(interactiveContainer);
      bindInteractiveLayer(layer);
      count = count || 1;
      for (var i = 0; i < count; i++) {
        var size = Math.random() < 0.45 ? random(POP_MIN, 28) : random(6, POP_MIN - 1);
        var startX = x != null ? x + random(-40, 40) : random(0, window.innerWidth);
        var startY = y != null ? y : window.innerHeight + 10;
        createBubble(container, layer, {
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

  var existing = document.getElementById('bubblesInteractive');
  if (existing) bindInteractiveLayer(existing);
})();
