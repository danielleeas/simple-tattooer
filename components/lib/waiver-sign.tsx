import { View, Modal, Dimensions, ActivityIndicator, Platform, ScrollView } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
    Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { X } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { uploadFileToStorage } from '@/lib/services/storage-service';
import { useToast } from "@/lib/contexts/toast-context";

interface WaiverSignProps {
    visible: boolean;
    onClose: () => void;
    waiverUrl: string; // PDF file URL
    onSign: (signedPdfUrl: string) => void;
    artistId?: string; // Artist ID for upload path
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const ANIMATION_DURATION = 100;

export const WaiverSign = ({ visible, onClose, waiverUrl, onSign, artistId }: WaiverSignProps) => {
    const [isRendered, setIsRendered] = useState(visible);
    const translateY = useSharedValue(screenHeight);
    const backdropOpacity = useSharedValue(0);
    const { top, bottom } = useSafeAreaInsets();
    const { toast } = useToast();

    const [htmlUri, setHtmlUri] = useState<string | null>(null);
    const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [webViewError, setWebViewError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const webViewRef = useRef<WebView>(null);

    const handleClose = () => {
        // Animate backdrop fade out
        backdropOpacity.value = withTiming(0, {
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
        });
        // Animate slide down
        translateY.value = withTiming(screenHeight, {
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
        });
        // Call onClose after animation completes
        setTimeout(() => {
            onClose();
        }, ANIMATION_DURATION);
    };

    const modalStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    useEffect(() => {
        if (visible) {
            setIsRendered(true);
            setSignedPdfUrl(null);
            setIsSigning(false);
            setWebViewError(null);
            setIsLoading(true);

            // Animate backdrop fade in
            backdropOpacity.value = withTiming(1, {
                duration: ANIMATION_DURATION,
                easing: Easing.out(Easing.ease),
            });
            // Animate slide up with spring for smooth bounce
            translateY.value = withSpring(0, {
                damping: 20,
                stiffness: 100,
                mass: 0.8,
            });
        } else {
            // If visible becomes false externally, animate out
            backdropOpacity.value = withTiming(0, {
                duration: ANIMATION_DURATION,
                easing: Easing.in(Easing.ease),
            });
            translateY.value = withTiming(screenHeight, {
                duration: ANIMATION_DURATION,
                easing: Easing.in(Easing.ease),
            });
            // Unmount after animation completes
            setTimeout(() => {
                setIsRendered(false);
            }, ANIMATION_DURATION);
        }
    }, [visible, waiverUrl]);

    const handleWebViewMessage = async (event: any) => {
        try {
            
            const messageData = event.nativeEvent.data;
            if (!messageData) {
                console.warn("No data in WebView message");
                return;
            }

            const data = typeof messageData === 'string' 
                ? JSON.parse(messageData) 
                : messageData;
            
            if (data.type === 'SIGNED_PDF_READY') {
                const downloadUrl = data.payload?.downloadUrl;
                console.log("Received SIGNED_PDF_READY with URL:", downloadUrl);
                
                if (downloadUrl) {
                    setSignedPdfUrl(downloadUrl);
                    setIsSigning(false);
                    onSign(downloadUrl);
                    handleClose();
                } else {
                    console.error("SIGNED_PDF_READY received but no downloadUrl in payload");
                }
            } else {
                // Handle other message types if needed
                console.log("WebView message (other type):", data);
            }
        } catch (error) {
            console.error("Error parsing WebView message:", error);
            console.error("Message data that failed:", event.nativeEvent?.data);
        }
    };

    const handleConfirmAndSign = () => {
        setIsSigning(true);
        // Send a message to the WebView to trigger signing
        // The WebView will handle the signing and send back the signed PDF URL
        webViewRef.current?.postMessage(
            JSON.stringify({
                type: 'TRIGGER_SIGN',
            })
        );
    };
    
    if (!isRendered) return null;

    return (
        <Modal visible={visible} onRequestClose={handleClose} transparent animationType="none">
            <View className="flex-1 justify-end items-center">
                <Animated.View
                    style={[
                        {
                            height: screenHeight,
                            width: '100%',
                            paddingTop: top,
                            paddingBottom: bottom,
                        },
                        modalStyle
                    ]}
                    className="bg-background"
                >
                    <View className="flex-1">
                        {/* Header */}
                        <View className="flex-row items-center justify-between p-4">
                            <Text variant="h6" className="leading-tight">Sign Waiver Agreement</Text>
                            <Button variant="ghost" size="icon" onPress={handleClose}>
                                <Icon as={X} size={24} />
                            </Button>
                        </View>

                        {/* PDF Viewer */}
                        <View className="flex-1" style={{ width: '100%' }}>
                            {webViewError ? (
                                <View className="flex-1 justify-center items-center p-6 bg-background">
                                    <Text variant="h6" className="text-destructive mb-2 text-center">
                                        Error Loading Page
                                    </Text>
                                    <Text className="text-text-secondary mb-4 text-center">
                                        {webViewError}
                                    </Text>
                                    <Text className="text-xs text-text-secondary mb-4 text-center">
                                        Status Code: 500 - Internal Server Error
                                    </Text>
                                    <Text className="text-xs text-text-secondary mb-4 text-center">
                                        Please check your Next.js server logs for details.
                                    </Text>
                                    <Button
                                        onPress={() => {
                                            setWebViewError(null);
                                            setIsLoading(true);
                                            webViewRef.current?.reload();
                                        }}
                                        variant="default"
                                    >
                                        <Text className="text-white">Retry</Text>
                                    </Button>
                                </View>
                            ) : (
                                <>
                                    {(isLoading || isUploading) && (
                                        <View className="absolute inset-0 justify-center items-center bg-background z-10">
                                            <ActivityIndicator size="large" />
                                            <Text className="mt-4 text-text-secondary">
                                                {isUploading ? 'Uploading waiver...' : 'Loading sign page...'}
                                            </Text>
                                        </View>
                                    )}
                                    <WebView
                                        ref={webViewRef}
                                        originWhitelist={["*"]}
                                        source={{ uri: `http://192.168.145.45:3000/sign?waiver=${waiverUrl}` }}
                                        allowFileAccess
                                        javaScriptEnabled={true}
                                        domStorageEnabled={true}
                                        onMessage={handleWebViewMessage}
                                        onError={(syntheticEvent) => {
                                            const { nativeEvent } = syntheticEvent;
                                            console.error('WebView error: ', nativeEvent);
                                            setWebViewError(nativeEvent.description || 'Unknown error occurred');
                                            setIsLoading(false);
                                        }}
                                        onHttpError={(syntheticEvent) => {
                                            const { nativeEvent } = syntheticEvent;
                                            console.error('WebView HTTP error: ', nativeEvent);
                                            const errorMsg = `HTTP ${nativeEvent.statusCode}: ${nativeEvent.description || 'Internal Server Error'}`;
                                            setWebViewError(errorMsg);
                                            setIsLoading(false);
                                        }}
                                        onLoadEnd={() => {
                                            console.log('WebView loaded');
                                            setIsLoading(false);
                                            setWebViewError(null);
                                        }}
                                        onLoadStart={() => {
                                            console.log('WebView loading started');
                                            setIsLoading(true);
                                            setWebViewError(null);
                                        }}
                                        mixedContentMode="always"
                                    />
                                </>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
