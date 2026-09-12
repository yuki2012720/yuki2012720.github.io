/**
 * 修复文章页面背景色，确保与侧边栏一致
 * 使用 MutationObserver 确保动态加载的内容也被处理
 */

function fixArticleBackground() {
  const post = document.getElementById('post');
  const isRealPostPage = document.querySelector('.layout_post') || post;

  if (!isRealPostPage) {
    console.log('Skipping background fix on non-post page...');
    return;
  }

  // 只处理文章页，不处理随机页面和杂七杂八工具页
  const isRandomPage = document.querySelector('.random-gal-container') || document.querySelector('.random-anime-container');
  const isMiscToolPage = document.getElementById('symmetry-tool') || document.getElementById('melt-tool');
  const isFlinkPage = document.querySelector('.page.type-link') || document.querySelector('.flink');

  if (isRandomPage || isMiscToolPage || isFlinkPage) {
    console.log('Skipping page background fix...', {
      isRandomPage: !!isRandomPage,
      isMiscToolPage: !!isMiscToolPage,
      isFlinkPage: !!isFlinkPage
    });
    return;
  }
  
  // 查找文章容器
  const articleContainer = document.getElementById('article-container');
  
  console.log('Fixing article background...', {
    hasArticleContainer: !!articleContainer,
    hasPost: !!post
  });
  
  // 直接设置内联样式（最高优先级）
  if (articleContainer) {
    articleContainer.style.setProperty('background', 'transparent', 'important');
    articleContainer.style.setProperty('backgroundColor', 'transparent', 'important');
    articleContainer.style.setProperty('backdropFilter', 'none', 'important');
    articleContainer.style.setProperty('webkitBackdropFilter', 'none', 'important');
    articleContainer.style.setProperty('border', 'none', 'important');
    articleContainer.style.setProperty('boxShadow', 'none', 'important');
    articleContainer.style.setProperty('borderRadius', '0', 'important');
    
    console.log('Article container styles applied');
  }
  
  if (post) {
    post.style.setProperty('background', 'rgba(255, 255, 255, 0.3)', 'important');
    post.style.setProperty('backgroundColor', 'rgba(255, 255, 255, 0.3)', 'important');
    post.style.setProperty('backdropFilter', 'blur(15px)', 'important');
    post.style.setProperty('webkitBackdropFilter', 'blur(15px)', 'important');
    post.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.2)', 'important');
    post.style.setProperty('borderRadius', '12px', 'important');
    post.style.setProperty('boxShadow', 'none', 'important');
    
    console.log('Post styles applied');
    
    // 验证样式是否真正被应用
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(post);
      console.log('Post computed styles:', {
        background: computedStyle.background,
        backgroundColor: computedStyle.backgroundColor,
        backdropFilter: computedStyle.backdropFilter
      });
    }, 100);
  }
  
  // 同时处理内部的 post-content
  const postContent = document.querySelector('#article-container .post-content');
  if (postContent) {
    postContent.style.setProperty('background', 'transparent', 'important');
    postContent.style.setProperty('backgroundColor', 'transparent', 'important');
    postContent.style.setProperty('backdropFilter', 'none', 'important');
    postContent.style.setProperty('webkitBackdropFilter', 'none', 'important');
  }
  
  // 处理所有内部元素，排除标签元素
  if (articleContainer) {
    const allElements = articleContainer.querySelectorAll('*');
    allElements.forEach(function(el) {
      // 排除标签元素和按钮元素
      if (!el.classList.contains('tag-item') && !el.classList.contains('post-tag') && !el.classList.contains('article-tag') && !el.classList.contains('action-btn') && !el.classList.contains('process-btn') && !el.classList.contains('download-btn')) {
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('backgroundColor', 'transparent', 'important');
        el.style.setProperty('boxShadow', 'none', 'important');
        el.style.setProperty('border', 'none', 'important');
      }
    });
  }
}

// DOM 加载完成后立即执行
document.addEventListener('DOMContentLoaded', function() {
  const post = document.getElementById('post');
  const isRealPostPage = document.querySelector('.layout_post') || post;
  if (!isRealPostPage) {
    return;
  }

  // 延迟执行，确保随机页面容器有足够时间加载
  setTimeout(fixArticleBackground, 500);
  
  // 使用 MutationObserver 监听 DOM 变化，确保动态内容也被处理
  const observer = new MutationObserver(function(mutations) {
    let shouldFix = false;
    mutations.forEach(function(mutation) {
      // 只在添加了新节点时才执行修复
      if (mutation.addedNodes.length > 0) {
        // 检查是否添加了实际的内容节点（不是文本节点或空节点）
        for (let node of mutation.addedNodes) {
          if (node.nodeType === 1 && (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE')) {
            shouldFix = true;
            break;
          }
        }
      }
    });
    
    if (shouldFix) {
      // 延迟一点执行，确保新内容已完全插入
      setTimeout(fixArticleBackground, 300);
    }
  });
  
  // 开始监听文章容器
  const articleContainer = document.getElementById('article-container');
  if (articleContainer) {
    observer.observe(articleContainer, {
      childList: true,
      subtree: true
    });
  }
  
  // 也监听 post 容器
  const post = document.getElementById('post');
  if (post) {
    observer.observe(post, {
      childList: true,
      subtree: true
    });
  }
});

// 页面完全加载后再执行一次（确保所有资源都加载完成）
// window.addEventListener('load', function() {
//   setTimeout(fixArticleBackground, 500);
// });
