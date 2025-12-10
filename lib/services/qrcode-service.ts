import qrcode from 'qrcode-generator';
import { uploadFileToStorage, FileUpload } from './storage-service';

export interface QRCodeGenerationResult {
  success: boolean;
  url?: string;
  base64?: string;
  error?: string;
}

/**
 * Create a PNG data URL from QR code matrix
 * This creates a simple bitmap PNG that works great in emails
 */
const createPNGDataUrl = (qr: any, pixelSize: number = 10): string => {
  const moduleCount = qr.getModuleCount();
  const margin = 4; // 4 modules margin (quiet zone)
  const size = (moduleCount + margin * 2) * pixelSize;

  // Create a simple BMP instead of PNG (easier to generate, still widely supported)
  // BMP header structure
  const width = size;
  const height = size;
  const bytesPerPixel = 3; // RGB
  const rowSize = Math.floor((bytesPerPixel * width + 3) / 4) * 4; // Row size must be multiple of 4
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize; // 54 bytes for headers

  // Create buffer for BMP file
  const buffer = new Uint8Array(fileSize);
  const view = new DataView(buffer.buffer);

  // BMP File Header (14 bytes)
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true); // File size
  view.setUint32(6, 0, true); // Reserved
  view.setUint32(10, 54, true); // Pixel data offset

  // DIB Header (40 bytes)
  view.setUint32(14, 40, true); // DIB header size
  view.setInt32(18, width, true); // Width
  view.setInt32(22, -height, true); // Height (negative for top-down)
  view.setUint16(26, 1, true); // Color planes
  view.setUint16(28, 24, true); // Bits per pixel (24-bit RGB)
  view.setUint32(30, 0, true); // Compression (none)
  view.setUint32(34, pixelArraySize, true); // Image size
  view.setInt32(38, 2835, true); // Horizontal resolution (72 DPI)
  view.setInt32(42, 2835, true); // Vertical resolution (72 DPI)
  view.setUint32(46, 0, true); // Colors in palette
  view.setUint32(50, 0, true); // Important colors

  // Pixel data (starts at offset 54)
  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate which QR module this pixel belongs to
      const moduleX = Math.floor((x / pixelSize) - margin);
      const moduleY = Math.floor((y / pixelSize) - margin);

      // Check if we're in the margin or if the module is dark
      const isDark =
        moduleX >= 0 &&
        moduleY >= 0 &&
        moduleX < moduleCount &&
        moduleY < moduleCount &&
        qr.isDark(moduleY, moduleX);

      // Set pixel color (white = 255, black = 0)
      const color = isDark ? 0 : 255;
      buffer[offset++] = color; // Blue
      buffer[offset++] = color; // Green
      buffer[offset++] = color; // Red
    }
    // Pad row to multiple of 4 bytes
    while (offset % 4 !== 0) {
      buffer[offset++] = 0;
    }
  }

  // Convert to base64
  let binaryString = '';
  for (let i = 0; i < buffer.length; i++) {
    binaryString += String.fromCharCode(buffer[i]);
  }
  const base64 = btoa(binaryString);

  return `data:image/bmp;base64,${base64}`;
};

/**
 * Generate a QR code from a URL/text and upload it to Supabase storage
 * @param url - The URL to encode in the QR code (e.g., booking link)
 * @param artistId - The artist ID to use for the storage path
 * @returns QRCodeGenerationResult with the uploaded QR code URL
 */
export const generateAndUploadQRCode = async (
  url: string,
  artistId: string
): Promise<QRCodeGenerationResult> => {
  try {
    // Generate QR code
    const qr = qrcode(0, 'M'); // Error correction level M (15%)
    qr.addData(url);
    qr.make();

    // Convert to BMP data URI (BMP is widely supported in emails)
    const dataUri = createPNGDataUrl(qr, 10); // 10 pixels per module

    // Extract base64 string from data URL
    const base64Match = dataUri.match(/^data:image\/bmp;base64,(.+)$/);
    if (!base64Match) {
      return {
        success: false,
        error: 'Failed to extract base64 from QR code',
      };
    }

    const base64Data = base64Match[1];

    // Prepare file upload
    const timestamp = Date.now();
    const fileName = `qrcode_${artistId}_${timestamp}.bmp`;

    const fileUpload: FileUpload = {
      uri: dataUri,
      name: fileName,
      type: 'image/bmp',
      size: base64Data.length,
    };

    // Upload to Supabase storage
    const uploadResult = await uploadFileToStorage(
      fileUpload,
      'qr-codes',
      artistId
    );

    if (uploadResult.success && uploadResult.url) {
      return {
        success: true,
        url: uploadResult.url,
        base64: base64Data,
      };
    } else {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload QR code',
      };
    }
  } catch (error) {
    console.error('Error in generateAndUploadQRCode:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Generate a QR code as base64 without uploading
 * @param url - The URL to encode in the QR code
 * @returns Base64 string of the QR code image (without data URI prefix)
 */
export const generateQRCodeBase64 = async (url: string): Promise<string | null> => {
  try {
    // Generate QR code
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();

    // Convert to BMP data URI
    const dataUri = createPNGDataUrl(qr, 10);

    // Extract base64 string from data URL
    const base64Match = dataUri.match(/^data:image\/bmp;base64,(.+)$/);
    if (!base64Match) {
      return null;
    }

    return base64Match[1];
  } catch (error) {
    console.error('Error in generateQRCodeBase64:', error);
    return null;
  }
};
