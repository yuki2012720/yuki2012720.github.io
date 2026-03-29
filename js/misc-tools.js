(() => {
  const MIRROR_API_URL = 'https://yuki-mirror-api.vercel.app/mirror';
  const MELT_API_URL = 'https://yuki-mirror-api.vercel.app/melt';

  function bindMirrorTool() {
    const root = document.getElementById('symmetry-tool');
    if (!root || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';

    let currentFile = null;
    let currentFileType = '';
    let selectedMode = 'left-right';
    let processedBlobUrl = null;

    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('process-btn');
    const downloadBtn = document.getElementById('download-btn');
    const previewContainer = document.getElementById('preview-container');
    const progressContainer = document.getElementById('progress-container');
    const statusMessage = document.getElementById('status-message');
    const modeBtns = root.querySelectorAll('.mode-btn');
    const originalProcessBtnText = processBtn.textContent;

    const displayPreview = src => {
      previewContainer.innerHTML = `<img src="${src}" class="preview-image" alt="预览">`;
    };

    const showProgress = () => {
      progressContainer.style.display = 'block';
    };

    const hideProgress = () => {
      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 1000);
    };

    const showStatus = (message, type) => {
      statusMessage.textContent = message;
      statusMessage.className = 'status-message ' + type;
    };

    const hideStatus = () => {
      statusMessage.className = 'status-message';
    };

    const handleFile = file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('文件过大，请上传小于 5MB 的文件');
        return;
      }

      currentFile = file;
      currentFileType = file.type === 'image/gif' ? 'gif' : 'image';

      const img = new Image();
      img.onload = () => {
        displayPreview(img.src);
        processBtn.disabled = false;
        downloadBtn.disabled = true;
        hideStatus();
      };
      img.src = URL.createObjectURL(file);
    };

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(item => item.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;

        if (currentFile) {
          processBtn.click();
        }
      });
    });

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', event => {
      event.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', event => {
      event.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFile(file);
      }
    });

    fileInput.addEventListener('change', event => {
      const file = event.target.files[0];
      if (file) {
        handleFile(file);
      }
    });

    processBtn.addEventListener('click', async () => {
      if (!currentFile) return;

      processBtn.disabled = true;
      processBtn.textContent = '正在云端魔法处理中...';
      showProgress();
      hideStatus();

      try {
        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('mode', selectedMode);

        const response = await fetch(MIRROR_API_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        processedBlobUrl = URL.createObjectURL(blob);
        displayPreview(processedBlobUrl);
        downloadBtn.disabled = false;
        hideProgress();
        showStatus('✅处理完成！', 'success');
      } catch (error) {
        hideProgress();
        showStatus('❌处理失败：' + error.message, 'error');
      } finally {
        processBtn.disabled = false;
        processBtn.textContent = originalProcessBtnText;
      }
    });

    downloadBtn.addEventListener('click', () => {
      if (!processedBlobUrl) return;

      const link = document.createElement('a');
      link.download = `mirror-${Date.now()}.${currentFileType === 'gif' ? 'gif' : 'png'}`;
      link.href = processedBlobUrl;
      link.click();
    });
  }

  function bindMeltTool() {
    const root = document.getElementById('melt-tool');
    if (!root || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';

    let meltFile = null;
    let meltUrl = null;
    let meltThreshold = 100;

    const uploadArea = document.getElementById('melt-upload-area');
    const fileInput = document.getElementById('melt-file-input');
    const processBtn = document.getElementById('melt-process-btn');
    const downloadBtn = document.getElementById('melt-download-btn');
    const previewContainer = document.getElementById('melt-preview-container');
    const progressContainer = document.getElementById('melt-progress-container');
    const statusMessage = document.getElementById('melt-status-message');
    const thresholdSlider = document.getElementById('melt-threshold');
    const thresholdValue = document.getElementById('melt-threshold-value');
    const originalProcessBtnText = processBtn.textContent;

    const displayPreview = src => {
      previewContainer.innerHTML = `<img src="${src}" class="preview-image" alt="预览">`;
    };

    const showProgress = () => {
      progressContainer.style.display = 'block';
    };

    const hideProgress = () => {
      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 1000);
    };

    const showStatus = (message, type) => {
      statusMessage.textContent = message;
      statusMessage.className = 'status-message ' + type;
    };

    const hideStatus = () => {
      statusMessage.className = 'status-message';
    };

    const handleFile = file => {
      if (file.size > 5 * 1024 * 1024) {
        showStatus('❌文件过大，请上传小于 5MB 的文件', 'error');
        return;
      }

      meltFile = file;

      const img = new Image();
      img.onload = () => {
        displayPreview(img.src);
        processBtn.disabled = false;
        downloadBtn.disabled = true;
        hideStatus();
      };
      img.src = URL.createObjectURL(file);
    };

    thresholdSlider.addEventListener('input', () => {
      meltThreshold = parseInt(thresholdSlider.value, 10);
      thresholdValue.textContent = meltThreshold;
    });

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', event => {
      event.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', event => {
      event.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = event.dataTransfer.files[0];
      if (file && file.type === 'image/gif') {
        handleFile(file);
      } else {
        showStatus('❌请上传 GIF 格式文件', 'error');
      }
    });

    fileInput.addEventListener('change', event => {
      const file = event.target.files[0];
      if (!file) return;

      if (file.type === 'image/gif') {
        handleFile(file);
      } else {
        showStatus('❌请上传 GIF 格式文件', 'error');
      }
    });

    processBtn.addEventListener('click', async () => {
      if (!meltFile) return;

      processBtn.disabled = true;
      processBtn.textContent = '🧪 正在注入数码强酸，图像正在融毁...';
      showProgress();
      hideStatus();

      try {
        const formData = new FormData();
        formData.append('image', meltFile);
        formData.append('threshold', meltThreshold);

        const response = await fetch(MELT_API_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        meltUrl = URL.createObjectURL(blob);
        displayPreview(meltUrl);
        downloadBtn.disabled = false;
        hideProgress();
        showStatus('✅熔毁完成！', 'success');
      } catch (error) {
        hideProgress();
        showStatus('❌熔毁失败：' + error.message, 'error');
      } finally {
        processBtn.disabled = false;
        processBtn.textContent = originalProcessBtnText;
      }
    });

    downloadBtn.addEventListener('click', () => {
      if (!meltUrl) return;

      const link = document.createElement('a');
      link.download = `melt-${Date.now()}.gif`;
      link.href = meltUrl;
      link.click();
    });
  }

  bindMirrorTool();
  bindMeltTool();
})();
