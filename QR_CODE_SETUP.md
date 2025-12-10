# QR Code Generation for Booking Links

This feature automatically generates QR codes for artist booking links and saves them to Supabase storage.

## Overview

When an artist completes the setup wizard and creates their booking link (e.g., `https://simpletattooer.com/artist/daniellee`), a QR code is automatically generated and stored in Supabase. This QR code can be sent via email or shared with clients, allowing them to easily scan it with their phone camera to open the booking link.

## How It Works

1. **Setup Wizard Flow**: When the artist completes the setup wizard in `WizardNavigation.tsx:handleFinish()`, the booking link is created.

2. **QR Code Generation**: After the artist profile is saved, the system:
   - Generates a QR code from the booking link using the `qrcode` library
   - Creates a 512x512 PNG image with black QR code on white background
   - Uploads the image to Supabase storage bucket `qr-codes`
   - Saves the QR code URL to the `artists.qr_code_url` column

3. **Storage**: QR codes are stored in Supabase Storage in the following structure:
   ```
   qr-codes/
   └── {artist_id}/
       └── qrcode_{artist_id}_{timestamp}.png
   ```

## Implementation Files

### Core Service
- **`lib/services/qrcode-service.ts`**: QR code generation service
  - `generateAndUploadQRCode(url, artistId)`: Generates QR code and uploads to storage
  - `generateQRCodeBase64(url)`: Generates QR code as base64 (without upload)

### Integration
- **`lib/services/setup-wizard-service.ts`**: Integrated into setup wizard flow
  - Line 123-146: QR code generation step after artist profile update
  - Progress indicator: "Generating QR code for booking link"

### Database Schema
- **`schema_database.sql`**: Added `qr_code_url TEXT` column to `artists` table
- **`migration_add_qr_code.sql`**: Migration file for existing databases

### Type Definitions
- **`lib/redux/types.ts`**: Added `qr_code_url?: string` to `Artist` interface

## Dependencies

- **`qrcode`**: QR code generation library
- **`@types/qrcode`**: TypeScript definitions

Install with:
```bash
npm install qrcode @types/qrcode
```

## Database Setup

### For New Databases
Use the updated `schema_database.sql` file which includes the `qr_code_url` column.

### For Existing Databases
Run the migration:
```bash
# In Supabase SQL Editor or your database client
psql -d your_database < migration_add_qr_code.sql
```

Or manually execute the SQL in the Supabase dashboard.

## Supabase Storage Setup

You need to create a storage bucket named `qr-codes`:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `qr-codes`
3. Set the bucket to **public** (so QR code images can be accessed via email)
4. Configure the following policies:

```sql
-- Allow authenticated users to upload QR codes
CREATE POLICY "Artists can upload QR codes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to QR codes
CREATE POLICY "Anyone can view QR codes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-codes');
```

## Usage

### Automatic Generation
QR codes are automatically generated when:
- An artist completes the setup wizard
- A booking link is created or updated

### Manual Generation
You can also manually generate a QR code:

```typescript
import { generateAndUploadQRCode } from '@/lib/services/qrcode-service';

const result = await generateAndUploadQRCode(
  'https://simpletattooer.com/artist/daniellee',
  'artist-id-here'
);

if (result.success) {
  console.log('QR Code URL:', result.url);
  console.log('Base64 Data:', result.base64);
} else {
  console.error('Error:', result.error);
}
```

### Get Base64 Only
If you only need the base64 string without uploading:

```typescript
import { generateQRCodeBase64 } from '@/lib/services/qrcode-service';

const base64 = await generateQRCodeBase64(
  'https://simpletattooer.com/artist/daniellee'
);

if (base64) {
  console.log('QR Code Base64:', base64);
}
```

## Accessing the QR Code

Once generated, the QR code URL is stored in the artist's profile:

```typescript
import { useAuth } from '@/lib/contexts/auth-context';

const { artist } = useAuth();

if (artist?.qr_code_url) {
  console.log('QR Code URL:', artist.qr_code_url);
  // Use this URL in emails, display in UI, etc.
}
```

## Email Integration

The QR code URL can be included in welcome emails or booking confirmation emails:

```typescript
import { sendWelcomeEmail } from '@/lib/services/setup-wizard-service';

await sendWelcomeEmail(artist, artistName, bookingLink);
// QR code URL is available at artist.qr_code_url
```

## Error Handling

QR code generation failures are non-critical and won't block the setup wizard:
- Errors are logged to the console
- Setup continues even if QR code generation fails
- Users can regenerate the QR code later if needed

## QR Code Specifications

- **Size**: 512x512 pixels
- **Format**: PNG
- **Error Correction**: Medium (M level)
- **Colors**: Black on white background
- **Margin**: 2 modules (quiet zone)

## Future Enhancements

Potential improvements:
1. Add QR code regeneration UI in artist settings
2. Allow custom QR code styling (colors, logo overlay)
3. Include QR code in email templates automatically
4. Generate multiple QR code sizes for different use cases
5. Add QR code analytics (scan tracking)

## Troubleshooting

### QR Code Not Generated
- Check Supabase storage bucket `qr-codes` exists and is public
- Verify storage policies allow authenticated uploads
- Check console logs for error messages

### QR Code Not Accessible
- Ensure the `qr-codes` bucket has public read access
- Verify the URL format: `https://[project-id].supabase.co/storage/v1/object/public/qr-codes/...`

### TypeScript Errors
- Make sure `@types/qrcode` is installed
- Run `npm install` to ensure all dependencies are available
