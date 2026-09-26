'use strict'

;(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.RandomPostCard = api
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function formatDate(post) {
    if (post?.date) {
      const date = new Date(post.date)
      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    }

    const matched = String(post?.path || '').match(/\/(\d{4})\/(\d{2})\/(\d{2})\//)
    return matched ? `${matched[1]}-${matched[2]}-${matched[3]}` : ''
  }

  function createMessage(document, text) {
    const item = document.createElement('div')
    item.className = 'aside-list-item'
    const content = document.createElement('div')
    content.className = 'content'
    const title = document.createElement('span')
    title.className = 'title'
    title.textContent = text
    content.append(title)
    item.append(content)
    return item
  }

  function renderMessage(listEl, text) {
    if (!listEl) return
    listEl.replaceChildren(createMessage(listEl.ownerDocument, text))
  }

  function renderPosts(listEl, posts) {
    if (!listEl) return
    if (!posts.length) {
      renderMessage(listEl, '暂无可用文章')
      return
    }

    const document = listEl.ownerDocument
    const fragment = document.createDocumentFragment()

    for (const post of posts) {
      const item = document.createElement('div')
      item.className = 'aside-list-item'
      const content = document.createElement('div')
      content.className = 'content'
      const link = document.createElement('a')
      link.className = 'title'
      link.setAttribute('href', post.path)
      link.setAttribute('title', post.title)
      link.textContent = post.title
      content.append(link)

      const displayDate = formatDate(post)
      if (displayDate) {
        const time = document.createElement('time')
        time.setAttribute('datetime', post.date || displayDate)
        time.setAttribute('title', displayDate)
        time.textContent = displayDate
        content.append(time)
      }

      item.append(content)
      fragment.append(item)
    }

    listEl.replaceChildren(fragment)
  }

  return { formatDate, renderMessage, renderPosts }
})
