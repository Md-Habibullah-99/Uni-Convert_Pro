
// Global variables
let files = [];
let finalPdfBytes = null;
let isReorderMode = false;
let dragSrcEl = null;
const MAX_FILE_SIZE_NORMAL = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 30;

// Compression settings
let settings = {
  quality: 0.75,
  maxWidth: 1600,
  compressionMode: 'balanced',
  pageSize: 'a4',
  optimizeImages: true,
  orientation: 'portrait',
  imageFit: 'fit',
  fontSize: 12,
  pageNumbers: true,
  fileHeaders: true
};

// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const fileList = document.getElementById('fileList');
const previewContainer = document.getElementById('previewContainer');
const emptyPreview = document.getElementById('emptyPreview');
const clearAllBtn = document.getElementById('clearAllBtn');
const clearPreviewBtn = document.getElementById('clearPreviewBtn');
const removeSelectedBtn = document.getElementById('removeSelectedBtn');
const reorderBtn = document.getElementById('reorderBtn');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const loadingDetail = document.getElementById('loadingDetail');
const memoryWarning = document.getElementById('memoryWarning');
const statsPanel = document.getElementById('statsPanel');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const dropZoneOverlay = document.getElementById('dropZoneOverlay');

// Initialize event listeners
function init() {
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  dropArea.addEventListener('dragover', handleDragOver);
  dropArea.addEventListener('drop', handleDrop);
  convertBtn.addEventListener('click', convertToPDF);
  clearAllBtn.addEventListener('click', clearAllFiles);
  clearPreviewBtn.addEventListener('click', clearAllFiles);
  removeSelectedBtn.addEventListener('click', removeSelectedFiles);
  reorderBtn.addEventListener('click', toggleReorderMode);

  // Settings event listeners
  document.getElementById('qualitySlider').addEventListener('input', updateQuality);
  document.getElementById('widthSlider').addEventListener('input', updateMaxWidth);
  document.getElementById('compressionMode').addEventListener('change', updateCompressionMode);
  document.getElementById('pageSize').addEventListener('change', updatePageSize);
  document.getElementById('optimizeImages').addEventListener('change', updateOptimizeImages);
  document.getElementById('fontSize').addEventListener('change', updateFontSize);

  // Tab event listeners
  document.getElementById('compressionTab').addEventListener('click', () => switchTab('compression'));
  document.getElementById('layoutTab').addEventListener('click', () => switchTab('layout'));

  // Initialize drag and drop for reordering
  initDragAndDrop();

  // Load saved settings from localStorage
  loadSettings();

  // Update UI with initial settings
  updateQuality();
  updateMaxWidth();
}

// Initialize drag and drop for reordering
function initDragAndDrop() {
  // Make preview container a drop zone
  previewContainer.addEventListener('dragover', function (e) {
    e.preventDefault();
    if (isReorderMode) {
      dropZoneOverlay.classList.add('active');
    }
  });

  previewContainer.addEventListener('dragleave', function (e) {
    if (!previewContainer.contains(e.relatedTarget)) {
      dropZoneOverlay.classList.remove('active');
    }
  });

  previewContainer.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZoneOverlay.classList.remove('active');

    if (!isReorderMode || !dragSrcEl) return;

    const dropTarget = e.target.closest('.preview-item');
    if (dropTarget && dragSrcEl !== dropTarget) {
      const srcId = dragSrcEl.dataset.id;
      const targetId = dropTarget.dataset.id;

      const srcIndex = files.findIndex(f => f.id === srcId);
      const targetIndex = files.findIndex(f => f.id === targetId);

      if (srcIndex !== -1 && targetIndex !== -1) {
        // Move the file in the array
        const [movedFile] = files.splice(srcIndex, 1);
        files.splice(targetIndex, 0, movedFile);

        // Update the preview
        updatePreview();
      }
    }

    dragSrcEl = null;
  });
}

