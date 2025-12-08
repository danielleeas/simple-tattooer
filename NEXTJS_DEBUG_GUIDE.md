# Next.js Server 500 Error - Debugging Guide

## The Problem
Your Next.js server at `http://192.168.145.45:3000/sign` is returning a 500 Internal Server Error.

## Step 1: Check Your Next.js Server Logs

The most important step is to check your Next.js server console/terminal where you're running `npm run dev` or `yarn dev`. The error details will be there.

Common causes:
1. **Import errors** - Missing dependencies or wrong import paths
2. **Component errors** - Errors in your PdfEditor or SignPage component
3. **API route errors** - If you have API routes that are failing
4. **Build errors** - TypeScript or compilation errors

## Step 2: Create a Simple Test Page

First, let's verify your server is working. Create a simple test page:

**File: `app/test/page.tsx`**
```typescript
export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Server is Working!</h1>
      <p>If you can see this, your Next.js server is running correctly.</p>
    </div>
  );
}
```

Then test: `http://192.168.145.45:3000/test`

## Step 3: Fix Your Sign Page

Here's a minimal working version of your sign page that should help identify the issue:

**File: `app/sign/page.tsx`**
```typescript
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Make sure PdfEditor path is correct
const PdfEditor = dynamic(() => import('@/components/common/PdfEditor'), {
  ssr: false,
  loading: () => <div>Loading PDF Editor...</div>,
});

export default function SignPage() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SignPage mounted');
    setIsReady(true);
  }, []);

  const samplePdf =
    'https://rrjceacgpemebgmooeny.supabase.co/storage/v1/object/public/artist-waivers/672b9cf2-58a6-4eb8-a3cb-286bc67b749b/1764955869975_lpkz8vgy_23f6be43-af08-448a-9f6e-8c1a27acc97a.pdf';

  const handleSignedPdfReady = async ({ blob, objectUrl }: { blob: Blob; objectUrl: string }) => {
    console.log('✅ handleSignedPdfReady called');
    console.log('Blob:', blob);
    console.log('Object URL:', objectUrl);

    const isInWebView = typeof window !== 'undefined' && 
      typeof (window as any).ReactNativeWebView !== 'undefined';

    if (isInWebView) {
      const message = JSON.stringify({
        type: 'SIGNED_PDF_READY',
        payload: {
          downloadUrl: objectUrl,
        },
      });

      console.log('Sending to React Native:', message);
      (window as any).ReactNativeWebView.postMessage(message);
    } else {
      console.log('Not in WebView - browser mode');
    }
  };

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!isReady) {
    return <div>Loading...</div>;
  }

  try {
    return (
      <div style={{ width: '100%', height: '100vh' }}>
        <PdfEditor
          pdfUrl={samplePdf}
          onSignedPdfReady={handleSignedPdfReady}
        />
      </div>
    );
  } catch (err: any) {
    console.error('Error rendering SignPage:', err);
    return (
      <div style={{ padding: '20px' }}>
        <h1>Render Error</h1>
        <p>{err.message}</p>
      </div>
    );
  }
}
```

## Step 4: Check Your PdfEditor Component

The error might be in your `PdfEditor` component. Make sure:

1. **It exists** at `@/components/common/PdfEditor`
2. **It exports correctly** - should have `export default PdfEditor`
3. **It accepts the props** - `pdfUrl` and `onSignedPdfReady`
4. **No runtime errors** - Check browser console when loading the page

## Step 5: Common Fixes

### Fix 1: Missing Dependencies
```bash
npm install
# or
yarn install
```

### Fix 2: Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Fix 3: Check Import Paths
Make sure `@/components/common/PdfEditor` resolves correctly. Check your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Fix 4: Check for TypeScript Errors
```bash
npx tsc --noEmit
```

## Step 6: Test in Browser First

Before testing in React Native WebView, test in a regular browser:
1. Open `http://192.168.145.45:3000/sign` in Chrome/Firefox
2. Open DevTools (F12)
3. Check Console tab for errors
4. Check Network tab for failed requests

## Step 7: Network Issues

If you're testing on a physical device:
1. Make sure your phone and computer are on the same network
2. Use your computer's local IP (192.168.145.45)
3. Make sure firewall allows connections on port 3000
4. Try accessing from your phone's browser first

## Quick Debug Checklist

- [ ] Next.js server is running (`npm run dev`)
- [ ] Server logs show no errors
- [ ] Test page (`/test`) works
- [ ] Sign page loads in browser (not WebView)
- [ ] PdfEditor component exists and works
- [ ] No TypeScript errors
- [ ] All dependencies installed
- [ ] Network accessible from device

## Still Not Working?

Share:
1. Your Next.js server console output (the full error)
2. Your `app/sign/page.tsx` file
3. Your `components/common/PdfEditor` component code
4. Your `package.json` dependencies

