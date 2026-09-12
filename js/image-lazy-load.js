/**
 * 图片懒加载与背景图渐进式加载优化
 */

document.addEventListener('DOMContentLoaded', function() {
  // 1. 为所有文章列表和侧边栏的图片添加懒加载属性
  const images = document.querySelectorAll('#recent-posts img, #aside-content img, #post img');
  
  images.forEach(img => {
    if (!img.classList.contains('no-lazy')) {
      img.setAttribute('loading', 'lazy');
    }
  });

  // 2. 首屏背景图渐进式加载
  const webBg = document.getElementById('web_bg');
  if (webBg) {
    // 获取背景图 URL
    const bgImage = getComputedStyle(webBg).backgroundImage;
    
    if (bgImage && bgImage !== 'none') {
      // 提取 URL
      const imageUrl = bgImage.slice(5, -2);
      
      // 创建 Image 对象预加载
      const img = new Image();
      img.src = imageUrl;
      
      // 加载完成后添加 loaded 类，触发淡入动画
      img.onload = function() {
        webBg.classList.add('loaded');
      };
      
      // 如果图片已缓存，立即触发
      if (img.complete) {
        webBg.classList.add('loaded');
      }
    } else {
      // 没有背景图，直接显示
      webBg.classList.add('loaded');
    }
  }

  // 3. 监听所有懒加载图片的加载完成事件
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  lazyImages.forEach(img => {
    // 如果图片已经加载完成，移除占位符样式
    if (img.complete) {
      img.style.background = 'transparent';
      img.style.animation = 'none';
    } else {
      // 监听加载完成事件
      img.addEventListener('load', function() {
        this.style.background = 'transparent';
        this.style.animation = 'none';
        this.style.opacity = '1';
      });
      
      // 监听加载错误事件
      img.addEventListener('error', function() {
        this.style.background = 'rgba(245, 230, 235, 0.3)'; // 保持淡粉色占位背景
        this.style.animation = 'none';
      });
    }
  });

  // 4. 使用 Intersection Observer API 实现更智能的懒加载
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // 提前 50px 开始加载
      threshold: 0.01
    });

    // 观察所有带有 data-src 的图片
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
});
