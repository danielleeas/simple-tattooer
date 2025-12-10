import QRCode from 'qrcode';
import { uploadFileToStorage, FileUpload } from './storage-service';

export interface QRCodeGenerationResult {
  success: boolean;
  url?: string;
  base64?: string;
  error?: string;
}

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
    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Extract base64 string from data URL
    const base64Match = qrCodeDataUrl.match(/^data:image\/png;base64,(.+)$/);
    if (!base64Match) {
      return {
        success: false,
        error: 'Failed to extract base64 from QR code',
      };
    }

    const base64Data = base64Match[1];

    // Prepare file upload
    const timestamp = Date.now();
    const fileName = `qrcode_${artistId}_${timestamp}.png`;

    const fileUpload: FileUpload = {
      uri: qrCodeDataUrl,
      name: fileName,
      type: 'image/png',
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
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Extract base64 string from data URL
    const base64Match = qrCodeDataUrl.match(/^data:image\/png;base64,(.+)$/);
    if (!base64Match) {
      return null;
    }

    return base64Match[1];
  } catch (error) {
    console.error('Error in generateQRCodeBase64:', error);
    return null;
  }
};
