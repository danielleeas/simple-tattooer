import { useState } from "react";
import { Pressable, View, Image } from "react-native"
import { ChevronRight } from "lucide-react-native";

import { ControlDataProps } from "@/components/pages/your-app/type";
import { ensureCalendarPermissions } from "@/lib/services/device-calendar";
import { Text } from "@/components/ui/text"
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/lib/contexts";
import { Icon } from "@/components/ui/icon";

interface ControlProps {
    controlData: ControlDataProps;
    updateControlData: (updates: Partial<ControlDataProps>) => void;
    artist: any;
}

export const Control = ({ controlData, updateControlData, artist }: ControlProps) => {
    const { toast } = useToast();

    const handleCalendarSyncToggle = async (next: boolean) => {
        if (next) {
            try {
                const granted = await ensureCalendarPermissions();
                if (granted) {
                    updateControlData({ calendarSync: true });
                    toast({
                        variant: 'success',
                        title: 'Calendar sync enabled',
                        duration: 2000,
                    });
                } else {
                    updateControlData({ calendarSync: false });
                    toast({
                        variant: 'error',
                        title: 'Permission required',
                        description: 'Calendar permission is required to sync with your device calendar.',
                        duration: 3000,
                    });
                }
            } catch (e) {
                updateControlData({ calendarSync: false });
                toast({
                    variant: 'error',
                    title: 'Calendar permission failed',
                    description: 'Unable to request calendar permission. Please try again.',
                    duration: 3000,
                });
            }
        } else {
            updateControlData({ calendarSync: false });
        }
    };

    return (
        <View className="gap-6 mt-4">
            <Pressable onPress={() => updateControlData({ pushNotifications: !controlData.pushNotifications })} className="flex-row gap-2 items-center justify-between">
                <Image source={require('@/assets/images/icons/bell.png')} style={{ width: 32, height: 32 }} />
                <View className="flex-1">
                    <Text variant="h5">Push Notification</Text>
                </View>
                <Switch checked={controlData.pushNotifications || false} onCheckedChange={(checked) => updateControlData({ pushNotifications: checked })} />
            </Pressable>

            <Pressable onPress={() => handleCalendarSyncToggle(!controlData.calendarSync)} className="flex-row gap-2 items-center justify-between">
                <Image source={require('@/assets/images/icons/calendar_dots.png')} style={{ width: 32, height: 32 }} />
                <View className="flex-1">
                    <Text variant="h5">Calendar Sync</Text>
                </View>
                <Switch checked={controlData.calendarSync || false} onCheckedChange={(checked) => updateControlData({ calendarSync: checked })} />
            </Pressable>

            <Pressable onPress={() => updateControlData({ swipeNavigation: !controlData.swipeNavigation })} className="flex-row gap-2 items-center justify-between">
                <Image source={require('@/assets/images/icons/hand_swipe_right.png')} style={{ width: 32, height: 32 }} />
                <View className="flex-1">
                    <Text variant="h5">Swipe Navigation</Text>
                </View>
                <Switch checked={controlData.swipeNavigation || false} onCheckedChange={(checked) => updateControlData({ swipeNavigation: checked })} />
            </Pressable>

            <Pressable onPress={() => updateControlData({ passwordModalOpen: true })} className="flex-row gap-2 items-center justify-between">
                <Image source={require('@/assets/images/icons/lock_key.png')} style={{ width: 32, height: 32 }} />
                <View className="flex-1">
                    <Text variant="h5">Reset Password</Text>
                </View>
                <Icon as={ChevronRight} size={20} />
            </Pressable>

            <Pressable onPress={() => updateControlData({ deleteAccountModalOpen: true })} className="flex-row gap-2 items-center justify-between">
                <Image source={require('@/assets/images/icons/delete.png')} style={{ width: 32, height: 32 }} />
                <View className="flex-1">
                    <Text variant="h5">Delete Account</Text>
                </View>
                <Icon as={ChevronRight} size={20} />
            </Pressable>
        </View>
    )
}