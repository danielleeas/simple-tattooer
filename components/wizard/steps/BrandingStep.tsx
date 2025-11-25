import React from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { AvatarPicker } from '@/components/lib/avatar-picker';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';

export function BrandingStep() {
  const { branding, updateBranding } = useSetupWizard();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="gap-6 pb-4">
        <View className="gap-6">
          <View className="items-center justify-center">
            <Image
              source={require('@/assets/images/icons/camera.png')}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
            <Text variant="h6" className="text-center uppercase">Artist</Text>
            <Text variant="h6" className="text-center uppercase leading-none">branding</Text>
          </View>
        </View>
        <View className="gap-4">
          <View>
            <Text variant="h5" className="text-center mt-2" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Add a photo for your Personal Booking</Text>
            <Text variant="h5" className="text-center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Link & Welcome Screen</Text>
          </View>
          <View className='w-full' style={{ height: 582 }}>
            <AvatarPicker
              className='h-full'
              initialImage={branding.photo}
              placeholder='Choose Image'
              helperText='PNG, JPG, HEIC up to 10MB'
              aspect={[2, 3]}
              onImageSelected={(uri) => updateBranding({ photo: uri })}
              onImageRemoved={() => updateBranding({ photo: '' })}
              allowedFileTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
            />
          </View>
          <View className="flex-row items-start gap-2">
            <View className="flex-1 gap-1">
              <Pressable onPress={() => updateBranding({ welcomeScreen: !branding.welcomeScreen })}>
                <Text variant="h5">
                  Show Welcome Screen
                </Text>
                <Text variant="h5" className='leading-none'>
                  On App Launch?
                </Text>
              </Pressable>
              <Text className="text-text-secondary">Clients always see it for a warm welcome</Text>
            </View>
            <Switch
              checked={branding.welcomeScreen}
              onCheckedChange={(checked) => updateBranding({ welcomeScreen: checked })}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
