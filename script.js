// --- Mock images ---
const mockImages = window.mockImages || [
  { id: 'img1', src: 'https://placekitten.com/100/100', label: 'Kitten 1' },
  { id: 'img2', src: 'https://placekitten.com/101/100', label: 'Kitten 2' },
  { id: 'img3', src: 'https://placekitten.com/102/100', label: 'Kitten 3' },
  { id: 'img4', src: 'https://placekitten.com/103/100', label: 'Kitten 4' },
  { id: 'img5', src: 'https://placekitten.com/104/100', label: 'Kitten 5' },
];

const TIERS = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

// --- State ---
let tierList = {};
let unassigned = [...mockImages];

function resetTierList() {
  tierList = {};
  TIERS.forEach(t => tierList[t] = []);
  unassigned = [...mockImages];
}

// --- Render ---
function renderTierList() {
  const container = document.getElementById('tierlist-container');
  if (!container) return;
  container.innerHTML = '';
  TIERS.forEach(tier => {
    const row = document.createElement('div');
    row.className = `tier-row tier-${tier}`;
    const label = document.createElement('div');
    label.className = 'tier-label';
    label.textContent = tier;
    row.appendChild(label);
    const dropzone = document.createElement('div');
    dropzone.className = 'tier-dropzone';
    dropzone.dataset.tier = tier;
    dropzone.addEventListener('dragover', onDragOver);
    dropzone.addEventListener('drop', onDrop);
    dropzone.addEventListener('dragleave', onDragLeave);
    // Touch support
    dropzone.addEventListener('touchend', onTouchEndDropzone);
    tierList[tier].forEach(img => {
      dropzone.appendChild(createImageElement(img));
    });
    row.appendChild(dropzone);
    container.appendChild(row);
  });
  // Unassigned images
  const unassignedRow = document.createElement('div');
  unassignedRow.className = 'tier-row';
  const label = document.createElement('div');
  label.className = 'tier-label';
  label.textContent = 'List';
  unassignedRow.appendChild(label);
  unassignedRow.appendChild(document.createElement('br'));
  const dropzone = document.createElement('div');
  dropzone.className = 'tier-dropzone';
  dropzone.dataset.tier = 'unassigned';
  dropzone.addEventListener('dragover', onDragOver);
  dropzone.addEventListener('drop', onDrop);
  dropzone.addEventListener('dragleave', onDragLeave);
  // Touch support
  dropzone.addEventListener('touchend', onTouchEndDropzone);
  unassigned.forEach(img => {
    dropzone.appendChild(createImageElement(img));
  });
  unassignedRow.appendChild(dropzone);
  container.appendChild(unassignedRow);
}

function createImageElement(img) {
  const el = document.createElement('img');
  el.src = img.src;
  el.alt = img.label;
  el.className = img.id.startsWith('uploaded_') ? 'uploaded-thumb' : 'tier-image';
  el.draggable = true;
  el.dataset.imgId = img.id;
  el.addEventListener('dragstart', onDragStart);
  el.addEventListener('dragend', onDragEnd);
  // Touch support
  el.addEventListener('touchstart', onTouchStartImg);
  if (touchSelectedImgId === img.id) {
    el.style.outline = '3px solid #ffcc00';
  } else {
    el.style.outline = '';
  }
  return el;
}

// --- Drag and Drop ---
let draggedImgId = null;
let touchSelectedImgId = null;

function onDragStart(e) {
  draggedImgId = e.target.dataset.imgId;
  e.target.classList.add('dragging');
}
function onDragEnd(e) {
  draggedImgId = null;
  e.target.classList.remove('dragging');
}
function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}
function onDragLeave(e) {
  e.currentTarget.classList.remove('dragover');
}

// --- Touch support for mobile ---
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function onTouchStartImg(e) {
  if (!isTouchDevice()) return;
  e.preventDefault();
  const imgId = e.currentTarget.dataset.imgId;
  if (touchSelectedImgId === imgId) {
    touchSelectedImgId = null;
    renderTierList();
    renderUploadedImages && renderUploadedImages();
    return;
  }
  touchSelectedImgId = imgId;
  renderTierList();
  renderUploadedImages && renderUploadedImages();
}

function onTouchEndDropzone(e) {
  if (!isTouchDevice()) return;
  if (!touchSelectedImgId) return;
  const tier = e.currentTarget.dataset.tier;
  // Remove from all tiers and unassigned
  TIERS.forEach(t => {
    tierList[t] = tierList[t].filter(img => img.id !== touchSelectedImgId);
  });
  unassigned = unassigned.filter(img => img.id !== touchSelectedImgId);
  let img = mockImages.find(i => i.id === touchSelectedImgId);
  if (!img) img = uploadedImages.find(i => i.id === touchSelectedImgId);
  if (tier === 'unassigned') {
    if (mockImages.find(i => i.id === touchSelectedImgId)) {
      unassigned.push(img);
    }
    // Uploaded images: just remove from tiers, will show in uploaded list
  } else {
    tierList[tier].push(img);
  }
  touchSelectedImgId = null;
  renderTierList();
  renderUploadedImages && renderUploadedImages();
}

