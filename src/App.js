import React, { useState } from 'react';
import {
  applyGammaCorrection,
  applyHistogramEqualization,
  applyLaplacianFiltering,
  applySobelOperator,
  applyLowpassIdealFilter,
  applyLowpassGaussianFilter,
  applyHighpassIdealFilter,
  applyHighpassGaussianFilter,
} from './enhancementAlgorithms';

import "./style.css"

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [algorithm, setAlgorithm] = useState('');

  // Load Image
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(0, 0, img.width, img.height);
        setOriginalImage(imageData);
      };
    };

    reader.readAsDataURL(file);
  };

  // Apply Enhancement Algorithm
  const applyEnhancement = () => {
    if (!originalImage) {
      alert('Please upload an image first!');
      return;
    }

    let enhancedImage;
    switch (algorithm) {
      case 'gamma':
        enhancedImage = applyGammaCorrection(originalImage, 2.2);
        break;
      case 'histogram':
        enhancedImage = applyHistogramEqualization(originalImage);
        break;
      case 'laplacian':
        enhancedImage = applyLaplacianFiltering(originalImage);
        break;
      case 'sobel':
        enhancedImage = applySobelOperator(originalImage);
        break;
      case 'lowpassIdeal':
        const sigma = 2.0;
        enhancedImage = applyLowpassIdealFilter(originalImage, sigma); // Example cutoff
        break;
      case 'lowpassGaussian':
        enhancedImage = applyLowpassGaussianFilter(originalImage, 1.5);
        break;
      case 'highpassIdeal':
        enhancedImage = applyHighpassIdealFilter(originalImage, 2.0); // Example cutoff
        break;
      case 'highpassGaussian':
        enhancedImage = applyHighpassGaussianFilter(originalImage, 1.5);
        break;
      default:
        alert('Please select an algorithm!');
        return;
    }

    setProcessedImage(enhancedImage);
  };

  // Render Image to Canvas
  const renderImage = (canvasId, imageData) => {
    const canvas = document.getElementById(canvasId);
    if (canvas && imageData) {
      const context = canvas.getContext('2d');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      context.putImageData(imageData, 0, 0);
    }
  };

  return (
    <div>
      <h1>Image Enhancement Algorithms</h1>

      {/* Upload Image */}
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <div>
        <label>
          <b>Select Algorithm:</b>
        </label>
        <select onChange={(e) => setAlgorithm(e.target.value)}>
          <option value="">-- Select --</option>
          <option value="gamma">Gamma Correction</option>
          <option value="histogram">Histogram Equalization</option>
          <option value="laplacian">Laplacian Filtering</option>
          <option value="sobel">Sobel Operator</option>
          <option value="lowpassIdeal">Lowpass Ideal Filter</option>
          <option value="lowpassGaussian">Lowpass Gaussian Filter</option>
          <option value="highpassIdeal">Highpass Ideal Filter</option>
          <option value="highpassGaussian">Highpass Gaussian Filter</option>
        </select>
      </div>

      {/* Apply Enhancement */}
      <button onClick={applyEnhancement}>Apply</button>

      {/* Original Image */}
      <div>
        <h3>Original Image</h3>
        <canvas id="originalCanvas"></canvas>
      </div>

      {/* Processed Image */}
      <div>
        <h3>Processed Image</h3>
        <canvas id="processedCanvas"></canvas>
      </div>

      {/* Render Images */}
      {originalImage && renderImage('originalCanvas', originalImage)}
      {processedImage && renderImage('processedCanvas', processedImage)}
    </div>
  );
}

export default App;