// Load saved settings from localStorage
function loadSettings() {
  const savedSettings = localStorage.getItem('pdfConverterSettings');
  if (savedSettings) {
    const saved = JSON.parse(savedSettings);
    settings = { ...settings, ...saved };

    // Update UI elements with saved settings
    document.getElementById('qualitySlider').value = settings.quality;
    document.getElementById('widthSlider').value = settings.maxWidth;
    document.getElementById('compressionMode').value = settings.compressionMode;
    document.getElementById('pageSize').value = settings.pageSize;
    document.getElementById('optimizeImages').checked = settings.optimizeImages;
    document.getElementById('fontSize').value = settings.fontSize;

    updateQuality();
    updateMaxWidth();
  }
}

// Save settings to localStorage
function saveSettings() {
  localStorage.setItem('pdfConverterSettings', JSON.stringify(settings));
}

// Switch between tabs
function switchTab(tab) {
  const compressionTab = document.getElementById('compressionTab');
  const layoutTab = document.getElementById('layoutTab');
  const compressionSettings = document.getElementById('compressionSettings');
  const layoutSettings = document.getElementById('layoutSettings');

  if (tab === 'compression') {
    compressionTab.classList.add('active');
    layoutTab.classList.remove('active');
    compressionSettings.classList.add('active');
    layoutSettings.classList.remove('active');
  } else {
    compressionTab.classList.remove('active');
    layoutTab.classList.add('active');
    compressionSettings.classList.remove('active');
    layoutSettings.classList.add('active');
  }
}

// Update quality setting
function updateQuality() {
  settings.quality = parseFloat(document.getElementById('qualitySlider').value);
  document.getElementById('qualityValue').textContent = `${Math.round(settings.quality * 100)}%`;

  // Update quality badge
  const qualityBadge = document.getElementById('qualityBadge');
  if (settings.quality >= 0.8) {
    qualityBadge.textContent = 'High';
    qualityBadge.style.backgroundColor = '#4caf50';
  } else if (settings.quality >= 0.5) {
    qualityBadge.textContent = 'Medium';
    qualityBadge.style.backgroundColor = '#ff9800';
  } else {
    qualityBadge.textContent = 'Low';
    qualityBadge.style.backgroundColor = '#f44336';
  }

  updateSizeEstimate();
  saveSettings();
}

// Update max width setting
function updateMaxWidth() {
  settings.maxWidth = parseInt(document.getElementById('widthSlider').value);
  document.getElementById('widthValue').textContent = `${settings.maxWidth}px`;
  updateSizeEstimate();
  saveSettings();
}

// Update compression mode
function updateCompressionMode() {
  settings.compressionMode = document.getElementById('compressionMode').value;
  updateSizeEstimate();
  saveSettings();
}

// Update page size
function updatePageSize() {
  settings.pageSize = document.getElementById('pageSize').value;
  saveSettings();
}

// Update optimize images setting
function updateOptimizeImages() {
  settings.optimizeImages = document.getElementById('optimizeImages').checked;
  updateSizeEstimate();
  saveSettings();
}

// Update font size
function updateFontSize() {
  settings.fontSize = parseInt(document.getElementById('fontSize').value);
  saveSettings();
}

// Handle drag over event
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  dropArea.classList.add('highlight');
}

// Handle drop event
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropArea.classList.remove('highlight');

  const droppedFiles = e.dataTransfer.files;
  processFiles(droppedFiles);
}

// Handle file selection via input
function handleFileSelect(e) {
  const selectedFiles = e.target.files;
  processFiles(selectedFiles);
}

