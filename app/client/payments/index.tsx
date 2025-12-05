import { useState, useEffect } from "react";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "@/components/lib/client-header";
import { View, Image, ImageBackground, Pressable, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StableGestureWrapper } from "@/components/lib/stable-gesture-wrapper";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { getClientProjectsWithSessions } from '@/lib/services/clients-service';

import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import { useToast } from "@/lib/contexts/toast-context";
import { ChevronDown, ChevronUp } from "lucide-react-native";

interface ProjectWithSessions {
    id: string;
    title: string;
    deposit_amount: number;
    deposit_paid: boolean;
    deposit_paid_date: string;
    deposit_payment_method: string;
    sessions: Array<{
        id: string;
        date: string;
        start_time: string;
        duration: number;
        session_rate: number;
        payment_method: string;
        created_at: string;
    }>;
}

export default function PaumentInfo() {
    const { toast } = useToast();
    const client = useSelector((state: RootState) => state.auth.client);
    const artist = useSelector((state: RootState) => state.artist.artist);

    const [projects, setProjects] = useState<ProjectWithSessions[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});

    const handleBack = () => {
        router.back();
    };

    useEffect(() => {
        if (client?.id && artist?.id) {
            loadProjects();
        }
    }, [client?.id, artist?.id]);

    const loadProjects = async () => {
        if (!client?.id || !artist?.id) return;

        setLoading(true);
        try {
            const projectsData = await getClientProjectsWithSessions(artist.id, client.id);
            setProjects(projectsData);
        } catch (error) {
            console.error('Error loading projects:', error);
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to load payment information',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ' - ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <ClientHeader
                    leftButtonImage={BACK_IMAGE}
                    leftButtonTitle="Back"
                    onLeftButtonPress={handleBack}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={100}
                    enabled={true}
                >
                    <View className="flex-1 pt-2 pb-4 gap-6">
                        <KeyboardAwareScrollView bottomOffset={50} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                            <View className="flex-1 bg-background px-4 pt-2 pb-8 gap-6">
                                <View className="items-center justify-center" style={{ height: 180 }}>
                                    <Image
                                        source={require('@/assets/images/icons/payments.png')}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">payment</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">info</Text>
                                    <Text className="text-center mt-2 text-text-secondary">See exactly what you've paid and how — clear</Text>
                                    <Text className="text-center text-text-secondary leading-none">and simple</Text>
                                </View>

                                {loading ? (
                                    <View className="items-center justify-center" style={{ height: 200 }}>
                                        <ActivityIndicator size="large" />
                                        <Text className="mt-4 text-text-secondary">Loading payment information...</Text>
                                    </View>
                                ) : projects.length === 0 ? (
                                    <View className="items-center py-8">
                                        <Text className="text-text-secondary text-center">
                                            No payment information available yet.
                                        </Text>
                                    </View>
                                ) : (
                                    <View className="gap-6">
                                        {projects.map((project) => (
                                            <View key={project.id} className="gap-2">
                                                <Pressable
                                                    className="flex-row items-center justify-between gap-2"
                                                    onPress={() => toggleProject(project.id)}
                                                >
                                                    <View className="flex-row items-center gap-2">
                                                        <View className="h-2 w-2 rounded-full bg-foreground"></View>
                                                        <Text variant="h4">{project.title}</Text>
                                                    </View>
                                                    <Icon as={expandedProjects[project.id] ? ChevronUp : ChevronDown} strokeWidth={1} size={32} />
                                                </Pressable>
                                                {expandedProjects[project.id] && (
                                                    <View className="gap-10">
                                                        {project.deposit_amount && (
                                                            <View className="gap-4">
                                                                <View className="flex-row items-start justify-between gap-2">
                                                                    <Image
                                                                        source={require('@/assets/images/icons/deposit.png')}
                                                                        style={{ width: 48, height: 48 }}
                                                                        resizeMode="contain"
                                                                    />
                                                                    <View className="flex-1">
                                                                        <Text variant="h4">Deposit</Text>
                                                                        <Text className="text-text-secondary text-sm">Your deposit secures your spot</Text>
                                                                    </View>
                                                                </View>
                                                                <View className="gap-2">
                                                                    <Text className="text-text-secondary">Amount</Text>
                                                                    <Text variant="h5">${project.deposit_amount}</Text>
                                                                </View>
                                                                {project.deposit_paid && project.deposit_paid_date && (
                                                                    <View className="gap-2">
                                                                        <Text className="text-text-secondary">Date Paid</Text>
                                                                        <Text variant="h5">{formatDate(project.deposit_paid_date)}</Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        )}

                                                        {project.sessions && project.sessions.length > 0 && (
                                                            <View className="gap-4">
                                                                <View className="flex-row items-start justify-between gap-2">
                                                                    <Image
                                                                        source={require('@/assets/images/icons/billing.png')}
                                                                        style={{ width: 48, height: 48 }}
                                                                        resizeMode="contain"
                                                                    />
                                                                    <View className="flex-1">
                                                                        <Text variant="h4">Session Rate</Text>
                                                                        <Text className="text-text-secondary text-sm">Clear breakdown so there are no surprises</Text>
                                                                    </View>
                                                                </View>
                                                                {project.sessions.map((session, index) => (
                                                                    <View key={session.id} className="gap-2">
                                                                        {index === 0 && (
                                                                            <Text className="text-text-secondary">Session Rate</Text>
                                                                        )}
                                                                        <Text variant="h5">${session.session_rate}</Text>
                                                                        {session.date && (
                                                                            <View className="gap-1">
                                                                                <Text className="text-text-secondary text-sm">Scheduled Date</Text>
                                                                                <Text className="text-sm">{formatDate(session.date)}</Text>
                                                                            </View>
                                                                        )}
                                                                        {index < project.sessions.length - 1 && (
                                                                            <View className="h-px bg-border my-2" />
                                                                        )}
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}