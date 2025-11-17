import * as Font from 'expo-font';

// Define your custom fonts here
// Place your font files in assets/fonts/ directory
export const customFonts = {
  // Primary fonts - using the same font file for all weights since we only have single-weight fonts
  'ArialCE': require('@/assets/fonts/arial_ce.ttf'),
  'Arial': require('@/assets/fonts/arial.ttf'),
  'Noto': require('@/assets/fonts/noto.ttf'),
  
  // Add more fonts as needed
  // 'Bebas-Neue': require('@/assets/fonts/BebasNeue-Regular.ttf'),
  // 'Oswald-Bold': require('@/assets/fonts/Oswald-Bold.ttf'),
  // 'Roboto-Regular': require('@/assets/fonts/Roboto-Regular.ttf'),
  // 'Roboto-Bold': require('@/assets/fonts/Roboto-Bold.ttf'),
};

// Font family mapping for different text styles
export const fontFamilies = {
  // Primary font families with fallbacks for Android
  primary: 'ArialCE, Arial, system-ui, -apple-system, sans-serif',
  arial: 'ArialCE, Arial, system-ui, -apple-system, sans-serif',
  
  // Add more font family mappings as needed
  // heading: 'Bebas-Neue, system-ui, -apple-system, sans-serif',
  // body: 'Roboto-Regular, system-ui, -apple-system, sans-serif',
  // bold: 'Roboto-Bold, system-ui, -apple-system, sans-serif',
};


// Function to check if fonts are loaded
export function areFontsLoaded(): boolean {
  return Object.keys(customFonts).every(fontName => 
    Font.isLoaded(fontName)
  );
}

// Function to preload fonts for better Android compatibility
export async function preloadFonts(): Promise<void> {
  try {
    await Font.loadAsync(customFonts);
  } catch (error) {
    console.warn('Font preloading failed:', error);
    // Continue with fallback fonts
  }
}

// Font weight mapping for Android compatibility
export const fontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// Get font family with weight for Android
export function getFontFamilyWithWeight(fontFamily: string, weight: keyof typeof fontWeights = 'normal'): string {
  // For Android, we need to use the specific font name
  if (fontFamily === 'arial') {
    return 'ArialCE';
  }
  if (fontFamily === 'noto') {
    return 'Noto';
  }
  return fontFamily;
}