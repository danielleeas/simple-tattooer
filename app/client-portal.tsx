import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";

export default function ClientPortal() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-1 bg-background pt-4 pb-2 gap-6'>
          <Text>Client Portal</Text>
        </View>
      </SafeAreaView>
    </>
  );
}