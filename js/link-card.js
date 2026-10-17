(function () {
  const cardMarkup = `
    <div class="own-flink-card">
      <div class="flink-apply-heading">
        <span class="flink-apply-badge">本站名片</span>
        <h2>茫茫人海，很高兴能在这里相遇。</h2>
        <p>期待与你交换友链，共同记录生活。如果你愿意的话，欢迎带走属于我的这份小坐标：</p>
      </div>
      
      <div class="own-flink-panel">
        <div class="own-flink-avatar">
          <img src="/img/yoko.jpg" alt="sea of solitude 头像" class="no-lightbox">
        </div>
        <div class="own-flink-content">
          <div class="own-flink-row">
            <span class="own-flink-label">名称</span>
            <div class="own-flink-value-group">
              <span class="own-flink-value">sea of solitude</span>
              <button class="own-flink-copy" type="button" data-copy="sea of solitude">复制</button>
            </div>
          </div>
          <div class="own-flink-row">
            <span class="own-flink-label">链接</span>
            <div class="own-flink-value-group">
              <a class="own-flink-link" href="https://yuki12720.org/" target="_blank" rel="noopener noreferrer">https://yuki12720.org/</a>
              <button class="own-flink-copy" type="button" data-copy="https://yuki12720.org/">复制</button>
            </div>
          </div>
          <div class="own-flink-row">
            <span class="own-flink-label">简介</span>
            <div class="own-flink-value-group">
              <span class="own-flink-value">一个普通的生活博客</span>
              <button class="own-flink-copy" type="button" data-copy="一个普通的生活博客">复制</button>
            </div>
          </div>
          <div class="own-flink-row">
            <span class="own-flink-label">头像</span>
            <div class="own-flink-value-group">
              <a class="own-flink-link" href="/img/yoko.jpg" target="_blank" rel="noopener noreferrer">https://yuki12720.org/img/yoko.jpg</a>
              <button class="own-flink-copy" type="button" data-copy="https://yuki12720.org/img/yoko.jpg">复制</button>
            </div>
          </div>
          <div class="own-flink-actions">
            <a class="own-flink-action" href="/img/yoko.jpg" download="yoko.jpg">下载头像</a>
            <button class="own-flink-action own-flink-copy" type="button" data-copy="- name: sea of solitude&#10;  link: https://yuki12720.org/&#10;  avatar: https://yuki12720.org/img/yoko.jpg&#10;  desc: 一个普通的生活博客">复制 YAML</button>
          </div>
        </div>
      </div>
    </div>
  `

  const applyMarkup = `
    <div class="flink-apply-card">
      <div class="flink-apply-heading">
        <span class="flink-apply-badge">友链申请</span>
        <h2>如果你也想把自己的网站放到这里，可以填写这张申请表。</h2>
        <p>填好后麻烦复制到评论区，符合要求的话，我看到后会通过的。</p>
        <div class="flink-apply-rules">
          <div class="flink-apply-rules-title">申请前，希望您能了解一下这些小约定哦：</div>
          <ol class="flink-apply-rules-list">
            <li>申请前请先在贵站添加本站的链接。友谊需要共同维护，若后续您单方面移除了本站链接，我也会遗憾地将您的链接移出列表。</li>
            <li>期待您的网站内容合规合法，无政治敏感话题、恶意脚本或过多广告。如有转载文章，请务必注明出处。</li>
            <li>请确保您的站点已经全局开启 HTTPS 加密访问。</li>
            <li>本站目前仅接受个人博客的友链申请，暂不考虑商业站点或非个人网站，感谢您的理解。</li>
            <li>出于个人考量，暂不接受已在大陆备案的网站申请，十分抱歉。</li>
            <li>欢迎用心输出内容的博主，希望您的博客中已有不少于 5 篇的原创文章。</li>
          </ol>
        </div>
      </div>
      <form class="flink-apply-form" id="flink-apply-form">
        <div class="flink-apply-grid">
          <label class="flink-apply-field">
            <span>网站标题</span>
            <input type="text" name="name" placeholder="填写你的站点名字" required>
          </label>
          <label class="flink-apply-field">
            <span>网站链接</span>
            <input type="url" name="link" placeholder="https://example.com/" required>
          </label>
          <label class="flink-apply-field flink-apply-field--full">
            <span>网站描述</span>
            <input type="text" name="desc" placeholder="用一句话介绍一下你的站点" required>
          </label>
          <label class="flink-apply-field flink-apply-field--full">
            <span>头像链接</span>
            <input type="url" name="avatar" placeholder="粘贴能直接打开的头像链接" required>
          </label>
        </div>
        <div class="flink-apply-actions">
          <button class="flink-apply-action flink-apply-submit" type="submit">复制申请信息</button>
          <button class="flink-apply-action flink-apply-template own-flink-copy" type="button" data-copy="- name: 你的站点名&#10;  link: https://example.com/&#10;  avatar: https://example.com/avatar.jpg&#10;  desc: 用一句话介绍你的站点">复制空白模板</button>
        </div>
        <div class="flink-apply-status" aria-live="polite"></div>
      </form>
    </div>
  `

  const mountCard = (root) => {
    const scope = root || document
    const mountPoint = scope.querySelector('#own-flink-card-root')
    if (!mountPoint || mountPoint.dataset.ready === 'true') return
    mountPoint.innerHTML = cardMarkup
    mountPoint.dataset.ready = 'true'
  }

  const mountApplyForm = (root) => {
    const scope = root || document
    const mountPoint = scope.querySelector('#flink-apply-root')
    if (!mountPoint || mountPoint.dataset.ready === 'true') return
    mountPoint.innerHTML = applyMarkup
    mountPoint.dataset.ready = 'true'
  }

  const placeSections = (root) => {
    const scope = root || document
    const list = scope.querySelector('.flink-list')
    const desc = scope.querySelector('.flink > .flink-desc')
    const ownRoot = scope.querySelector('#own-flink-card-root')
    const applyRoot = scope.querySelector('#flink-apply-root')

    if (!list || !ownRoot || !applyRoot) return false

    if (desc) {
      desc.insertAdjacentElement('afterend', list)
    }
    list.insertAdjacentElement('afterend', ownRoot)
    ownRoot.insertAdjacentElement('afterend', applyRoot)
    return true
  }

  const bindCopyButtons = (root) => {
    const scope = root || document
    scope.querySelectorAll('.own-flink-copy').forEach((button) => {
      if (button.dataset.bound === 'true') return
      button.dataset.bound = 'true'

      button.addEventListener('click', async () => {
        const text = button.dataset.copy || ''
        if (!text) return

        const originalText = button.textContent

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text)
          } else {
            const textarea = document.createElement('textarea')
            textarea.value = text
            textarea.setAttribute('readonly', 'readonly')
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
          }

          button.textContent = '已复制'
        } catch (error) {
          console.debug('Copy failed:', error)
          button.textContent = '复制失败'
        }

        setTimeout(() => {
          button.textContent = originalText
        }, 1400)
      })
    })
  }

  const bindApplyForm = (root) => {
    const scope = root || document
    const form = scope.querySelector('#flink-apply-form')
    if (!form || form.dataset.bound === 'true') return
    form.dataset.bound = 'true'

    const status = form.querySelector('.flink-apply-status')
    const submitButton = form.querySelector('.flink-apply-submit')

    form.addEventListener('submit', async (event) => {
      event.preventDefault()

      const data = new FormData(form)
      const payload = {
        name: (data.get('name') || '').toString().trim(),
        link: (data.get('link') || '').toString().trim(),
        desc: (data.get('desc') || '').toString().trim(),
        avatar: (data.get('avatar') || '').toString().trim()
      }

      if (!payload.name || !payload.link || !payload.desc || !payload.avatar) {
        status.textContent = '还有内容没填完整喔。'
        return
      }

      const message = [
        '友链申请：',
        '',
        `- name: ${payload.name}`,
        `  link: ${payload.link}`,
        `  avatar: ${payload.avatar}`,
        `  desc: ${payload.desc}`
      ].join('\n')

      const originalText = submitButton.textContent

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(message)
        } else {
          const textarea = document.createElement('textarea')
          textarea.value = message
          textarea.setAttribute('readonly', 'readonly')
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }

        status.textContent = '申请信息已经复制好了，直接粘贴到本页评论区就行。'
        submitButton.textContent = '已复制'

        const comment = document.querySelector('#post-comment')
        if (comment) {
          comment.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } catch (error) {
        console.debug('Apply form copy failed:', error)
        status.textContent = '复制失败了，可以稍后再试一次。'
        submitButton.textContent = '复制失败'
      }

      setTimeout(() => {
        submitButton.textContent = originalText
      }, 1400)
    })
  }

  const schedulePlacement = (root) => {
    const scope = root || document
    const attempts = [0, 60, 180, 360]
    attempts.forEach((delay) => {
      window.setTimeout(() => {
        placeSections(scope)
      }, delay)
    })

    const observer = new MutationObserver(() => {
      if (placeSections(scope)) {
        observer.disconnect()
      }
    })

    const target = scope.querySelector('.flink') || document.body
    observer.observe(target, { childList: true, subtree: true })

    window.setTimeout(() => observer.disconnect(), 3000)
  }

  const init = (root) => {
    mountCard(root)
    mountApplyForm(root)
    bindCopyButtons(root)
    bindApplyForm(root)
    schedulePlacement(root)
  }

  window.initOwnFlinkCard = init

  init(document)
  document.addEventListener('pjax:complete', () => init(document))
})()
