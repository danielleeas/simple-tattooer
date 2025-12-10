import qrcode from 'qrcode-generator';
import { uploadFileToStorage, FileUpload } from './storage-service';

export interface QRCodeGenerationResult {
  success: boolean;
  url?: string;
  base64?: string;
  error?: string;
}

/**
 * Convert SVG string to base64 data URI
 * React Native can handle SVG data URIs for QR codes
 */
const svgToDataUrl = (svgString: string): string => {
  // Convert SVG to base64
  // We need to encode the SVG string properly for base64
  const utf8Bytes = new TextEncoder().encode(svgString);
  let binaryString = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binaryString += String.fromCharCode(utf8Bytes[i]);
  }
  const base64Svg = btoa(binaryString);
  return `data:image/svg+xml;base64,${base64Svg}`;
};

/**
 * Generate QR code SVG string
 */
const generateQRCodeSVG = (text: string, size: number = 512): string => {
  // Create QR code with error correction level M (15%)
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  // Get the module count (size of the QR code matrix)
  const moduleCount = qr.getModuleCount();
  const cellSize = Math.floor(size / (moduleCount + 2)); // +2 for margin
  const margin = cellSize;
  const svgSize = cellSize * moduleCount + margin * 2;

  // Generate SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;
  svg += `<rect width="${svgSize}" height="${svgSize}" fill="#ffffff"/>`;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        const x = col * cellSize + margin;
        const y = row * cellSize + margin;
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
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
    // Generate QR code SVG
    const svgString = generateQRCodeSVG(url, 512);

    // Convert to data URI
    const dataUri = svgToDataUrl(svgString);

    // Extract base64 string from data URL
    const base64Match = dataUri.match(/^data:image\/svg\+xml;base64,(.+)$/);
    if (!base64Match) {
      return {
        success: false,
        error: 'Failed to extract base64 from QR code',
      };
    }

    const base64Data = base64Match[1];

    // Prepare file upload
    const timestamp = Date.now();
    const fileName = `qrcode_${artistId}_${timestamp}.svg`;

    const fileUpload: FileUpload = {
      uri: dataUri,
      name: fileName,
      type: 'image/svg+xml',
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
    // Generate QR code SVG
    const svgString = generateQRCodeSVG(url, 512);

    // Convert to data URI
    const dataUri = svgToDataUrl(svgString);

    // Extract base64 string from data URL
    const base64Match = dataUri.match(/^data:image\/svg\+xml;base64,(.+)$/);
    if (!base64Match) {
      return null;
    }

    return base64Match[1];
  } catch (error) {
    console.error('Error in generateQRCodeBase64:', error);
    return null;
  }
};
