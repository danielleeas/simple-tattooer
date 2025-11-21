import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

export * from './network-utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buildBookingLink = (base: string, suffix: string): string => {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedSuffix = suffix.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedSuffix}`;
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

export const uuidv4 = (): string => {
  // Use native implementation if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeCrypto = (global as any)?.crypto;
  if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
    return maybeCrypto.randomUUID();
  }

  // Fallback generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const convertTimeToISOString = (time: string) => {
  // time is in format "HH:MM" (e.g., "07:50")
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

export const convertTimeToHHMMString = (time: Date) => {
  return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
};

export function formatDate(date: string, showWeekday?: boolean, showMonth?: boolean) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [year, month, day] = date.split('-').map(Number);
  const weekday = weekdays[new Date(year, month - 1, day).getDay()];
  const monthName = months[month - 1];

  if (showWeekday) {
    return `${weekday}, ${monthName} ${day}, ${year}`;
  }

  if (showMonth) {
    return `${monthName} ${day}`;
  }

  return `${monthName} ${day}, ${year}`;
}

export const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseYmdFromDb = (s: string): Date => {
  // Expect "YYYY-MM-DD HH:mm" or "YYYY-MM-DDTHH:mm"
  const part = (s || '').split(' ')[0].split('T')[0];
  const [y, m, d] = part.split('-').map(n => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
};

export function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}