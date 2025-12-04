import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { MessageCircle } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { getArtistAftercareTips } from '@/lib/services/aftercare-service';
import { AftercareTip } from '@/lib/types';
import { useToast } from '@/lib/contexts/toast-context';

export default function AftercarePage() {
  const { toast } = useToast();
  const artist = useSelector((state: RootState) => state.artist.artist);

  const [aftercareItems, setAftercareItems] = useState<AftercareTip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (artist?.id) {
      loadAftercareTips();
    }
  }, [artist?.id]);

  const loadAftercareTips = async () => {
    if (!artist?.id) return;

    setLoading(true);
    const result = await getArtistAftercareTips(artist.id);

    if (result.success && result.data) {
      setAftercareItems(result.data);
    } else {
      toast({
        variant: 'error',
        title: 'Error',
        description: result.error || 'Failed to load aftercare tips',
        duration: 3000,
      });
    }
    setLoading(false);
  };

  const handleMessage = () => {
    // Navigate to messages - adjust route as needed
    // router.push('/client/messages');
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={50}
      contentContainerClassName="w-full"
      showsVerticalScrollIndicator={false}>
      <View className="flex-1 gap-6 bg-background px-4 pb-8 pt-2">
        {loading ? (
          <View className="items-center justify-center" style={{ height: 200 }}>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-text-secondary">Loading aftercare tips...</Text>
          </View>
        ) : (
          <>
            {aftercareItems.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-center text-text-secondary">
                  No aftercare tips available yet.
                </Text>
              </View>
            ) : (
              <View className="gap-6">
                {aftercareItems.map((tip) => {
                  const instructions = tip.instructions
                    .split('\n')
                    .filter((instruction) => instruction.trim() !== '');

                  return (
                    <View key={tip.id} className="gap-2">
                      <Text variant="h5">{tip.title}</Text>
                      <View className="gap-2">
                        {instructions.map((instruction, index) => (
                          <Text key={index} className="leading-5 text-text-secondary text-sm">
                            {instruction.trim()}
                          </Text>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}
