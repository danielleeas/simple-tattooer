import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

export * from './network-utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sortWeekdays = (days: string[]): string[] => {
  const weekdayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  // Do not mutate the input array; return a sorted copy instead
  return [...days].sort((a, b) => {
    const indexA = weekdayOrder.indexOf(a);
    const indexB = weekdayOrder.indexOf(b);
    return indexA - indexB;
  });
};

export const compressImage = async (uri: string, quality: number = 0.3): Promise<string> => {
  try {
    // Target max size ~300KB for "light" uploads
    const TARGET_BYTES = 300 * 1024;

    // Try progressively smaller dimensions and qualities until under target size
    const candidateWidths = [1600, 1200, 1000, 800, 600, 480];
    const candidateQualities = [
      Math.max(0.1, Math.min(1, quality)),
      0.7,
      0.6,
      0.5,
      0.4,
      0.3,
      0.2
    ];

    // Helper to estimate bytes from base64 length (works cross-platform)
    const base64ToApproxBytes = (b64: string) => Math.floor((b64.length * 3) / 4);

    let bestUri = uri;
    let bestSize = Number.MAX_SAFE_INTEGER;

    for (const width of candidateWidths) {
      for (const q of candidateQualities) {
        const ctx = ImageManipulator.manipulate(uri);
        const imageRef = await ctx.resize({ width }).renderAsync();
        const result = await imageRef.saveAsync({
          compress: q,
          format: SaveFormat.JPEG,
          base64: true
        });

        // Determine size: prefer base64 length, fallback to file size when available
        let approxBytes: number | null = null;
        if (result.base64) {
          approxBytes = base64ToApproxBytes(result.base64);
        } else {
          // Use new FileSystem API (class-based) instead of deprecated getInfoAsync
          const file = new File(result.uri);
          if (file?.exists && typeof file.size === 'number') {
            approxBytes = file.size;
          }
        }

        // Update best candidate
        if (typeof approxBytes === 'number') {
          if (approxBytes < bestSize) {
            bestSize = approxBytes;
            bestUri = result.uri;
          }
        } else if (bestSize === Number.MAX_SAFE_INTEGER) {
          // If we cannot determine size at all, keep at least the first successful manipulation
          bestUri = result.uri;
        }
      }
    }

    // If we never hit the target, return the smallest we produced
    return bestUri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, return the original image
    return uri;
  }
};

export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};