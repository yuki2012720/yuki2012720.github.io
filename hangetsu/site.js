(() => {
  'use strict'
  const $ = selector => document.querySelector(selector)
  const menu = $('#menu-links')
  menu.append($('#navigation-links').content.cloneNode(true))
  const openers=new WeakMap(),menuToggle=$('.menu-toggle')
  function openDialog(id,trigger=document.activeElement){
    const dialog=document.getElementById(id)
    if(!dialog||dialog.open)return
    const current=$('dialog[open]'),opener=current?(openers.get(current)||menuToggle):trigger
    if(current){openers.delete(current);current.close()}
    openers.set(dialog,opener)
    dialog.showModal()
    menuToggle?.setAttribute('aria-expanded',String(id==='menu-dialog'))
    if(id==='search-dialog')$('#search-input').focus()
  }
  // Delegation includes buttons cloned from the navigation template.
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-open]')
    if(button){event.preventDefault();openDialog(button.dataset.open,button)}
  })
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close',()=>{
      const opener=openers.get(dialog);openers.delete(dialog)
      if(dialog.id==='menu-dialog')menuToggle?.setAttribute('aria-expanded',String(dialog.open))
      if(opener?.isConnected&&!$('dialog[open]'))opener.focus({preventScroll:true})
    })
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close())
    dialog.addEventListener('click', event => {
      if(event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close()
    })
  })
  document.addEventListener('keydown', event => {
    if(event.key==='Escape'){
      const dialog=$('dialog[open]')
      if(dialog){event.preventDefault();dialog.close()}
      return
    }
    if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      openDialog('search-dialog')
      $('#search-input').focus()
    }
  })
  document.addEventListener('click',event=>{if(event.target.closest('[data-random-post]')){$('dialog[open]')?.close();window.toRandomPost()}})

  let searchData, searchPromise, version = 0
  const input = $('#search-input'), results = $('#search-results'), status = $('#search-status'), retry = $('#search-retry')
  function appendHighlight(element,text,query){
    window.HangetsuSearch.highlightParts(text,query).forEach(part=>{
      if(!part.match){element.append(document.createTextNode(part.text));return}
      const mark=document.createElement('mark');mark.textContent=part.text;element.append(mark)
    })
  }
  async function loadSearch(){
    if(searchData) return searchData
    if(!searchPromise) searchPromise = fetch('/search.json').then(response => {
      if(!response.ok) throw new Error('search unavailable')
      return response.json()
    }).then(data => {
      if(!Array.isArray(data)) throw new Error('invalid search index')
      searchData = data
      return data
    }).catch(error => {searchPromise = null; throw error})
    return searchPromise
  }
  async function search(){
    const current = ++version, query = input.value.trim()
    results.replaceChildren(); retry.hidden = true
    if(!query){status.textContent='输入关键词，搜索全部文章。';return}
    status.textContent='正在搜索…'
    try {
      const data = await loadSearch()
      if(current !== version) return
      const found = window.HangetsuSearch.searchPosts(data,query)
      status.textContent = found.length ? `找到 ${found.length}${found.length === 40 ? ' 条（最多显示 40 条）' : ' 条'}结果` : '没有找到相关文章，换个关键词试试。'
      found.forEach(item => {
        const li=document.createElement('li'), a=document.createElement('a'), h=document.createElement('h3'), p=document.createElement('p')
        a.href=item.url
        if(item.date){
          const time=document.createElement('time');time.dateTime=item.date;time.textContent=item.date.replace(/-/g,'.');a.append(time)
        }
        appendHighlight(h,item.title,query);appendHighlight(p,item.snippet,query)
        a.append(h,p);li.append(a);results.append(li)
      })
    } catch {
      if(current !== version) return
      status.textContent='搜索索引暂时无法加载，请重试。'; retry.hidden=false
    }
  }
  let debounce
  input.addEventListener('input', () => {clearTimeout(debounce);version++;debounce=setTimeout(search,140)})
  retry.addEventListener('click',search)

  const article=$('.post-content')
  if(article){
    let size=16
    try{const saved=Number(localStorage.getItem('hangetsu.readingSize'));if(saved>=14&&saved<=22)size=saved}catch{}
    const setSize=()=>article.style.setProperty('--reading-size',`${size}px`)
    setSize()
    document.querySelectorAll('[data-font]').forEach(button=>button.addEventListener('click',()=>{
      size=Math.max(14,Math.min(22,size+Number(button.dataset.font)));setSize()
      try{localStorage.setItem('hangetsu.readingSize',String(size))}catch{}
    }))
    $('[data-copy-url]').addEventListener('click',async event=>{
      const canonical=$('link[rel="canonical"]').href
      try{await navigator.clipboard.writeText(canonical);event.target.textContent='已复制'}catch{event.target.textContent='未能复制，请复制地址栏链接'}
    })
  }
  function showImage(source,caption=''){
    let url
    try{url=new URL(source,location.href)}catch{return}
    if(!['http:','https:','blob:','data:'].includes(url.protocol))return
    $('#large-image').src=url.href;$('#large-image').alt=caption;$('#large-image-caption').textContent=caption
    openDialog('image-dialog')
  }
  // The existing random pages call Fancybox.show([{src,caption}]). Keep that
  // narrow compatibility boundary, using this theme's accessible native dialog.
  window.Fancybox={show(items){const item=items?.[0];if(item?.src)showImage(item.src,String(item.caption||''))}}
  document.querySelectorAll('.prose img:not(.no-lightbox)').forEach(image=>image.addEventListener('click',()=>{
    if(image.closest('a'))return
    showImage(image.currentSrc||image.src,image.alt)
  }))

  const commentRoot=$('#waline-wrap')
  if(commentRoot){
    let pending=false, attempts=0, suspended=false, generation=0
    async function withTimeout(promise){
      let timer
      try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('comment resource timeout')),15000)})])}
      finally{clearTimeout(timer)}
    }
    function commentStyles(url){
      const existing=document.querySelector('link[data-comment-css]')
      if(existing?.dataset.loaded==='true')return Promise.resolve()
      existing?.remove()
      const link=document.createElement('link')
      link.rel='stylesheet';link.href=url;link.dataset.commentCss=''
      return withTimeout(new Promise((resolve,reject)=>{
        link.onload=()=>{link.dataset.loaded='true';resolve()}
        link.onerror=()=>reject(new Error('comment stylesheet unavailable'))
        document.head.append(link)
      })).catch(error=>{link.remove();throw error})
    }
    async function comments(){
      if(pending||suspended)return
      const run=++generation,active=()=>!suspended&&run===generation&&commentRoot.isConnected
      pending=true;commentRoot.setAttribute('aria-busy','true');$('#comment-retry').hidden=true;commentRoot.textContent='正在加载评论…'
      try{
        const config=JSON.parse(commentRoot.dataset.config)
        await commentStyles(config.css)
        if(!active())return
        const moduleURL=new URL(config.js,location.href)
        if(attempts)moduleURL.searchParams.set('hangetsu-retry',String(attempts))
        const {init}=await withTimeout(import(moduleURL.href))
        if(!active())return
        commentRoot.replaceChildren()
        init({el:commentRoot,serverURL:config.serverURL,...config.option,path:commentRoot.dataset.path,pageview:false,comment:false,dark:'html[data-reading-mode="night"]'})
      }catch{
        if(!active())return
        attempts++
        commentRoot.textContent='评论暂时无法加载。请检查网络后重试。';$('#comment-retry').hidden=false
      }finally{if(run===generation){pending=false;commentRoot.setAttribute('aria-busy','false')}}
    }
    $('#comment-retry').addEventListener('click',comments)
    window.addEventListener('pagehide',()=>{suspended=true;generation++;pending=false})
    window.addEventListener('pageshow',event=>{if(event.persisted){suspended=false;if(!commentRoot.querySelector('.wl-editor'))comments()}})
    if('IntersectionObserver' in window){
      const loader=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){loader.disconnect();comments()}},{rootMargin:'400px'})
      loader.observe(commentRoot)
    }else comments()
  }

  const motion=matchMedia('(prefers-reduced-motion: reduce)')
  let observer
  function setupMotion(){
    observer?.disconnect()
    const enabled=!motion.matches&&('IntersectionObserver' in window)
    document.documentElement.classList.toggle('motion-ready',enabled)
    if(!enabled)return
    const elements=document.querySelectorAll('[data-reveal]')
    elements.forEach(el=>{const r=el.getBoundingClientRect();el.classList.toggle('is-in-view',r.top<innerHeight&&r.bottom>0)})
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-in-view',entry.isIntersecting)),{threshold:.04})
    elements.forEach(el=>observer.observe(el))
  }
  setupMotion();motion.addEventListener('change',setupMotion)
})()
