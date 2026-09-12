(() => {
  const PLAYLAB_VERSION = 'v1';
  const WAIT_AFTER_DRAW_MS = 80;
  const MAX_FAVORITES = 18;
  const MAX_TRAIL = 12;
  const RARE_EVENT_RATE = 0.09;

  const CONFIG = {
    gal: {
      label: 'GAL',
      drawFn: 'getRandomGame',
      selectors: {
        title: '#gameTitle',
        rating: '#ratingScore',
        description: '#gameDescription',
        image: '#gameBanner',
        link: '#vndbLink',
        tags: '#gameTags .tag'
      },
      presets: [
        { key: 'balanced', label: '稳一点', filters: { ratingFilter: '7-8' } },
        { key: 'newwave', label: '新一点', filters: { yearFilter: ['2025', '2024', '2023'] } },
        { key: 'nostalgia', label: '旧一点', filters: { yearFilter: ['2010s', '2000s', 'classic'] } },
        { key: 'cn', label: '中文友好', filters: { langFilter: ['zh-Hans', 'zh-Hant'], ratingFilter: ['7-8', '8-9'] } },
        { key: 'chaos', label: '乱一点', filters: { ratingFilter: ['', '6-7', '7-8', '8-9'], yearFilter: ['', 'classic', '2000s', '2010s', '2024'] } }
      ],
      rareEvents: [
        {
          title: '异常信号',
          text: '这一轮的波形有点歪，但也许正因为歪，才会让人记住。'
        },
        {
          title: '深夜回响',
          text: '观测器捕到一条轻微的回声，今晚的口味比平时更偏一点。'
        },
        {
          title: '低概率命中',
          text: '不是保底池，也不是标准答案，偏偏就这样撞上了。'
        }
      ]
    },
    anime: {
      label: '动画',
      drawFn: 'getRandomAnime',
      selectors: {
        title: '#animeTitle',
        titleAlt: '#animeTitleCn',
        rating: '#ratingScore',
        description: '#animeDescription',
        image: '#animeBanner',
        link: '#bangumiLink',
        tags: '#animeTags .tag'
      },
      presets: [
        { key: 'balanced', label: '稳一点', filters: { ratingFilter: '7-8' } },
        { key: 'newwave', label: '新一点', filters: { yearFilter: ['2025', '2024', '2023'], formatFilter: ['', 'TV', 'Web'] } },
        { key: 'nostalgia', label: '旧一点', filters: { yearFilter: ['2000s', '1990s', '1980s', 'classic'] } },
        { key: 'mood', label: '情绪一点', filters: { tagFilter: ['治愈', '日常', '悬疑', '青春', '音乐'] } },
        { key: 'chaos', label: '乱一点', filters: { ratingFilter: ['', '6-7', '7-8', '8-9'], tagFilter: ['', '热血', '悬疑', '百合', '奇幻', '心理'] } }
      ],
      rareEvents: [
        {
          title: '异常波段',
          text: '今天的信号里混进了点杂质，但也正因此更像一次真正的偶遇。'
        },
        {
          title: '短暂偏航',
          text: '路线没有完全按主航道走，不过偏航不一定是坏事。'
        },
        {
          title: '罕见共振',
          text: '你刚好点到了低概率支线，这类结果通常会更耐回味。'
        }
      ]
    }
  };

  function readStorage(key, fallbackValue) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
      return fallbackValue;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('玩法实验室写入缓存失败:', error);
    }
  }

  function randomPick(list) {
    if (!Array.isArray(list)) return list;
    return list[Math.floor(Math.random() * list.length)];
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function clampText(text, maxLength) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }

  function getStateKey(kind) {
    return `randomPlaylab.${kind}.${PLAYLAB_VERSION}`;
  }

  function getDefaultState() {
    return {
      activePreset: 'balanced',
      totalDraws: 0,
      streakRuns: 0,
      duelRuns: 0,
      pairRuns: 0,
      wanderSteps: 0,
      rareHits: 0,
      favorites: [],
      trail: [],
      tasteTags: {}
    };
  }

  function loadState(kind) {
    return {
      ...getDefaultState(),
      ...readStorage(getStateKey(kind), {})
    };
  }

  function saveState(kind, state) {
    writeStorage(getStateKey(kind), state);
  }

  function applyPreset(config, state) {
    const preset = config.presets.find(item => item.key === state.activePreset) || config.presets[0];
    if (!preset) return;

    Object.entries(preset.filters).forEach(([filterId, value]) => {
      const target = document.getElementById(filterId);
      if (!target) return;
      target.value = Array.isArray(value) ? randomPick(value) : value;
    });
  }

  function scrapeCurrentItem(config) {
    const titleNode = document.querySelector(config.selectors.title);
    const ratingNode = document.querySelector(config.selectors.rating);
    const descriptionNode = document.querySelector(config.selectors.description);
    const imageNode = document.querySelector(config.selectors.image);
    const linkNode = document.querySelector(config.selectors.link);

    if (!titleNode || !linkNode || !linkNode.href) {
      return null;
    }

    const titleAltNode = config.selectors.titleAlt ? document.querySelector(config.selectors.titleAlt) : null;
    const tags = Array.from(document.querySelectorAll(config.selectors.tags)).map(tag => tag.textContent.trim()).filter(Boolean);
    const identifierMatch = linkNode.href.match(/(\d+)(?:\/)?$/);

    return {
      id: identifierMatch ? identifierMatch[1] : linkNode.href,
      title: titleNode.textContent.trim(),
      titleAlt: titleAltNode ? titleAltNode.textContent.trim() : '',
      rating: ratingNode ? ratingNode.textContent.trim() : '',
      description: descriptionNode ? clampText(descriptionNode.textContent, 110) : '',
      image: imageNode?.currentSrc || imageNode?.src || '',
      link: linkNode.href,
      tags,
      createdAt: new Date().toISOString()
    };
  }

  function addTrailEntry(state, item, source) {
    const nextTrail = [
      { ...item, source },
      ...state.trail.filter(entry => entry.id !== item.id)
    ].slice(0, MAX_TRAIL);
    state.trail = nextTrail;
  }

  function saveFavorite(state, item) {
    if (!item) return false;
    const exists = state.favorites.some(entry => entry.id === item.id);
    if (exists) return false;

    state.favorites = [
      item,
      ...state.favorites
    ].slice(0, MAX_FAVORITES);
    return true;
  }

  function registerTaste(state, item) {
    (item.tags || []).slice(0, 6).forEach(tag => {
      state.tasteTags[tag] = (state.tasteTags[tag] || 0) + 1;
    });
  }

  function maybeTriggerRareEvent(config, state) {
    if (Math.random() >= RARE_EVENT_RATE) return null;
    state.rareHits += 1;
    return randomPick(config.rareEvents);
  }

  function getAchievements(state) {
    const badges = [];
    if (state.totalDraws >= 1) badges.push('初次试波');
    if (state.totalDraws >= 10) badges.push('连续观测');
    if (state.streakRuns >= 2) badges.push('连抽上头');
    if (state.duelRuns >= 2) badges.push('二选一困难');
    if (state.favorites.length >= 3) badges.push('收藏癖');
    if (state.rareHits >= 1) badges.push('异常接触');
    if (state.wanderSteps >= 5) badges.push('漫游成瘾');
    return badges;
  }

  function renderMiniCard(item, options = {}) {
    return `
      <div class="playlab-mini-card">
        <img src="${item.image || ''}" alt="${item.title}">
        <div>
          <h4>${item.title}</h4>
          <div class="playlab-meta-line">${options.prefix ? `${options.prefix} · ` : ''}${item.rating || 'N/A'} 分${item.titleAlt ? ` · ${item.titleAlt}` : ''}</div>
          <div class="playlab-meta-line">${item.description || '这次抽到的是一条暂时没写太多简介的信号。'}</div>
          <div class="playlab-mini-actions">
            ${options.choose ? `<button type="button" data-choice-id="${item.id}">选这个</button>` : ''}
            ${options.save ? `<button type="button" data-save-id="${item.id}">收藏</button>` : ''}
            <a href="${item.link}" target="_blank" rel="noopener">查看详情</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderTrailList(state) {
    if (!state.trail.length) {
      return '<div class="playlab-empty">还没开始漫游。<br>先连抽、对决或继续漫游一次看看。</div>';
    }

    return state.trail.map((item, index) => `
      <div class="playlab-trail-item">
        <img src="${item.image || ''}" alt="${item.title}">
        <div>
          <h4>${index + 1}. ${item.title}</h4>
          <div class="playlab-meta-line">${item.source || '实验室记录'} · ${item.rating || 'N/A'} 分</div>
          <div class="playlab-meta-line">${item.description || '这条路径还没留下太多注释。'}</div>
        </div>
      </div>
    `).join('');
  }

  function renderFavorites(state) {
    if (!state.favorites.length) {
      return '<div class="playlab-empty">收藏架还是空的。<br>碰到喜欢的结果后，可以把它留下来。</div>';
    }

    return state.favorites.map(item => `
      <div class="playlab-mini-card">
        <img src="${item.image || ''}" alt="${item.title}">
        <div>
          <h4>${item.title}</h4>
          <div class="playlab-meta-line">${item.rating || 'N/A'} 分${item.titleAlt ? ` · ${item.titleAlt}` : ''}</div>
          <div class="playlab-meta-line">${item.description || '这一条你之前已经留了下来。'}</div>
          <div class="playlab-mini-actions">
            <button type="button" data-open-favorite="${item.id}">重新看看</button>
            <button type="button" data-remove-favorite="${item.id}">移出收藏</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderProfile(state) {
    const topTags = Object.entries(state.tasteTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return topTags.length
      ? `<p>你最近更容易留下来的口味，大致偏向这些标签：</p>
         <div class="playlab-profile-tags">${topTags.map(([tag, count]) => `<span>${tag} × ${count}</span>`).join('')}</div>`
      : '<div class="playlab-empty">还没积累出明显口味。先对决几轮，实验室才会知道你偏向哪边。</div>';
  }

  function renderCounters(container, state) {
    container.querySelector('[data-role="counters"]').innerHTML = `
      <div class="playlab-counter"><strong>${state.totalDraws}</strong><span>总抽取次数</span></div>
      <div class="playlab-counter"><strong>${state.streakRuns}</strong><span>连抽轮数</span></div>
      <div class="playlab-counter"><strong>${state.duelRuns}</strong><span>对决轮数</span></div>
      <div class="playlab-counter"><strong>${state.rareHits}</strong><span>异常事件</span></div>
    `;

    const achievements = getAchievements(state);
    container.querySelector('[data-role="achievements"]').innerHTML = achievements.length
      ? achievements.map(text => `<span class="playlab-badge">${text}</span>`).join('')
      : '<span class="playlab-badge">先来一轮实验</span>';
  }

  function renderState(container, config, state) {
    renderCounters(container, state);
    container.querySelector('[data-role="favorites"]').innerHTML = renderFavorites(state);
    container.querySelector('[data-role="trail"]').innerHTML = renderTrailList(state);
    container.querySelector('[data-role="profile"]').innerHTML = renderProfile(state);

    const activePresetNode = container.querySelector('[data-role="preset-note"]');
    const activePreset = config.presets.find(item => item.key === state.activePreset) || config.presets[0];
    activePresetNode.textContent = `当前调频路线：${activePreset.label}`;

    container.querySelectorAll('[data-preset-key]').forEach(button => {
      button.classList.toggle('active', button.dataset.presetKey === state.activePreset);
    });
  }

  function setBusy(container, isBusy) {
    container.dataset.busy = isBusy ? '1' : '0';
    container.querySelectorAll('.playlab-action, .playlab-soft-btn, .playlab-chip').forEach(button => {
      button.disabled = isBusy && !button.dataset.allowWhileBusy;
    });
  }

  async function drawOne(config, state, sourceLabel) {
    applyPreset(config, state);
    const drawFn = window[config.drawFn];
    if (typeof drawFn !== 'function') {
      throw new Error('页面随机函数尚未就绪');
    }

    await drawFn();
    await sleep(WAIT_AFTER_DRAW_MS);
    const item = scrapeCurrentItem(config);
    if (!item) {
      throw new Error('没有抓到本轮结果');
    }

    state.totalDraws += 1;
    addTrailEntry(state, item, sourceLabel);
    return item;
  }

  function renderEvent(container, rareEvent) {
    const target = container.querySelector('[data-role="event"]');
    target.innerHTML = rareEvent
      ? `<div class="playlab-event-box"><strong>${rareEvent.title}</strong>${rareEvent.text}</div>`
      : '<div class="playlab-empty">这里会记录低概率异常事件。<br>多玩几轮，也许就能碰到一条不太一样的支线。</div>';
  }

  function renderCards(container, role, cards, options = {}) {
    const target = container.querySelector(`[data-role="${role}"]`);
    if (!cards.length) {
      target.innerHTML = '<div class="playlab-empty">这块暂时还没有结果。</div>';
      return;
    }

    target.innerHTML = `<div class="playlab-card-stack">${cards.map((item, index) => renderMiniCard(item, { ...options, prefix: options.prefixes ? options.prefixes[index] : options.prefix })).join('')}</div>`;
  }

  async function runStreak(container, config, state) {
    setBusy(container, true);
    try {
      const results = [];
      for (let index = 0; index < 3; index += 1) {
        const item = await drawOne(config, state, '连续观测');
        results.push(item);
      }
      state.streakRuns += 1;
      const rareEvent = maybeTriggerRareEvent(config, state);
      renderCards(container, 'streak', results, { save: true, prefix: '连抽结果' });
      renderEvent(container, rareEvent);
      saveState(container.dataset.kind, state);
      renderState(container, config, state);
    } finally {
      setBusy(container, false);
    }
  }

  async function runDuel(container, config, state) {
    setBusy(container, true);
    try {
      const left = await drawOne(config, state, '对决左位');
      let right = await drawOne(config, state, '对决右位');
      let retry = 0;
      while (right.id === left.id && retry < 2) {
        right = await drawOne(config, state, '对决右位');
        retry += 1;
      }
      state.duelRuns += 1;
      container.querySelector('[data-role="duel"]').innerHTML = `
        <div class="playlab-duel-board">
          ${renderMiniCard(left, { choose: true })}
          ${renderMiniCard(right, { choose: true })}
        </div>
      `;
      container._duelMap = {
        [left.id]: left,
        [right.id]: right
      };
      const rareEvent = maybeTriggerRareEvent(config, state);
      renderEvent(container, rareEvent);
      saveState(container.dataset.kind, state);
      renderState(container, config, state);
    } finally {
      setBusy(container, false);
    }
  }

  async function runPair(container, config, state) {
    setBusy(container, true);
    try {
      const first = await drawOne(config, state, '搭子主位');
      let second = await drawOne(config, state, '搭子副位');
      let retry = 0;
      while (second.id === first.id && retry < 2) {
        second = await drawOne(config, state, '搭子副位');
        retry += 1;
      }
      state.pairRuns += 1;
      container.querySelector('[data-role="pair"]').innerHTML = `
        <div class="playlab-pair-board">
          ${renderMiniCard(first, { save: true, prefix: '主卡' })}
          ${renderMiniCard(second, { save: true, prefix: '搭子' })}
        </div>
      `;
      const rareEvent = maybeTriggerRareEvent(config, state);
      renderEvent(container, rareEvent);
      saveState(container.dataset.kind, state);
      renderState(container, config, state);
    } finally {
      setBusy(container, false);
    }
  }

  async function runWander(container, config, state) {
    setBusy(container, true);
    try {
      await drawOne(config, state, '继续漫游');
      state.wanderSteps += 1;
      const rareEvent = maybeTriggerRareEvent(config, state);
      renderEvent(container, rareEvent);
      saveState(container.dataset.kind, state);
      renderState(container, config, state);
    } finally {
      setBusy(container, false);
    }
  }

  function drawFromFavorites(container, state) {
    const target = container.querySelector('[data-role="event"]');
    if (!state.favorites.length) {
      target.innerHTML = '<div class="playlab-empty">收藏架还是空的，暂时抽不出回响。</div>';
      return;
    }

    const picked = randomPick(state.favorites);
    target.innerHTML = `<div class="playlab-event-box"><strong>收藏回响</strong>这次从你留住的信号里翻出来的是 <strong>${picked.title}</strong>。<br><a href="${picked.link}" target="_blank" rel="noopener">重新打开它</a></div>`;
  }

  function buildMarkup(config) {
    const presetButtons = config.presets.map(preset => `
      <button class="playlab-chip" type="button" data-preset-key="${preset.key}">
        ${preset.label}
      </button>
    `).join('');

    return `
      <div class="playlab-header">
        <div>
          <div class="playlab-kicker">PLAYLAB MODE</div>
          <h2 class="playlab-title">玩法实验室</h2>
        </div>
        <div class="playlab-note">
          这一块是给 <strong>${config.label}</strong> 页额外挂上的试验性玩法区。
          它会把随机抽取变成连续互动：连抽、对决、搭子配对、漫游、收藏回响都会留在这里。
        </div>
      </div>
      <div class="playlab-grid">
        <section class="playlab-panel actions">
          <h3>调频路线</h3>
          <p data-role="preset-note"></p>
          <div class="playlab-route-chips">${presetButtons}</div>
          <div class="playlab-action-buttons" style="margin-top: 14px;">
            <button class="playlab-action" type="button" data-action="streak">连续观测 ×3</button>
            <button class="playlab-action secondary" type="button" data-action="duel">随机对决</button>
            <button class="playlab-action secondary" type="button" data-action="pair">搭子配对</button>
            <button class="playlab-action" type="button" data-action="wander">继续漫游</button>
          </div>
        </section>
        <section class="playlab-panel insight">
          <h3>实验记录</h3>
          <div class="playlab-counters" data-role="counters"></div>
          <div class="playlab-achievements" data-role="achievements"></div>
        </section>
        <section class="playlab-panel playlab-event">
          <h3>异常信号</h3>
          <div data-role="event"></div>
        </section>
        <section class="playlab-panel playlab-profile">
          <h3>口味画像</h3>
          <div data-role="profile"></div>
        </section>
        <div class="playlab-output">
          <section class="playlab-panel playlab-card-list">
            <h3>连续观测</h3>
            <div data-role="streak"></div>
          </section>
          <section class="playlab-panel playlab-duel">
            <h3>随机对决</h3>
            <div data-role="duel"></div>
          </section>
          <section class="playlab-panel playlab-pair">
            <h3>搭子配对</h3>
            <div data-role="pair"></div>
          </section>
          <section class="playlab-panel playlab-trail">
            <h3>漫游路径</h3>
            <div class="playlab-trail-list" data-role="trail"></div>
          </section>
          <section class="playlab-panel playlab-favorites">
            <h3>收藏架</h3>
            <div class="playlab-favorite-actions" style="margin-bottom: 12px;">
              <button class="playlab-soft-btn" type="button" data-action="save-current">收藏当前结果</button>
              <button class="playlab-soft-btn" type="button" data-action="favorite-draw">收藏回响</button>
            </div>
            <div class="playlab-favorite-list" data-role="favorites"></div>
          </section>
        </div>
      </div>
    `;
  }

  function bindContainerEvents(container, config, state) {
    container.addEventListener('click', async event => {
      const presetButton = event.target.closest('[data-preset-key]');
      if (presetButton) {
        state.activePreset = presetButton.dataset.presetKey;
        saveState(container.dataset.kind, state);
        renderState(container, config, state);
        return;
      }

      const actionButton = event.target.closest('[data-action]');
      if (actionButton) {
        const action = actionButton.dataset.action;
        if (action === 'streak') await runStreak(container, config, state);
        if (action === 'duel') await runDuel(container, config, state);
        if (action === 'pair') await runPair(container, config, state);
        if (action === 'wander') await runWander(container, config, state);
        if (action === 'save-current') {
          const current = scrapeCurrentItem(config);
          if (current && saveFavorite(state, current)) {
            saveState(container.dataset.kind, state);
            renderState(container, config, state);
          }
        }
        if (action === 'favorite-draw') {
          drawFromFavorites(container, state);
        }
        return;
      }

      const saveButton = event.target.closest('[data-save-id]');
      if (saveButton) {
        const currentId = saveButton.dataset.saveId;
        const allItems = [
          ...state.favorites,
          ...state.trail,
          ...(container._duelMap ? Object.values(container._duelMap) : [])
        ];
        const item = allItems.find(entry => entry.id === currentId);
        if (item && saveFavorite(state, item)) {
          saveState(container.dataset.kind, state);
          renderState(container, config, state);
        }
        return;
      }

      const choiceButton = event.target.closest('[data-choice-id]');
      if (choiceButton && container._duelMap) {
        const picked = container._duelMap[choiceButton.dataset.choiceId];
        if (picked) {
          registerTaste(state, picked);
          saveFavorite(state, picked);
          container.querySelector('[data-role="event"]').innerHTML = `<div class="playlab-event-box"><strong>口味确认</strong>这次你站在了 <strong>${picked.title}</strong> 这一边。实验室会慢慢记住你的偏好。</div>`;
          saveState(container.dataset.kind, state);
          renderState(container, config, state);
        }
        return;
      }

      const favoriteOpenButton = event.target.closest('[data-open-favorite]');
      if (favoriteOpenButton) {
        const picked = state.favorites.find(entry => entry.id === favoriteOpenButton.dataset.openFavorite);
        if (picked) {
          window.open(picked.link, '_blank', 'noopener');
        }
        return;
      }

      const favoriteRemoveButton = event.target.closest('[data-remove-favorite]');
      if (favoriteRemoveButton) {
        state.favorites = state.favorites.filter(entry => entry.id !== favoriteRemoveButton.dataset.removeFavorite);
        saveState(container.dataset.kind, state);
        renderState(container, config, state);
      }
    });
  }

  function initContainer(container) {
    if (container.dataset.playlabReady === '1') {
      return;
    }

    const kind = container.dataset.kind;
    const config = CONFIG[kind];
    if (!config) {
      return;
    }

    const state = loadState(kind);
    container.innerHTML = buildMarkup(config);
    bindContainerEvents(container, config, state);
    renderEvent(container, null);
    renderState(container, config, state);
    renderCards(container, 'streak', []);
    renderCards(container, 'duel', []);
    renderCards(container, 'pair', []);
    container.dataset.playlabReady = '1';
  }

  function initRandomPlaylab() {
    document.querySelectorAll('.random-playlab').forEach(initContainer);
  }

  window.initRandomPlaylab = initRandomPlaylab;
  initRandomPlaylab();
})();
