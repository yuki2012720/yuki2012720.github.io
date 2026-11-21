(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HangetsuSearch=api})(typeof window==='undefined'?null:window,function(){
  'use strict'
  function safePath(value){
    if(typeof value!=='string'||!value.startsWith('/')||/[\u0000-\u0020\\]/.test(value))return ''
    try{const decoded=decodeURIComponent(value);if(decoded.startsWith('//')||decoded.includes('\\')||/[\u0000-\u001f]/.test(decoded))return ''}catch{return ''}
    return value
  }
  function permalinkDate(url){
    // Dated post URLs are the site's established Shanghai calendar dates.
    // Do not interpret them in the visitor's local timezone or invent dates for pages.
    const match=/^\/(\d{4})\/(\d{2})\/(\d{2})\//.exec(url)
    if(!match)return ''
    const date=match.slice(1).join('-'),parsed=new Date(date+'T00:00:00Z')
    return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date?date:''
  }
  function highlightParts(value,query){
    const text=String(value??'')
    if(!text)return []
    const terms=[...new Set(String(query||'').trim().split(/\s+/).filter(Boolean))].sort((a,b)=>b.length-a.length)
    if(!terms.length)return [{text,match:false}]
    const pattern=new RegExp(terms.map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'giu')
    const parts=[]
    let end=0
    for(const match of text.matchAll(pattern)){
      if(match.index>end)parts.push({text:text.slice(end,match.index),match:false})
      parts.push({text:match[0],match:true});end=match.index+match[0].length
    }
    if(end<text.length)parts.push({text:text.slice(end),match:false})
    return parts
  }
  function searchPosts(items,query,limit=40){
    const terms=String(query||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
    if(!terms.length||!Array.isArray(items))return []
    return items.flatMap((item,index)=>{
      if(!item||!safePath(item.url))return []
      const title=String(item.title||'无题'),content=String(item.content||'').replace(/\s+/g,' ')
      const head=title.toLocaleLowerCase(),body=content.toLocaleLowerCase()
      if(!terms.every(term=>head.includes(term)||body.includes(term)))return []
      const score=terms.reduce((n,term)=>n+(head.includes(term)?10:1),0)
      const at=Math.max(0,body.indexOf(terms[0])-30)
      return [{title,url:item.url,date:permalinkDate(item.url),snippet:(at?'…':'')+content.slice(at,at+125)+(content.length>at+125?'…':''),score,index}]
    }).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,Math.max(0,limit))
  }
  return {safePath,searchPosts,highlightParts}
})
