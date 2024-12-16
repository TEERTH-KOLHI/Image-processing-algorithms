// Helper: Apply Convolution to an Image
function applyConvolution(imageData, kernel) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  const kernelSize = kernel.length;
  const half = Math.floor(kernelSize / 2);

  // Ensure the kernel is not undefined or empty
  if (!kernel || kernel.length === 0 || kernel[0].length === 0) {
    throw new Error('Invalid kernel');
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          // Calculate the pixel's corresponding index in the image
          const pixelX = Math.min(width - 1, Math.max(0, x + kx));
          const pixelY = Math.min(height - 1, Math.max(0, y + ky));
          const pixelIndex = (pixelY * width + pixelX) * 4;
          const weight = kernel[ky + half][kx + half];

          // Accumulate color values based on the kernel's weight
          r += data[pixelIndex] * weight;
          g += data[pixelIndex + 1] * weight;
          b += data[pixelIndex + 2] * weight;
        }
      }

      // Set the new pixel color values, ensuring they stay within the range [0, 255]
      const index = (y * width + x) * 4;
      output[index] = Math.min(Math.max(r, 0), 255);
      output[index + 1] = Math.min(Math.max(g, 0), 255);
      output[index + 2] = Math.min(Math.max(b, 0), 255);
      output[index + 3] = data[index + 3]; // Preserve alpha
    }
  }

  return new ImageData(output, width, height);
}

// Helper: Create Gaussian Kernel
function createGaussianKernel(size, sigma) {
  const kernel = [];
  const mean = Math.floor(size / 2);
  let sum = 0;

  // Generate the Gaussian kernel matrix
  for (let x = 0; x < size; x++) {
    kernel[x] = [];
    for (let y = 0; y < size; y++) {
      const value =
        Math.exp(
          -0.5 *
            (Math.pow((x - mean) / sigma, 2) + Math.pow((y - mean) / sigma, 2))
        ) /
        (2 * Math.PI * sigma * sigma);
      kernel[x][y] = value;
      sum += value;
    }
  }

  // Normalize the kernel
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      kernel[x][y] /= sum;
    }
  }

  return kernel;
}

// 1. Gamma Correction
export function applyGammaCorrection(imageData, gamma) {
  const output = new Uint8ClampedArray(imageData.data);
  const gammaCorrection = 1 / gamma;

  // Apply gamma correction to each pixel
  for (let i = 0; i < imageData.data.length; i += 4) {
    output[i] = 255 * Math.pow(imageData.data[i] / 255, gammaCorrection);
    output[i + 1] =
      255 * Math.pow(imageData.data[i + 1] / 255, gammaCorrection);
    output[i + 2] =
      255 * Math.pow(imageData.data[i + 2] / 255, gammaCorrection);
    output[i + 3] = imageData.data[i + 3]; // Alpha
  }

  return new ImageData(output, imageData.width, imageData.height);
}

// 2. Histogram Equalization
export function applyHistogramEqualization(imageData) {
  const histogram = new Array(256).fill(0);
  const cdf = new Array(256).fill(0);
  const totalPixels = imageData.width * imageData.height;
  const output = new Uint8ClampedArray(imageData.data);

  // Build histogram
  for (let i = 0; i < imageData.data.length; i += 4) {
    const gray = Math.round(
      0.299 * imageData.data[i] +
        0.587 * imageData.data[i + 1] +
        0.114 * imageData.data[i + 2]
    );
    histogram[gray]++;
  }

  // Compute CDF (Cumulative Distribution Function)
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Apply histogram equalization
  for (let i = 0; i < imageData.data.length; i += 4) {
    const gray = Math.round(
      0.299 * imageData.data[i] +
        0.587 * imageData.data[i + 1] +
        0.114 * imageData.data[i + 2]
    );
    const equalized = Math.round((cdf[gray] / totalPixels) * 255);

    output[i] = output[i + 1] = output[i + 2] = equalized;
    output[i + 3] = imageData.data[i + 3]; // Alpha
  }

  return new ImageData(output, imageData.width, imageData.height);
}

// 3. Laplacian Filtering
export function applyLaplacianFiltering(imageData) {
  const kernel = [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0],
  ];
  return applyConvolution(imageData, kernel);
}

// 4. Sobel Operator
export function applySobelOperator(imageData) {
  const gx = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];
  const gy = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  const gradientX = applyConvolution(imageData, gx);
  const gradientY = applyConvolution(imageData, gy);

  const output = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const magnitude = Math.sqrt(
      gradientX.data[i] ** 2 + gradientY.data[i] ** 2
    );
    output[i] = output[i + 1] = output[i + 2] = magnitude;
    output[i + 3] = imageData.data[i + 3]; // Alpha
  }

  return new ImageData(output, imageData.width, imageData.height);
}

// 5. Lowpass Ideal Filter (LPIF)

export function applyLowpassIdealFilter(imageData, sigma) {
  // Calculate kernel size based on sigma, ensure it's an odd number
  let size = Math.ceil(sigma * 6); // Typically, kernel size is around 6 * sigma
  if (size % 2 === 0) size++; // Ensure the kernel size is odd

  // Create a Gaussian kernel with the determined size
  const kernel = createGaussianKernel(size, sigma);

  // Ensure the kernel is not undefined or empty
  if (!kernel || kernel.length === 0 || kernel[0].length === 0) {
    throw new Error('Invalid Gaussian kernel generated');
  }

  // Apply convolution with the generated kernel
  return applyConvolution(imageData, kernel);
}

// 5. Lowpass Gaussian Filter (LPGF)
export function applyLowpassGaussianFilter(imageData, sigma) {
  const size = Math.ceil(sigma * 6); // Size of the kernel, typically 6*sigma
  const kernel = createGaussianKernel(size, sigma); // Create Gaussian kernel with specified size and sigma

  return applyConvolution(imageData, kernel); // Apply the Gaussian kernel using convolution
}

// 6. Highpass Gaussian Filter (HPGF)
export function applyHighpassGaussianFilter(imageData, sigma) {
  const kernel = createGaussianKernel(5, sigma); // Example kernel size 5
  return applyConvolution(imageData, kernel);
}
// 7. Highpass Ideal Filter (HPIF)
export function applyHighpassIdealFilter(imageData, cutoff) {
  // Step 1: Calculate kernel size based on cutoff
  let size = Math.floor(cutoff * 2); // Kernel size based on cutoff (rough estimate)
  if (size % 2 === 0) size++; // Ensure kernel size is odd

  // Step 2: Create Low-pass Gaussian Kernel
  const lowPassKernel = createGaussianKernel(size, cutoff);

  // Step 3: Create High-pass Kernel by subtracting Low-pass kernel from 1
  // Use let to allow modification of the high-pass kernel array
  let highPassKernel = lowPassKernel.map(
    (row) => row.map((value) => 1 - value) // Subtract each value from 1
  );

  // Step 4: Check if the High-pass kernel is valid (non-empty)
  if (
    !highPassKernel ||
    highPassKernel.length === 0 ||
    highPassKernel[0].length === 0
  ) {
    throw new Error('Invalid Highpass kernel generated');
  }

  // Step 5: Apply the high-pass filter using convolution
  return applyConvolution(imageData, highPassKernel);
}
