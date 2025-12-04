import { Image, type ImageSourcePropType, type ImageStyle, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

interface ClientHeaderProps {
    leftButtonImage?: ImageSourcePropType;
    leftButtonTitle?: string;
    rightButtonImage?: ImageSourcePropType;
    rightButtonTitle?: string;
    onLeftButtonPress?: () => void;
    onRightButtonPress?: () => void;
    title?: string;
}

const ICON_STYLE: ImageStyle = {
    height: 32,
    width: 32,
};

export default function ClientHeader({ title, leftButtonImage, leftButtonTitle, rightButtonImage, rightButtonTitle, onLeftButtonPress, onRightButtonPress }: ClientHeaderProps) {
    return (
        <View className="w-full h-20 flex-row items-center justify-between px-4 py-4">
            <Pressable onPress={onLeftButtonPress} className="items-center justify-center flex-row gap-2">
                <Image source={leftButtonImage} style={ICON_STYLE} />
                <Text className="text-xs uppercase" style={{ lineHeight: 14 }}>{leftButtonTitle}</Text>
            </Pressable>
            {title && (
                <View className="items-center justify-center flex-1">
                    <Text variant="h5">{title}</Text>
                </View>
            )}
            <Pressable onPress={onRightButtonPress}>
                <Image source={rightButtonImage} style={ICON_STYLE} />
                <Text className="text-xs uppercase" style={{ lineHeight: 14 }}>{rightButtonTitle}</Text>
            </Pressable>
        </View>
    );
}