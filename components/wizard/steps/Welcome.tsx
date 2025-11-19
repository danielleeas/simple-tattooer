import { View, Image } from "react-native"

// Custom Components
import { Note } from "@/components/ui/note"
import { Text } from "@/components/ui/text"

export default function Welcome() {
    return (
        <View className="flex-1 items-center justify-center gap-9">
            <View className="items-center justify-center">
                <Image
                    source={require('@/assets/images/icons/rules.png')}
                    style={{ width: 80, height: 80 }}
                    resizeMode="contain"
                />
                <Text variant="h1" className="text-center mt-1">Setup Wizard</Text>
                <Text variant="h5" className="text-center mt-1">Welcome to Simple Tattooer.</Text>
                <Text variant="h5" className="text-center">We are glad you're here.</Text>
            </View>

            <Note
                className="w-full max-w-[400px]"
                message="Fill this out once and you're ready!"
                secondaryMessage="Make changes anytime in Settings."
            />
        </View>
    );
}