// Process uploaded files
function processFiles(fileArray) {
  // Convert FileList to array
  const newFiles = Array.from(fileArray);

  // Check if adding new files would exceed limits
  if (files.length + newFiles.length > MAX_FILES) {
    alert(`You can only upload up to ${MAX_FILES} files. You already have ${files.length} files.`);
    return;
  }

  // Calculate total size
  let totalSize = files.reduce((sum, file) => sum + file.size, 0);

  // Check each new file
  for (const file of newFiles) {
    // Check file type
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Check if file is supported
    const isImage = fileType.startsWith('image/');
    const isText = fileType === 'text/plain' || fileName.endsWith('.txt');

    if (!isImage && !isText) {
      alert(`File "${file.name}" is not supported. Please upload images or text files only.`);
      continue;
    }

    // Check individual file size
    if (file.size > 15 * 1024 * 1024) {
      alert(`File "${file.name}" is too large (max 15MB).`);
      continue;
    }

    // Check total size
    totalSize += file.size;
    if (totalSize > MAX_TOTAL_SIZE) {
      alert(`Adding "${file.name}" would exceed the total size limit of 100MB.`);
      continue;
    }

    // Add file to array with metadata
    files.push({
      file: file,
      id: String(Date.now() + Math.random()),
      type: isImage ? 'image' : 'text',
      name: file.name,
      size: file.size,
      preview: null,
      compressed: false,
      compressedSize: file.size,
      selected: false
    });
  }

  // Show memory warning if any file is large
  const hasLargeFile = files.some(f => f.size > MAX_FILE_SIZE_NORMAL);
  memoryWarning.classList.toggle('active', hasLargeFile);

  // Update UI
  updateFileList();
  updatePreview();
  updateStats();
  updateSizeEstimate();
  fileInput.value = ''; // Reset input

  // Enable convert button
  convertBtn.disabled = files.length === 0;
}

