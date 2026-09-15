(() => {
  const COLLAPSE_STORAGE_KEY = 'aplayer-collapsed';

  function setCollapsedState(container, collapsed) {
    container.classList.toggle('aplayer-collapsed', collapsed);

    const toggle = container.querySelector('.aplayer-collapse-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      toggle.setAttribute('title', collapsed ? '展开播放器' : '折叠播放器');
      toggle.innerHTML = collapsed ? '‹' : '›';
    }

    localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? 'true' : 'false');
  }

  function ensureCollapseToggle(container) {
    if (container.querySelector('.aplayer-collapse-toggle')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'aplayer-collapse-toggle';
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setCollapsedState(container, !container.classList.contains('aplayer-collapsed'));
    });

    container.appendChild(toggle);
  }

  function bindCollapseInteractions(container) {
    if (container.dataset.collapseReady === 'true') return;
    container.dataset.collapseReady = 'true';

    ensureCollapseToggle(container);

    const savedCollapsed = localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    setCollapsedState(container, savedCollapsed);
  }

  window.addEventListener('load', () => {
    const container = document.getElementById('aplayer');
    if (!container) return;

    window.aplayerInstance = new APlayer({
      container,
      fixed: false,
      autoplay: false,
      theme: '#fe7300',
      lrcType: 1,
      audio: [{
        name: '海の影',
        artist: 'MANYO',
        url: '/music/MANYO - 海の影.mp3',
        cover: '/music/hikari.png',

      }]
    });

    window.aplayerInstance.on('play', function () {
      container.classList.add('is-playing');
    });
    window.aplayerInstance.on('pause', function () {
      container.classList.remove('is-playing');
    });

    bindCollapseInteractions(container);

    setTimeout(() => {
      const lrcText = container.querySelector('.aplayer-lrc p');
      if (!lrcText || /not available/i.test(lrcText.textContent || '')) {
        container.classList.add('aplayer-no-lrc');
      }
    }, 120);
  });
})();

// =========================================================
// APlayer 滚动浮现效果 - 监听滚动控制显示与隐藏
// =========================================================
document.addEventListener('DOMContentLoaded', function () {
  const player = document.getElementById('aplayer');
  if (!player) return;

  // 监听滚动
  window.addEventListener('scroll', function () {
    // 获取当前滚动高度
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    // 获取屏幕视口高度
    const windowHeight = window.innerHeight;
    
    // 如果滚动距离超过屏幕高度的 60%，则显示播放器
    if (scrollTop > windowHeight * 0.6) {
      player.classList.add('aplayer-show');
    } else {
      player.classList.remove('aplayer-show');
    }
  });
});
