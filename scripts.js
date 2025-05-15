// Define type interfaces (using JSDoc for TypeScript-like typing in JavaScript)

/**
 * @typedef {'malaria' | 'pneumonia'} DiseaseType
 */

/**
 * @typedef {'positive' | 'negative' | 'pending'} ResultType
 */

/**
 * @typedef {Object} PredictionResult
 * @property {DiseaseType} disease
 * @property {ResultType} result
 * @property {number} confidence
 * @property {string} gradCamUrl
 */

// State management
const state = {
  activeTab: /** @type {DiseaseType} */ ('malaria'),
  isProcessing: false,
  results: {
    malaria: /** @type {PredictionResult | null} */ (null),
    pneumonia: /** @type {PredictionResult | null} */ (null)
  }
};

// Cache DOM elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const uploadButtons = {
  malaria: document.getElementById('malaria-upload-button'),
  pneumonia: document.getElementById('pneumonia-upload-button')
};
const fileInputs = {
  malaria: /** @type {HTMLInputElement} */ (document.getElementById('malaria-file-input')),
  pneumonia: /** @type {HTMLInputElement} */ (document.getElementById('pneumonia-file-input'))
};
const uploadAreas = {
  malaria: document.getElementById('malaria-upload-area'),
  pneumonia: document.getElementById('pneumonia-upload-area')
};
const previewImages = {
  malaria: /** @type {HTMLImageElement} */ (uploadAreas.malaria.querySelector('.preview-image')),
  pneumonia: /** @type {HTMLImageElement} */ (uploadAreas.pneumonia.querySelector('.preview-image'))
};
const statusElements = {
  malaria: document.getElementById('malaria-status'),
  pneumonia: document.getElementById('pneumonia-status')
};
const confidenceElements = {
  malaria: document.getElementById('malaria-confidence'),
  pneumonia: document.getElementById('pneumonia-confidence')
};
const progressElements = {
  malaria: document.getElementById('malaria-progress'),
  pneumonia: document.getElementById('pneumonia-progress')
};
const gradCamImages = {
  malaria: /** @type {HTMLImageElement} */ (document.getElementById('malaria-gradcam')),
  pneumonia: /** @type {HTMLImageElement} */ (document.getElementById('pneumonia-gradcam'))
};
const resultsContainers = {
  malaria: {
    placeholder: document.querySelector('#malaria-results-container .results-placeholder'),
    data: document.querySelector('#malaria-results-container .results-data')
  },
  pneumonia: {
    placeholder: document.querySelector('#pneumonia-results-container .results-placeholder'),
    data: document.querySelector('#pneumonia-results-container .results-data')
  }
};

// Toast container
const toastContainer = document.getElementById('toast-container');

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tab = /** @type {DiseaseType} */ (button.getAttribute('data-tab'));
      switchTab(tab);
    });
  });

  // Upload buttons
  uploadButtons.malaria.addEventListener('click', () => {
    fileInputs.malaria.click();
  });
  uploadButtons.pneumonia.addEventListener('click', () => {
    fileInputs.pneumonia.click();
  });

  // File inputs
  fileInputs.malaria.addEventListener('change', (e) => {
    handleFileSelect(e, 'malaria');
  });
  fileInputs.pneumonia.addEventListener('change', (e) => {
    handleFileSelect(e, 'pneumonia');
  });

  // Upload areas for drag and drop
  setupDragAndDrop(uploadAreas.malaria, 'malaria');
  setupDragAndDrop(uploadAreas.pneumonia, 'pneumonia');

  // Click on upload area
  uploadAreas.malaria.addEventListener('click', () => {
    if (!state.isProcessing) {
      fileInputs.malaria.click();
    }
  });
  uploadAreas.pneumonia.addEventListener('click', () => {
    if (!state.isProcessing) {
      fileInputs.pneumonia.click();
    }
  });
}

/**
 * Set up drag and drop functionality
 * @param {HTMLElement} element 
 * @param {DiseaseType} diseaseType 
 */
function setupDragAndDrop(element, diseaseType) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    element.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    element.addEventListener(eventName, () => {
      element.classList.add('active');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    element.addEventListener(eventName, () => {
      element.classList.remove('active');
    });
  });

  element.addEventListener('drop', (e) => {
    if (state.isProcessing) return;
    
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      const file = dt.files[0];
      handleFileUpload(file, diseaseType);
    }
  });
}

