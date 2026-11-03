import { authFetch } from '../services/authService';

export interface ProcessedImageResult {
  imageUrl: string;      // 800x800 WebP (or server URL)
  imageThumbUrl: string; // 400x400 WebP (or server URL)
  width: number;
  height: number;
  sizeBytes: number;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné.' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Format d\'image non supporté. Veuillez utiliser un fichier JPG, PNG ou WebP.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `L'image est trop volumineuse (${sizeMb} Mo). La taille maximale autorisée est de 5 Mo.`,
    };
  }

  return { valid: true };
}

/**
 * Crops an image to a centered 1:1 square, resizes to target dimensions,
 * and encodes to WebP at ~80% quality.
 */
function renderSquareWebp(
  img: HTMLImageElement,
  targetSize: number,
  quality = 0.80
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Canvas 2D context non disponible.'));
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Calculate square crop from center
      const srcWidth = img.naturalWidth || img.width;
      const srcHeight = img.naturalHeight || img.height;
      const minDimension = Math.min(srcWidth, srcHeight);

      const srcX = (srcWidth - minDimension) / 2;
      const srcY = (srcHeight - minDimension) / 2;

      ctx.drawImage(
        img,
        srcX,
        srcY,
        minDimension,
        minDimension,
        0,
        0,
        targetSize,
        targetSize
      );

      // Try WebP first, fallback to JPEG if unsupported
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Full image processing pipeline:
 * Validates, loads, crops 1:1, generates 800px & 400px WebP,
 * and uploads to the server endpoint /api/upload for persistent file storage.
 */
export async function processAndUploadProductImage(
  file: File,
  productId = 'prod-' + Date.now()
): Promise<ProcessedImageResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 1. Read file as Image
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Échec de lecture du fichier image.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Impossible de charger l\'image. Le fichier est peut-être corrompu.'));
    image.src = dataUrl;
  });

  // 2. Generate 800x800 and 400x400 square 1:1 WebP
  const [largeWebp, thumbWebp] = await Promise.all([
    renderSquareWebp(img, 800, 0.82),
    renderSquareWebp(img, 400, 0.80),
  ]);

  // 3. Attempt server upload for persistent storage
  try {
    const res = await authFetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        largeBase64: largeWebp,
        thumbBase64: thumbWebp,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.imageUrl && data.imageThumbUrl) {
        return {
          imageUrl: data.imageUrl,
          imageThumbUrl: data.imageThumbUrl,
          width: 800,
          height: 800,
          sizeBytes: largeWebp.length,
        };
      }
    }
  } catch (err) {
    console.warn('Server image upload notice, falling back to embedded WebP data URL:', err);
  }

  // Safe fallback: Return compressed WebP data URLs directly (fully supported and persistent in localStorage/JSON)
  return {
    imageUrl: largeWebp,
    imageThumbUrl: thumbWebp,
    width: 800,
    height: 800,
    sizeBytes: largeWebp.length,
  };
}
