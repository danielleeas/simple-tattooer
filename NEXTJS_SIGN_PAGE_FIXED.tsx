'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PdfEditor = dynamic(() => import('@/components/common/PdfEditor'), {
  ssr: false,
});

function SignPage() {
  const router = useRouter();
  const [isWebViewReady, setIsWebViewReady] = useState(false);

  const samplePdf =
    'https://rrjceacgpemebgmooeny.supabase.co/storage/v1/object/public/artist-waivers/672b9cf2-58a6-4eb8-a3cb-286bc67b749b/1764955869975_lpkz8vgy_23f6be43-af08-448a-9f6e-8c1a27acc97a.pdf';

  // Check if we're in a React Native WebView
  const checkWebView = () => {
    if (typeof window === 'undefined') return false;
    const isInWebView = typeof (window as any).ReactNativeWebView !== 'undefined';
    console.log('🔍 WebView Check:', {
      isInWebView,
      hasWindow: typeof window !== 'undefined',
      hasReactNativeWebView: typeof (window as any).ReactNativeWebView !== 'undefined',
      ReactNativeWebView: (window as any).ReactNativeWebView,
    });
    return isInWebView;
  };

  const [isInWebView, setIsInWebView] = useState(false);

  // Check WebView availability on mount and periodically
  useEffect(() => {
    const check = () => {
      const result = checkWebView();
      setIsInWebView(result);
      setIsWebViewReady(result);
    };

    // Check immediately
    check();

    // Check periodically in case WebView loads later
    const interval = setInterval(check, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for messages from React Native
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        console.log('📨 Received window message event:', event);
        // Handle messages from React Native WebView
        if (event.data && typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          console.log('📨 Parsed message data:', data);
          if (data.type === 'TRIGGER_SIGN') {
            console.log('✅ Received TRIGGER_SIGN message from React Native');
            // You can trigger signing here if needed
          }
        }
      } catch (error) {
        console.error('❌ Error handling message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('👂 Added window message listener');

    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('🔇 Removed window message listener');
    };
  }, []);

  const handleSignedPdfReady = async ({ blob, objectUrl }: { blob: Blob; objectUrl: string }) => {
    console.log('🎉 ========== handleSignedPdfReady CALLED ==========');
    console.log('📄 Blob:', blob);
    console.log('🔗 Object URL:', objectUrl);
    console.log('🌐 Is in WebView:', isInWebView);
    console.log('✅ WebView ready:', isWebViewReady);

    try {
      const downloadUrl = objectUrl;
      console.log('📥 Download URL:', downloadUrl);

      if (isInWebView && isWebViewReady) {
        const message = JSON.stringify({
          type: 'SIGNED_PDF_READY',
          payload: {
            downloadUrl,
          },
        });

        console.log('📤 Preparing to send message to React Native:');
        console.log('   Message:', message);
        console.log('   ReactNativeWebView available:', typeof (window as any).ReactNativeWebView !== 'undefined');
        console.log('   ReactNativeWebView object:', (window as any).ReactNativeWebView);

        try {
          // Double check before sending
          if (typeof (window as any).ReactNativeWebView === 'undefined') {
            console.error('❌ ReactNativeWebView is undefined! Cannot send message.');
            return;
          }

          (window as any).ReactNativeWebView.postMessage(message);
          console.log('✅ Message sent successfully to React Native');
        } catch (sendError) {
          console.error('❌ Error sending message to React Native:', sendError);
        }
      } else {
        console.warn('⚠️ Not in WebView or WebView not ready');
        console.log('   isInWebView:', isInWebView);
        console.log('   isWebViewReady:', isWebViewReady);
        console.log('   For browser testing - Signed PDF ready', { blob, downloadUrl });
      }
    } catch (error) {
      console.error('❌ Error in handleSignedPdfReady:', error);
      console.error('   Error details:', error);
    }
  };

  // Add a test function to manually trigger (for debugging)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testSendMessage = () => {
        console.log('🧪 Test function called');
        const message = JSON.stringify({
          type: 'SIGNED_PDF_READY',
          payload: {
            downloadUrl: 'https://test-url.com/test.pdf',
          },
        });
        if (typeof (window as any).ReactNativeWebView !== 'undefined') {
          (window as any).ReactNativeWebView.postMessage(message);
          console.log('✅ Test message sent');
        } else {
          console.error('❌ ReactNativeWebView not available for test');
        }
      };
      console.log('🧪 Test function available at window.testSendMessage()');
    }
  }, []);

  console.log('🔄 SignPage render - isInWebView:', isInWebView, 'isWebViewReady:', isWebViewReady);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PdfEditor
        pdfUrl={samplePdf}
        onSignedPdfReady={handleSignedPdfReady}
      />
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          fontSize: '12px',
          zIndex: 9999,
        }}>
          <div>WebView: {isInWebView ? '✅ Yes' : '❌ No'}</div>
          <div>Ready: {isWebViewReady ? '✅ Yes' : '❌ No'}</div>
          <div>ReactNativeWebView: {typeof (window as any).ReactNativeWebView !== 'undefined' ? '✅ Available' : '❌ Not Available'}</div>
          <button 
            onClick={() => {
              console.log('🧪 Manual test button clicked');
              if (typeof (window as any).testSendMessage === 'function') {
                (window as any).testSendMessage();
              }
            }}
            style={{ marginTop: '5px', padding: '5px 10px' }}
          >
            Test Send Message
          </button>
        </div>
      )}
    </div>
  );
}

export default SignPage;

