# Updated Next.js Sign Page Code

Here's the corrected Next.js code for your sign page:

```typescript
'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PdfEditor = dynamic(() => import('@/components/common/PdfEditor'), {
  ssr: false,
});

function SignPage() {
  const router = useRouter();

  const samplePdf =
    'https://rrjceacgpemebgmooeny.supabase.co/storage/v1/object/public/artist-waivers/672b9cf2-58a6-4eb8-a3cb-286bc67b749b/1764955869975_lpkz8vgy_23f6be43-af08-448a-9f6e-8c1a27acc97a.pdf';

  // Check if we're in a React Native WebView
  const isInWebView = typeof window !== 'undefined' && 
    typeof (window as any).ReactNativeWebView !== 'undefined';

  // Listen for messages from React Native
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        // Handle messages from React Native WebView
        if (event.data && typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'TRIGGER_SIGN') {
            // If you need to trigger signing from React Native button
            console.log('Received TRIGGER_SIGN message');
            // You can trigger signing here if needed
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSignedPdfReady = async ({ blob, objectUrl }: { blob: Blob; objectUrl: string }) => {
    try {
      if (isInWebView) {
        // IMPORTANT: Convert blob to base64 for React Native
        // Blob URLs from WebViews are not accessible in React Native
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          
          // Send base64 data URI to React Native
          const message = JSON.stringify({
            type: 'SIGNED_PDF_READY',
            payload: {
              downloadUrl: base64data, // Send base64 data URI instead of blob URL
            },
          });

          console.log('Sending base64 PDF to React Native');
          
          // Send the message to React Native
          (window as any).ReactNativeWebView.postMessage(message);
        };
        
        reader.onerror = (error) => {
          console.error('Error reading blob:', error);
        };
        
        // Read blob as data URL (base64)
        reader.readAsDataURL(blob);
      } else {
        // For browser testing, you can use the blob URL
        console.log('Signed PDF ready', { blob, objectUrl });
        // router.push('/'); // or your main page route
      }
    } catch (error) {
      console.error('Error in handleSignedPdfReady:', error);
    }
  };

  return (
    <PdfEditor
      pdfUrl={samplePdf}
      onSignedPdfReady={handleSignedPdfReady}
    />
  );
}

export default SignPage;
```

## Key Changes:

1. **Added useEffect to check WebView availability**: Checks if `ReactNativeWebView` is available
2. **Added message listener**: Listens for messages from React Native (like TRIGGER_SIGN)
3. **Convert blob to base64**: Uses FileReader to convert blob to base64 data URI for React Native compatibility
4. **Improved error handling**: Added try-catch blocks and error handlers
5. **Better logging**: Added console logs to debug message sending
6. **Fixed message format**: Ensures the message is properly stringified

## Important Note:

**Blob URLs are not accessible in React Native!** The WebView must convert the blob to base64 before sending it to React Native. The code above uses `FileReader.readAsDataURL()` to convert the blob to a base64 data URI (format: `data:application/pdf;base64,<base64-data>`), which React Native can then upload to storage.

## Debugging Tips:

1. **Check if ReactNativeWebView is available**: Add this in your Next.js page:
   ```javascript
   useEffect(() => {
     console.log('ReactNativeWebView available:', typeof window !== 'undefined' && typeof (window as any).ReactNativeWebView !== 'undefined');
   }, []);
   ```

2. **Test message sending**: Add this before sending:
   ```javascript
   if (isInWebView) {
     console.log('About to send message:', message);
     (window as any).ReactNativeWebView.postMessage(message);
     console.log('Message sent');
   } else {
     console.warn('Not in WebView, cannot send message');
   }
   ```

3. **Check WebView console**: Make sure to check both React Native console and browser console (if testing in browser)