// --- Editable Title ---
const titleEl = document.getElementById('tierlist-title');
if (titleEl) {
  titleEl.addEventListener('click', () => {
    titleEl.contentEditable = 'true';
    titleEl.focus();
    titleEl.select && titleEl.select();
  });
  titleEl.addEventListener('blur', () => {
    titleEl.contentEditable = 'false';
  });
  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleEl.blur();
    }
  });
}

// --- Image Upload ---
const uploadedImages = [];
const uploadedImagesEl = document.getElementById('uploaded-images');
const imageUploadInput = document.getElementById('image-upload');
if (imageUploadInput) {
  imageUploadInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const id = 'uploaded_' + Math.random().toString(36).slice(2);
        const img = { id, src: evt.target.result, label: file.name };
        uploadedImages.push(img);
        // If this is a custom tier list (mockImages is empty), add to unassigned
        if (mockImages.length === 0) {
          unassigned.push(img);
        }
        renderUploadedImages();
        renderTierList();
      };
      reader.readAsDataURL(file);
    });
    imageUploadInput.value = '';
  });
}

function renderUploadedImages() {
  if (!uploadedImagesEl) return;
  uploadedImagesEl.innerHTML = '';
  uploadedImages.forEach(img => {
    // Only show if not in any tier or unassigned
    if (!isImageAssigned(img.id)) {
      const el = document.createElement('img');
      el.src = img.src;
      el.alt = img.label;
      el.className = 'uploaded-thumb';
      el.draggable = true;
      el.dataset.imgId = img.id;
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragend', onDragEnd);
      uploadedImagesEl.appendChild(el);
    }
  });
}

function isImageAssigned(imgId) {
  // Check if image is in any tier or unassigned
  if (mockImages.find(i => i.id === imgId)) {
    if (unassigned.find(i => i.id === imgId)) return false;
    for (const t of TIERS) if (tierList[t].find(i => i.id === imgId)) return true;
    return false;
  }
  for (const t of TIERS) if (tierList[t].find(i => i.id === imgId)) return true;
  return false;
}

// --- Update drag-and-drop logic to support uploaded images ---
function onDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  if (!draggedImgId) return;
  // Remove from all tiers and unassigned
  TIERS.forEach(tier => {
    tierList[tier] = tierList[tier].filter(img => img.id !== draggedImgId);
  });
  unassigned = unassigned.filter(img => img.id !== draggedImgId);
  // Remove from uploadedImagesEl if present
  // Find the image (mock or uploaded)
  let img = mockImages.find(i => i.id === draggedImgId);
  if (!img) img = uploadedImages.find(i => i.id === draggedImgId);
  const tier = e.currentTarget.dataset.tier;
  if (tier === 'unassigned') {
    if (mockImages.find(i => i.id === draggedImgId)) {
      unassigned.push(img);
    }
    // Uploaded images: just remove from tiers, will show in uploaded list
  } else {
    tierList[tier].push(img);
  }
  renderTierList();
  renderUploadedImages();
}

// --- View Switching ---
function showPersonalView() {
  const saveLoadControls = document.getElementById('save-load-controls');
  if (saveLoadControls) saveLoadControls.classList.remove('d-none');
  const publicStats = document.getElementById('public-stats');
  if (publicStats) publicStats.classList.add('d-none');
  const tierlistContainer = document.getElementById('tierlist-container');
  if (tierlistContainer) tierlistContainer.classList.remove('d-none');
}
function showPublicView() {
  const saveLoadControls = document.getElementById('save-load-controls');
  if (saveLoadControls) saveLoadControls.classList.add('d-none');
  const tierlistContainer = document.getElementById('tierlist-container');
  if (tierlistContainer) tierlistContainer.classList.add('d-none');
  const publicStats = document.getElementById('public-stats');
  if (publicStats) publicStats.classList.remove('d-none');
  // For now, show mock stats
  const publicStatsContent = document.getElementById('public-stats');
  if (publicStatsContent) publicStatsContent.innerHTML = '<h3>Global Tier List Stats (Mock)</h3><p>Coming soon...</p>';
}

const personalBtn = document.getElementById('personal-view-btn');
if (personalBtn) personalBtn.onclick = showPersonalView;
const publicBtn = document.getElementById('public-view-btn');
if (publicBtn) publicBtn.onclick = showPublicView;
const twitterBtn = document.getElementById('twitter-login');
if (twitterBtn) twitterBtn.onclick = function() {
  alert('Twitter login coming soon!');
};
const saveBtn = document.getElementById('save-btn');
if (saveBtn) saveBtn.onclick = function() {
  alert('Save to backend coming soon!');
};
const loadBtn = document.getElementById('load-btn');
if (loadBtn) loadBtn.onclick = function() {
  alert('Load from backend coming soon!');
};

// --- Init ---
resetTierList();
renderTierList();
renderUploadedImages();
showPublicView = () => {};
showPersonalView = () => {}; 