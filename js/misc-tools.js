(() => {
  const MIRROR_API_URL = 'https://yuki-mirror-api.vercel.app/mirror';
  const GIF_SPEED_API_URL = 'https://yuki-mirror-api.vercel.app/gif-speed';

  function bindMirrorTool() {
    const root = document.getElementById('symmetry-tool');
    if (!root || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';

    let currentFile = null;
    let currentFileType = '';
    let currentBlob = null;
    let currentFilename = '';
    let selectedMode = 'left-right';
    let selectedSpeed = 1;
    let processedBlobUrl = null;

    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('process-btn');
    const speedBtn = document.getElementById('speed-btn');
    const downloadBtn = document.getElementById('download-btn');
    const previewContainer = document.getElementById('preview-container');
    const progressContainer = document.getElementById('progress-container');
    const statusMessage = document.getElementById('status-message');
    const modeBtns = root.querySelectorAll('.mode-btn');
    const speedBtns = root.querySelectorAll('.speed-btn');
    const gifSpeedSection = document.getElementById('gif-speed-section');
    const gifSpeedSlider = document.getElementById('gif-speed-slider');
    const gifSpeedValue = document.getElementById('gif-speed-value');
    const gifSpeedEmpty = document.getElementById('gif-speed-empty');
    const originalProcessBtnText = processBtn.textContent;
    const originalSpeedBtnText = speedBtn.textContent;

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

    const syncSpeedControls = value => {
      selectedSpeed = parseFloat(value);
      gifSpeedSlider.value = selectedSpeed.toString();
      gifSpeedValue.textContent = `${selectedSpeed.toFixed(2)}x`;
      speedBtns.forEach(btn => {
        const btnSpeed = parseFloat(btn.dataset.speed);
        btn.classList.toggle('active', Math.abs(btnSpeed - selectedSpeed) < 0.001);
      });
    };

    const updateGifControls = () => {
      const isGif = currentFileType === 'gif';
      gifSpeedSection.classList.toggle('disabled', !isGif);
      if (gifSpeedEmpty) {
        gifSpeedEmpty.style.display = isGif ? 'none' : 'block';
      }
      speedBtn.disabled = !isGif || !currentBlob;
    };

    const buildFormData = extraFields => {
      const formData = new FormData();
      const uploadName = currentFilename || `upload-${Date.now()}.${currentFileType === 'gif' ? 'gif' : 'png'}`;
      formData.append('image', currentBlob, uploadName);
      Object.entries(extraFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      return formData;
    };

    const applyProcessedBlob = (blob, nextFilename) => {
      currentBlob = blob;
      currentFilename = nextFilename;
      if (processedBlobUrl) {
        URL.revokeObjectURL(processedBlobUrl);
      }
      processedBlobUrl = URL.createObjectURL(blob);
      displayPreview(processedBlobUrl);
      downloadBtn.disabled = false;
      updateGifControls();
    };

    const handleFile = file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('文件过大，请上传小于 5MB 的文件');
        return;
      }

      currentFile = file;
      currentFileType = file.type === 'image/gif' ? 'gif' : 'image';
      currentBlob = file;
      currentFilename = file.name;
      syncSpeedControls(1);
      updateGifControls();

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

    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        syncSpeedControls(btn.dataset.speed);
      });
    });

    gifSpeedSlider.addEventListener('input', () => {
      syncSpeedControls(gifSpeedSlider.value);
    });

    processBtn.addEventListener('click', async () => {
      if (!currentBlob) return;

      processBtn.disabled = true;
      speedBtn.disabled = true;
      processBtn.textContent = '正在云端魔法处理中...';
      showProgress();
      hideStatus();

      try {
        const formData = buildFormData({
          mode: selectedMode
        });

        const response = await fetch(MIRROR_API_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const nextExt = currentFileType === 'gif' ? 'gif' : 'png';
        applyProcessedBlob(blob, `mirror-${Date.now()}.${nextExt}`);
        hideProgress();
        showStatus('✅处理完成！', 'success');
      } catch (error) {
        hideProgress();
        showStatus('❌处理失败：' + error.message, 'error');
      } finally {
        processBtn.disabled = false;
        updateGifControls();
        processBtn.textContent = originalProcessBtnText;
      }
    });

    speedBtn.addEventListener('click', async () => {
      if (!currentBlob || currentFileType !== 'gif') return;

      processBtn.disabled = true;
      speedBtn.disabled = true;
      speedBtn.textContent = '⚡ 正在调整速度...';
      showProgress();
      hideStatus();

      try {
        const formData = buildFormData({
          speed: selectedSpeed.toString()
        });

        const response = await fetch(GIF_SPEED_API_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        applyProcessedBlob(blob, `gif-speed-${selectedSpeed.toFixed(2).replace('.', '_')}-${Date.now()}.gif`);
        hideProgress();
        showStatus('✅GIF 速度调整完成！', 'success');
      } catch (error) {
        hideProgress();
        showStatus('❌GIF 速度调整失败：' + error.message, 'error');
      } finally {
        processBtn.disabled = false;
        updateGifControls();
        speedBtn.textContent = originalSpeedBtnText;
      }
    });

    downloadBtn.addEventListener('click', () => {
      if (!processedBlobUrl) return;

      const link = document.createElement('a');
      link.download = currentFilename || `mirror-${Date.now()}.${currentFileType === 'gif' ? 'gif' : 'png'}`;
      link.href = processedBlobUrl;
      link.click();
    });
  }

  bindMirrorTool();
})();