// Update file list UI
function updateFileList() {
  if (files.length === 0) {
    fileInfo.classList.remove('active');
    statsPanel.classList.remove('active');
    removeSelectedBtn.style.display = 'none';
    return;
  }

  fileInfo.classList.add('active');
  statsPanel.classList.add('active');
  fileList.innerHTML = '';

  files.forEach((fileData, index) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.id = fileData.id;

    // Format file size
    const size = formatFileSize(fileData.size);

    li.innerHTML = `
                    <div class="file-name">
                        <input type="checkbox" class="file-checkbox" id="checkbox-${fileData.id}" ${fileData.selected ? 'checked' : ''} onchange="toggleFileSelection('${fileData.id}')">
                        <i class="fas ${fileData.type === 'image' ? 'fa-file-image' : 'fa-file-alt'}"></i>
                        <span>${fileData.name}</span>
                        ${fileData.compressed ? '<span style="color: green; font-size: 0.8rem;">(compressed)</span>' : ''}
                    </div>
                    <div class="file-size">${size}</div>
                    <button class="remove-file" onclick="removeSingleFile('${fileData.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;

    fileList.appendChild(li);
  });

  // Show remove selected button if any files are selected
  const hasSelected = files.some(f => f.selected);
  removeSelectedBtn.style.display = hasSelected ? 'block' : 'none';
}

// Toggle file selection
function toggleFileSelection(id) {
  const fileData = files.find(f => f.id === id);
  if (fileData) {
    fileData.selected = !fileData.selected;
    updateFileList();
  }
}

// Remove single file
function removeSingleFile(id) {
  files = files.filter(f => f.id !== id);
  updateFileList();
  updatePreview();
  updateStats();
  updateSizeEstimate();

  // Hide memory warning if no large files remain
  const hasLargeFile = files.some(f => f.size > MAX_FILE_SIZE_NORMAL);
  memoryWarning.classList.toggle('active', hasLargeFile);

  // Disable convert button if no files
  convertBtn.disabled = files.length === 0;

  // Hide download button if no PDF
  if (files.length === 0) {
    downloadBtn.style.display = 'none';
  }
}

// Remove selected files
function removeSelectedFiles() {
  files = files.filter(f => !f.selected);
  updateFileList();
  updatePreview();
  updateStats();
  updateSizeEstimate();

  // Hide memory warning if no large files remain
  const hasLargeFile = files.some(f => f.size > MAX_FILE_SIZE_NORMAL);
  memoryWarning.classList.toggle('active', hasLargeFile);

  // Disable convert button if no files
  convertBtn.disabled = files.length === 0;

  // Hide download button if no PDF
  if (files.length === 0) {
    downloadBtn.style.display = 'none';
  }
}

// Clear all files
function clearAllFiles() {
  if (files.length === 0) return;

  if (confirm(`Are you sure you want to remove all ${files.length} files?`)) {
    files = [];
    finalPdfBytes = null;

    // Update UI
    updateFileList();
    updatePreview();
    updateStats();
    updateSizeEstimate();

    // Hide warnings and buttons
    memoryWarning.classList.remove('active');
    convertBtn.disabled = true;
    downloadBtn.style.display = 'none';
    removeSelectedBtn.style.display = 'none';
  }
}

// Update preview section
function updatePreview() {
  if (files.length === 0) {
    emptyPreview.style.display = 'block';
    previewContainer.innerHTML = '<p id="emptyPreview">No files added yet. Upload files to see preview here.</p><div class="drop-zone-overlay" id="dropZoneOverlay">Drop to reorder</div>';
    return;
  }

  emptyPreview.style.display = 'none';
  previewContainer.innerHTML = '<div class="drop-zone-overlay" id="dropZoneOverlay">Drop to reorder</div>';
  dropZoneOverlay.style.display = isReorderMode ? 'block' : 'none';

  files.forEach((fileData, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.dataset.id = fileData.id;

    // Make draggable in reorder mode
    if (isReorderMode) {
      previewItem.draggable = true;

      previewItem.addEventListener('dragstart', function (e) {
        dragSrcEl = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
      });

      previewItem.addEventListener('dragend', function () {
        this.classList.remove('dragging');
      });
    }

    // Generate preview content based on file type
    let previewContent = '';

    if (fileData.type === 'image') {
      // Create image preview
      if (!fileData.preview || fileData.preview === 'loading') {
        const reader = new FileReader();
        reader.onload = function (e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.className = 'preview-img';

          // Find the preview item and update it
          const item = document.querySelector(`[data-id="${fileData.id}"] .preview-content`);
          if (item) {
            item.innerHTML = '';
            item.appendChild(img);
          }

          // Store the preview URL
          fileData.preview = e.target.result;
        };
        reader.readAsDataURL(fileData.file);
        previewContent = '<p>Loading image preview...</p>';
      } else {
        previewContent = `<img src="${fileData.preview}" class="preview-img" alt="${fileData.name}">`;
      }
    } else {
      // Create text preview
      if (!fileData.preview || fileData.preview === 'loading') {
        const reader = new FileReader();
        reader.onload = function (e) {
          const text = e.target.result;
          // Limit preview length
          const previewText = text.length > 1000 ? text.substring(0, 1000) + '...' : text;

          // Find the preview item and update it
          const item = document.querySelector(`[data-id="${fileData.id}"] .preview-content`);
          if (item) {
            item.innerHTML = `<div class="preview-text">${escapeHtml(previewText)}</div>`;
          }

          // Store the preview text
          fileData.preview = previewText;
        };
        reader.readAsText(fileData.file);
        previewContent = '<p>Loading text preview...</p>';
      } else {
        previewContent = `<div class="preview-text">${escapeHtml(fileData.preview)}</div>`;
      }
    }

    previewItem.innerHTML = `
                    <div class="preview-item-header">
                        <div class="file-name">
                            <span class="preview-item-number">${index + 1}</span>
                            <span class="drag-handle" style="display: ${isReorderMode ? 'inline-block' : 'none'}">
                                <i class="fas fa-grip-vertical"></i>
                            </span>
                            <span>${fileData.name}</span>
                        </div>
                        <div class="item-actions">
                            <button class="move-btn" onclick="moveItemUp('${fileData.id}')" ${index === 0 ? 'disabled' : ''}>
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button class="move-btn" onclick="moveItemDown('${fileData.id}')" ${index === files.length - 1 ? 'disabled' : ''}>
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button class="delete-btn" onclick="removeSingleFile('${fileData.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="preview-content">
                        ${previewContent}
                    </div>
                `;

    previewContainer.appendChild(previewItem);
  });

  // Re-attach the drop zone overlay
  const overlay = previewContainer.querySelector('.drop-zone-overlay');
  if (overlay) {
    overlay.style.display = isReorderMode ? 'block' : 'none';
  }
}

// Move item up in the list
function moveItemUp(id) {
  const index = files.findIndex(f => f.id === id);
  if (index > 0) {
    // Swap with previous item
    [files[index], files[index - 1]] = [files[index - 1], files[index]];
    updatePreview();
    updateFileList();
  }
}

// Move item down in the list
function moveItemDown(id) {
  const index = files.findIndex(f => f.id === id);
  if (index < files.length - 1) {
    // Swap with next item
    [files[index], files[index + 1]] = [files[index + 1], files[index]];
    updatePreview();
    updateFileList();
  }
}

// Toggle reorder mode
function toggleReorderMode() {
  isReorderMode = !isReorderMode;

  // Update button text
  if (isReorderMode) {
    reorderBtn.innerHTML = '<i class="fas fa-check"></i> Done Reordering';
    reorderBtn.style.backgroundColor = '#4caf50';
  } else {
    reorderBtn.innerHTML = '<i class="fas fa-random"></i> Reorder Files';
    reorderBtn.style.backgroundColor = '';
  }

  // Show/hide drag handles and drop zone
  const dragHandles = document.querySelectorAll('.drag-handle');
  dragHandles.forEach(handle => {
    handle.style.display = isReorderMode ? 'inline-block' : 'none';
  });

  const previewItems = document.querySelectorAll('.preview-item');
  previewItems.forEach(item => {
    item.draggable = isReorderMode;
  });

  dropZoneOverlay.style.display = isReorderMode ? 'block' : 'none';

  // Update preview to show/hide numbers
  updatePreview();
}

// Update statistics panel
function updateStats() {
  if (files.length === 0) {
    statsPanel.classList.remove('active');
    return;
  }

  const totalFilesCount = files.length;
  const originalTotalSize = files.reduce((sum, f) => sum + f.size, 0);

  totalFiles.textContent = totalFilesCount;
  totalSize.textContent = formatFileSize(originalTotalSize);

  // Estimate compressed size
  let estimatedTotalSize = 0;
  files.forEach(file => {
    if (file.type === 'image') {
      // Estimate image compression
      let compressionFactor = 0.5; // Default for balanced
      if (settings.compressionMode === 'high') compressionFactor = 0.3;
      if (settings.compressionMode === 'low') compressionFactor = 0.8;

      // Apply quality setting
      compressionFactor *= settings.quality;

      estimatedTotalSize += file.size * compressionFactor;
    } else {
      // Text files add minimal size
      estimatedTotalSize += file.size * 0.05; // Text compression is very efficient
    }
  });

  // Add PDF overhead (about 20KB)
  estimatedTotalSize += 20 * 1024;

  estimatedPDF.textContent = formatFileSize(estimatedTotalSize);

  // Calculate compression rate
  const reduction = Math.max(0, 100 - (estimatedTotalSize / originalTotalSize * 100));
  compressionRate.textContent = `${Math.round(reduction)}%`;
}

// Update size estimate
function updateSizeEstimate() {
  if (files.length === 0) {
    sizeEstimate.classList.remove('active');
    return;
  }

  sizeEstimate.classList.add('active');
  updateStats();
}

// Image compression function
async function compressImage(file, maxSize = null, quality = null) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  let { width, height } = img;
  const maxWidth = maxSize || settings.maxWidth;
  const qualityLevel = quality || settings.quality;

  // Calculate scale to fit within max dimensions
  const scale = Math.min(1, maxWidth / Math.max(width, height));

  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  // Apply compression settings
  if (settings.compressionMode === 'high') {
    // For high compression, use lower quality and faster drawing
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
  }

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, "image/jpeg", qualityLevel)
  );

  URL.revokeObjectURL(img.src);
  return await blob.arrayBuffer();
}

// Convert files to PDF with compression
async function convertToPDF() {
  if (files.length === 0) {
    alert('Please add at least one file to convert.');
    return;
  }

  // Show loading indicator
  loading.classList.add('active');
  progressBar.classList.add('active');
  convertBtn.disabled = true;
  downloadBtn.style.display = 'none';

  try {
    loadingText.textContent = "Creating PDF document...";
    loadingDetail.textContent = "Initializing PDF library";

    // Create PDF document
    const pdfDoc = await PDFLib.PDFDocument.create();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    // Determine page size
    const pageSize = settings.pageSize === 'a4' ? [595.28, 841.89] : [612, 792];
    const isLandscape = settings.orientation === 'landscape';
    const [pageWidth, pageHeight] = isLandscape ? [pageSize[1], pageSize[0]] : pageSize;

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      const progress = ((i / files.length) * 100).toFixed(0);
      progressFill.style.width = `${progress}%`;

      loadingText.textContent = `Processing file ${i + 1} of ${files.length}`;
      loadingDetail.textContent = `Compressing: ${fileData.name}`;

      // Update progress every few files to keep UI responsive
      if (i % 2 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      if (fileData.type === 'image') {
        // Compress image
        let imageBytes;

        if (settings.optimizeImages) {
          // Adjust quality based on compression mode
          let quality = settings.quality;
          if (settings.compressionMode === 'high') quality *= 0.6;
          if (settings.compressionMode === 'low') quality = Math.min(quality * 1.2, 1);

          imageBytes = await compressImage(fileData.file, settings.maxWidth, quality);
        } else {
          // Use original image
          imageBytes = await fileData.file.arrayBuffer();
        }

        // Embed image in PDF
        let image;
        try {
          // Try JPEG first
          image = await pdfDoc.embedJpg(imageBytes);
        } catch (e) {
          // If JPEG fails, try PNG
          try {
            image = await pdfDoc.embedPng(imageBytes);
          } catch (e2) {
            console.error("Failed to embed image:", e2);
            // Add placeholder text instead
            addTextPage(pdfDoc, font, fontBold, pageWidth, pageHeight,
              `[Image: ${fileData.name} - Could not be processed]`);
            continue;
          }
        }

        // Add page with image
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate image dimensions based on fit mode
        let imgWidth, imgHeight, x, y;

        const imgAspect = image.width / image.height;
        const pageAspect = pageWidth / pageHeight;

        if (settings.imageFit === 'fill') {
          // Fill page (may crop)
          if (imgAspect > pageAspect) {
            // Image is wider than page
            imgHeight = pageHeight;
            imgWidth = imgHeight * imgAspect;
            x = (pageWidth - imgWidth) / 2;
            y = 0;
          } else {
            // Image is taller than page
            imgWidth = pageWidth;
            imgHeight = imgWidth / imgAspect;
            x = 0;
            y = (pageHeight - imgHeight) / 2;
          }
        } else if (settings.imageFit === 'original') {
          // Original size
          const scale = 72 / 96; // Convert pixels to points
          imgWidth = image.width * scale;
          imgHeight = image.height * scale;
          x = (pageWidth - imgWidth) / 2;
          y = (pageHeight - imgHeight) / 2;
        } else {
          // Fit to page (default)
          const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
          imgWidth = image.width * scale;
          imgHeight = image.height * scale;
          x = (pageWidth - imgWidth) / 2;
          y = (pageHeight - imgHeight) / 2;
        }

        // Draw image on page
        page.drawImage(image, {
          x,
          y,
          width: imgWidth,
          height: imgHeight
        });

        // Add file name if enabled
        if (settings.fileHeaders) {
          page.drawText(fileData.name, {
            x: 20,
            y: pageHeight - 20,
            size: 10,
            font: fontBold,
            color: PDFLib.rgb(0.3, 0.3, 0.3)
          });
        }

      } else {
        // Process text file
        const text = await readFileAsText(fileData.file);

        // Split text into lines
        const lines = text.split("\n");
        let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - 40;
        let lineIndex = 0;

        // Add file name header if enabled
        if (settings.fileHeaders) {
          currentPage.drawText(fileData.name, {
            x: 20,
            y: pageHeight - 20,
            size: 12,
            font: fontBold,
            color: PDFLib.rgb(0.2, 0.2, 0.2)
          });
          y -= 20;
        }

        while (lineIndex < lines.length) {
          const line = lines[lineIndex];

          // Check if we need a new page
          if (y < 40) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - 40;
          }

          // Draw line
          currentPage.drawText(line, {
            x: 40,
            y,
            size: settings.fontSize,
            font,
            color: PDFLib.rgb(0, 0, 0)
          });

          y -= (settings.fontSize * 1.2);
          lineIndex++;
        }
      }
    }

    // Add page numbers if enabled
    if (settings.pageNumbers) {
      const pages = pdfDoc.getPages();
      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        page.drawText(`Page ${index + 1}`, {
          x: width - 60,
          y: 20,
          size: 10,
          font,
          color: PDFLib.rgb(0.5, 0.5, 0.5)
        });
      });
    }

    // Complete progress bar
    progressFill.style.width = '100%';
    loadingText.textContent = "Finalizing PDF...";
    loadingDetail.textContent = "Saving document";

    // Save PDF
    finalPdfBytes = await pdfDoc.save();

    // Create download link
    const pdfBlob = new Blob([finalPdfBytes], { type: "application/pdf" });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Show final file size
    const finalSize = formatFileSize(pdfBlob.size);
    loadingText.innerHTML = `Conversion complete!`;
    loadingDetail.innerHTML = `Final PDF size: <strong>${finalSize}</strong>`;

    // Update download button
    downloadBtn.href = pdfUrl;
    downloadBtn.style.display = 'flex';
    downloadBtn.download = `compressed_document_${Date.now()}.pdf`;

    // Update stats with actual size
    const originalTotalSize = files.reduce((sum, f) => sum + f.size, 0);
    const actualReduction = Math.max(0, 100 - (pdfBlob.size / originalTotalSize * 100));
    compressionRate.textContent = `${Math.round(actualReduction)}%`;
    estimatedPDF.textContent = finalSize;

    // Scroll to download button
    setTimeout(() => {
      downloadBtn.scrollIntoView({ behavior: 'smooth' });
    }, 500);

  } catch (error) {
    console.error('Error converting to PDF:', error);
    loadingText.textContent = "Error during conversion";
    loadingDetail.textContent = error.message || "Please try again with smaller files or adjust compression settings.";
    alert('Error converting files to PDF. Please try again with smaller files or adjust compression settings.');
  } finally {
    // Hide loading indicator after a delay
    setTimeout(() => {
      loading.classList.remove('active');
      progressBar.classList.remove('active');
      progressFill.style.width = '0%';
      convertBtn.disabled = false;
    }, 2000);
  }
}

// Helper function to add a text page
function addTextPage(pdfDoc, font, fontBold, pageWidth, pageHeight, text) {
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawText(text, {
    x: 40,
    y: pageHeight / 2,
    size: 12,
    font,
    color: PDFLib.rgb(0.5, 0.5, 0.5)
  });
}

// Helper function to read file as text
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsText(file);
  });
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize the application
init();
