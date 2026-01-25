/**
 * Image compression utility using Canvas API
 * Compresses images before upload to reduce file size and upload time
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  maxSizeMB?: number;
}

const defaultOptions: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 1,
};

/**
 * Compresses an image file using canvas
 * @param file - The original image file
 * @param options - Compression options
 * @returns Promise<File> - Compressed image file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const opts = { ...defaultOptions, ...options };
  
  // Skip compression for GIFs (they lose animation)
  if (file.type === 'image/gif') {
    console.log('[compressImage] Skipping GIF compression');
    return file;
  }

  // Skip if already small enough
  const maxSizeBytes = (opts.maxSizeMB || 1) * 1024 * 1024;
  if (file.size <= maxSizeBytes) {
    console.log('[compressImage] File already small enough:', formatFileSize(file.size));
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const maxWidth = opts.maxWidth || 1920;
      const maxHeight = opts.maxHeight || 1920;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image with white background (for transparency)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      const mimeType = file.type === 'image/png' ? 'image/jpeg' : file.type;
      const quality = opts.quality || 0.8;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // If compressed is larger, return original
          if (blob.size >= file.size) {
            console.log('[compressImage] Compressed larger than original, using original');
            resolve(file);
            return;
          }

          // Create new file with compressed data
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.(png|PNG)$/, '.jpg'),
            { type: mimeType }
          );

          console.log(
            '[compressImage] Compressed:',
            formatFileSize(file.size),
            '→',
            formatFileSize(compressedFile.size),
            `(${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`
          );

          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