/**
 * Handle file selection from input
 * @param {Event} e 
 * @param {DiseaseType} diseaseType 
 */
function handleFileSelect(e, diseaseType) {
  const target = /** @type {HTMLInputElement} */ (e.target);
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    handleFileUpload(file, diseaseType);
  }
}

/**
 * Handle file upload and processing
 * @param {File} file 
 * @param {DiseaseType} diseaseType 
 */
function handleFileUpload(file, diseaseType) {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    showToast('Error', 'Please upload an image file.', 'error');
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onload = () => {
    previewImages[diseaseType].src = /** @type {string} */ (reader.result);
    previewImages[diseaseType].classList.remove('hidden');
    uploadAreas[diseaseType].querySelector('.upload-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);

  // Process the image
  processImage(file, diseaseType);
}

/**
 * Switch active tab
 * @param {DiseaseType} tab 
 */
function switchTab(tab) {
  state.activeTab = tab;
  
  // Update tab buttons
  tabButtons.forEach(button => {
    if (button.getAttribute('data-tab') === tab) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update tab content
  tabContents.forEach(content => {
    if (content.getAttribute('data-tab') === tab) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

/**
 * Process the uploaded image with AI backend
 * @param {File} file 
 * @param {DiseaseType} diseaseType 
 */
async function processImage(file, diseaseType) {
  state.isProcessing = true;
  
  // Show toast notification
  showToast(
    'Processing Image', 
    `Analyzing image for ${diseaseType === 'malaria' ? 'Malaria' : 'Pneumonia'}...`
  );
  
  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);

    // Send image to backend API
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to get prediction from server');
    }

    const data = await response.json();

    // Expected backend JSON format:
    // {
    //   disease: "malaria" or "pneumonia",
    //   result: "positive" or "negative",
    //   confidence: number (0-100),
    //   gradCamUrl: string (URL or base64 of gradcam image)
    // }

    // Update the state with the result
    state.results[diseaseType] = {
      disease: data.disease || diseaseType,
      result: data.result,
      confidence: data.confidence,
      gradCamUrl: data.gradCamUrl || ''
    };
    
    // Update UI with results
    updateResultsUI(diseaseType, state.results[diseaseType]);
    
    // Show completion toast
    showToast(
      'Analysis Complete', 
      `${diseaseType === 'malaria' ? 'Malaria' : 'Pneumonia'} analysis finished.`
    );
  } catch (error) {
    console.error(error);
    showToast('Error', 'Failed to process the image. Please try again.', 'error');
  } finally {
    state.isProcessing = false;
  }
}

/**
 * Update the UI with the prediction results
 * @param {DiseaseType} diseaseType 
 * @param {PredictionResult} result 
 */
function updateResultsUI(diseaseType, result) {
  // Update status text
  const statusText = result.result === 'positive' ? 'Detected' : 'Not Detected';
  statusElements[diseaseType].textContent = statusText;
  
  // Update status color
  statusElements[diseaseType].className = 'result-status';
  statusElements[diseaseType].classList.add(
    result.result === 'positive' ? 'status-positive' : 'status-negative'
  );
  
  // Update confidence
  confidenceElements[diseaseType].textContent = `${Math.round(result.confidence)}%`;
  
  // Update progress bar
  progressElements[diseaseType].style.width = `${result.confidence}%`;
  
  // Update Grad-CAM image if available
  if (result.gradCamUrl) {
    gradCamImages[diseaseType].src = result.gradCamUrl;
    gradCamImages[diseaseType].classList.remove('hidden');
  } else {
    gradCamImages[diseaseType].classList.add('hidden');
  }
  
  // Show results data, hide placeholder
  resultsContainers[diseaseType].placeholder.classList.add('hidden');
  resultsContainers[diseaseType].data.classList.remove('hidden');
}

/**
 * Show toast notification
 * @param {string} title 
 * @param {string} message 
 * @param {'default' | 'error'} type 
 */
function showToast(title, message, type = 'default') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-description">${message}</div>
    </div>
    <button class="toast-close">x</button>
  `;
  
  // Add to toast container
  toastContainer.appendChild(toast);
  
  // Setup close button
  const closeButton = toast.querySelector('.toast-close');
  closeButton.addEventListener('click', () => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
}
  // Auto remove after 5 seconds
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  switchTab(state.activeTab);
});

