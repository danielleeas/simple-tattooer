import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, Image, type ImageStyle, Pressable, Linking, Modal, Dimensions, Animated } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDownIcon, ChevronUpIcon, FileSearch, FileText, X, CalendarPlus, Calendar } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { useAuth, useToast } from "@/lib/contexts";
import { getClientById, getClientProjectsWithSessions, updateProjectWaiverSigned, updateProjectNotes } from "@/lib/services/clients-service";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import PLUS_IMAGE from "@/assets/images/icons/plus.png";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDbDate } from "@/lib/utils";


const BUTTON_ICON_STYLE: ImageStyle = {
    height: 24,
    width: 24,
}

// Extract a human-friendly file name from a URL (handles querystrings)
const getFileNameFromUrl = (inputUrl: string): string => {
    if (!inputUrl) return '';
    const withoutQuery = inputUrl.split('?')[0];
    const rawName = withoutQuery.split('/').pop() || '';
    try {
        return decodeURIComponent(rawName);
    } catch {
        return rawName;
    }
};

const isPdfUri = (uri?: string): boolean => {
    if (!uri) return false;
    const url = uri.split('?')[0].toLowerCase();
    return url.endsWith('.pdf');
};

const isImageUri = (uri?: string): boolean => {
    if (!uri) return false;
    const url = uri.split('?')[0].toLowerCase();
    return (
        url.endsWith('.jpg') ||
        url.endsWith('.jpeg') ||
        url.endsWith('.png') ||
        url.endsWith('.gif') ||
        url.endsWith('.webp') ||
        url.endsWith('.bmp')
    );
};

export default function ClientAppointments() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { artist } = useAuth();
    const { toast } = useToast();

    const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});
    const [expandedSessions, setExpandedSessions] = useState<{ [key: string]: boolean }>({});
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImageSource, setSelectedImageSource] = useState<any>(null);
    const [projectNotes, setProjectNotes] = useState<{ [projectId: string]: string }>({});
    const [saving, setSaving] = useState<{ [projectId: string]: boolean }>({});
    const saveBarAnim = useRef(new Animated.Value(0)).current;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    type UiSession = {
        id: string;
        date: string;
        time: string;
        location: string
    };

    type UiProject = {
        id: string;
        name: string;
        waiverSigned: boolean;
        drawingImageUrl?: string;
        sessions: UiSession[];
        notes: string;
    };

    const [projects, setProjects] = useState<UiProject[]>([]);
    const [client, setClient] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const hasInitializedExpansionRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const load = async () => {
                if (!artist?.id || !id) {
                    if (isMounted) {
                        setClient(null);
                        setProjects([]);
                        setLoading(false);
                    }
                    return;
                }
                setLoading(true);
                try {
                    const [clientResult, projectRows] = await Promise.all([
                        getClientById(artist.id, String(id)),
                        getClientProjectsWithSessions(artist.id, String(id)),
                    ]);

                    if (!isMounted) return;
                    setClient(clientResult);
                    const toShortDisplayTime = (hhmm?: string): string => {
                        if (!hhmm) return '';
                        const [hStr, mStr] = hhmm.split(':');
                        const hours24 = Number(hStr);
                        const minutes = Number(mStr);
                        const period = hours24 < 12 ? 'am' : 'pm';
                        const hours12 = ((hours24 + 11) % 12) + 1;
                        const minutesPart = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
                        return `${hours12}${minutesPart}${period}`;
                    };
                    const addMinutesToHHMM = (hhmm?: string, minutesToAdd?: number): string => {
                        if (!hhmm || typeof minutesToAdd !== 'number') return hhmm || '';
                        const [hStr, mStr] = hhmm.split(':');
                        const base = new Date(0, 0, 1, Number(hStr), Number(mStr));
                        base.setMinutes(base.getMinutes() + minutesToAdd);
                        const h = base.getHours();
                        const m = base.getMinutes();
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    };
                    const toDisplayRange = (start?: string, durationMinutes?: number): string => {
                        if (!start) return '';
                        const end = addMinutesToHHMM(start, durationMinutes ?? 0);
                        if (!durationMinutes || durationMinutes <= 0) return toShortDisplayTime(start);
                        return `${toShortDisplayTime(start)} - ${toShortDisplayTime(end)}`;
                    };
                    const mapped: UiProject[] = (projectRows || []).map((p: any) => {
                        const drawingRow = Array.isArray(p?.drawing) ? p.drawing[0] : p?.drawing;
                        return {
                            id: p.id,
                            name: String(p.title || 'Untitled Project'),
                            waiverSigned: Boolean(p.waiver_signed),
                            drawingImageUrl: drawingRow?.image_url || undefined,
                            sessions: (p.sessions || []).map((s: any) => ({
                                id: s.id,
                                date: String(s.date || ''),
                                time: toDisplayRange(s.start_time, s.duration),
                                location: s.location?.address,
                            })),
                            notes: p.notes || '',
                        };
                    });
                    setProjects(mapped);
                    // Initialize project notes state
                    if (isMounted) {
                        const notesState: { [projectId: string]: string } = {};
                        mapped.forEach(project => {
                            notesState[project.id] = project.notes || '';
                        });
                        setProjectNotes(notesState);
                    }
                } catch {
                    if (isMounted) {
                        setClient(null);
                        setProjects([]);
                        setProjectNotes({});
                    }
                } finally {
                    if (isMounted) setLoading(false);
                }
            };
            load();
            return () => { isMounted = false; };
        }, [artist?.id, id])
    );

    // Reset initial expansion when navigating to a different client/artist
    useEffect(() => {
        hasInitializedExpansionRef.current = false;
    }, [artist?.id, id]);

    useEffect(() => {
        // Only auto-expand the first project on initial load
        if (!hasInitializedExpansionRef.current && projects.length > 0) {
            setExpandedProjects({ [projects[0].id]: true });
            hasInitializedExpansionRef.current = true;
        }
    }, [projects]);

    // Check if any project notes have changed
    const hasChanges = useMemo(() => {
        return projects.some(project => {
            const currentNotes = projectNotes[project.id] ?? project.notes;
            return currentNotes !== project.notes;
        });
    }, [projects, projectNotes]);

    // Animate save bar based on changes
    useEffect(() => {
        Animated.timing(saveBarAnim, {
            toValue: hasChanges ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [hasChanges, saveBarAnim]);

    const saveBarTranslateY = saveBarAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [80, 0],
    });

    const handleNotesChange = (projectId: string, notes: string) => {
        setProjectNotes(prev => ({
            ...prev,
            [projectId]: notes,
        }));
    };

    const handleSaveNotes = async () => {
        // Save notes for all projects that have changed
        const projectsToSave = projects.filter(project => {
            const currentNotes = projectNotes[project.id] ?? project.notes;
            return currentNotes !== project.notes;
        });

        if (projectsToSave.length === 0) return;

        // Set saving state for all projects being saved
        const savingState: { [projectId: string]: boolean } = {};
        projectsToSave.forEach(project => {
            savingState[project.id] = true;
        });
        setSaving(prev => ({ ...prev, ...savingState }));

        try {
            const savePromises = projectsToSave.map(async (project) => {
                const notes = projectNotes[project.id] ?? project.notes;
                const success = await updateProjectNotes(project.id, notes);
                if (success) {
                    // Update local projects state
                    setProjects(prev => prev.map(p =>
                        p.id === project.id ? { ...p, notes } : p
                    ));
                }
                return { projectId: project.id, success };
            });

            const results = await Promise.all(savePromises);
            const failed = results.filter(r => !r.success);

            if (failed.length > 0) {
                toast({
                    variant: 'error',
                    title: 'Failed to save some notes',
                    description: 'Some project notes could not be saved. Please try again.',
                });
            } else {
                toast({
                    variant: 'success',
                    title: 'Notes saved',
                    description: 'Project notes have been updated successfully.',
                });
                // Clear the notes state since they're now saved
                setProjectNotes({});
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            toast({
                variant: 'error',
                title: 'Failed to save notes',
                description: 'An unexpected error occurred.',
            });
        } finally {
            // Clear saving state
            setSaving({});
        }
    };

    const waiverUrl = artist?.rule?.waiver_text || '';
    const waiverFileName = waiverUrl ? getFileNameFromUrl(waiverUrl) : '';
    const [waiverModalVisible, setWaiverModalVisible] = useState(false);
    const [agreeChecked, setAgreeChecked] = useState<boolean>(false);
    const [waiverSigned, setWaiverSigned] = useState<boolean>(false);
    const [addSessionModalVisible, setAddSessionModalVisible] = useState(false);

    const handleOpenWaiver = () => {
        if (!waiverUrl) return;
        setAgreeChecked(false);
        setWaiverModalVisible(true);
    };

    const handlePreview = async () => {
        if (!waiverUrl) return;
        try {
            await Linking.openURL(waiverUrl);
        } catch { }
    };

    const handleImagePress = (source: any) => {
        setSelectedImageSource(source);
        setIsImageViewerVisible(true);
    };

    const handleCloseImageViewer = () => {
        setIsImageViewerVisible(false);
        setSelectedImageSource(null);
    };

    const handleSignWaiver = async () => {
        // Determine the currently expanded project (fallback to first if none)
        const expandedProjectId = Object.keys(expandedProjects).find(projectId => expandedProjects[projectId]);
        const targetProjectId = expandedProjectId || projects[0]?.id;
        if (!targetProjectId) {
            setWaiverModalVisible(false);
            return;
        }

        // Optimistic UI update
        setProjects(prev => prev.map(project => (
            project.id === targetProjectId
                ? { ...project, waiverSigned: true }
                : project
        )));
        setWaiverModalVisible(false);

        const ok = await updateProjectWaiverSigned(targetProjectId, true);
        if (!ok) {
            // Revert on failure
            setProjects(prev => prev.map(project => (
                project.id === targetProjectId
                    ? { ...project, waiverSigned: false }
                    : project
            )));
        }
    };

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const isCurrentlyExpanded = prev[projectId];
            // If currently expanded, close it; otherwise, close all and open this one
            if (isCurrentlyExpanded) {
                return { [projectId]: false };
            } else {
                return { [projectId]: true };
            }
        });
    };

    const toggleSessions = (projectId: string) => {
        setExpandedSessions(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const handleBack = () => {
        router.back();
    };

    const handleHome = () => {
        router.dismissTo('/');
    };

    const handleAddSession = () => {
        setAddSessionModalVisible(true);
    };

    const handleManualAddSession = () => {
        setAddSessionModalVisible(false);
        // Find the currently expanded project
        const expandedProjectId = Object.keys(expandedProjects).find(projectId => expandedProjects[projectId]);
        // TODO: Navigate to manual add session
        // if (expandedProjectId) {
        //     router.push({
        //         pathname: '/artist/clients/add-session',
        //         params: { projectId: expandedProjectId }
        //     });
        // }
    };

    const handleAutoAddSession = () => {
        setAddSessionModalVisible(false);
        // Find the currently expanded project
        const expandedProjectId = Object.keys(expandedProjects).find(projectId => expandedProjects[projectId]);
        // TODO: Navigate to auto add session
    };

    const handleDetailSession = (clientId: string, projectId: string, sessionId: string) => {
        router.push({
            pathname: '/artist/booking/session/detail-session',
            params: { client_id: clientId, project_id: projectId, session_id: sessionId }
        });
    };

    const handleMenu = () => {
        router.push('/artist/menu');
    };

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
                <SafeAreaView className='flex-1 bg-background'>
                    <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                    <View className="flex-1 justify-center items-center px-4">
                        <Text variant="h4" className="text-center">Loading...</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    if (!client) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
                <SafeAreaView className='flex-1 bg-background'>
                    <Header leftButtonImage={BACK_IMAGE} leftButtonTitle="Back" onLeftButtonPress={handleBack} />
                    <View className="flex-1 justify-center items-center px-4">
                        <Text variant="h4" className="text-center">Client not found</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
            <SafeAreaView className='flex-1 bg-background'>
                <Header
                    leftButtonImage={HOME_IMAGE}
                    leftButtonTitle="Home"
                    onLeftButtonPress={handleHome}
                    rightButtonImage={MENU_IMAGE}
                    rightButtonTitle="Menu"
                    onRightButtonPress={handleMenu}
                />
                <StableGestureWrapper
                    onSwipeRight={handleBack}
                    threshold={80}
                    enabled={true}
                >
                    <View className="flex-1 bg-background px-4 pt-2 gap-6">
                        <View className="flex-1">
                            <KeyboardAwareScrollView
                                bottomOffset={80}
                                contentContainerClassName="w-full"
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View className="gap-6 pb-6">
                                    <View className="items-center justify-center pb-[22px] h-[120px]">
                                        <Image
                                            source={require('@/assets/images/icons/appointment.png')}
                                            style={{ width: 56, height: 56 }}
                                            resizeMode="contain"
                                        />
                                        <Text variant="h6" className="text-center uppercase">Appointments</Text>
                                    </View>

                                    <Button variant="outline" className='items-center justify-center' onPress={() => { router.push({ pathname: "/artist/clients/[id]", params: { id: id } }) }}>
                                        <Text variant="h5">View Profile</Text>
                                    </Button>

                                    {projects.length > 0 &&

                                        <View className="gap-6">
                                            {projects.map((project) => (
                                                <View key={project.id} className="gap-6">
                                                    <Pressable
                                                        className="flex-row items-center justify-between gap-2"
                                                        onPress={() => toggleProject(project.id)}
                                                    >
                                                        <View />
                                                        <View className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                        <Text variant="h4" className="flex-1">{project.name}</Text>
                                                        <Icon
                                                            as={expandedProjects[project.id] ? ChevronUpIcon : ChevronDownIcon}
                                                            size={24}
                                                        />
                                                    </Pressable>

                                                    {expandedProjects[project.id] && (
                                                        <View className="w-full gap-6">
                                                            {project.drawingImageUrl && (
                                                                <View className="flex-row items-center justify-between gap-2">
                                                                    <View className="flex-row items-end justify-start gap-2">
                                                                        <Pressable onPress={() => handleImagePress({ uri: project.drawingImageUrl })}>
                                                                            <Image
                                                                                source={{ uri: project.drawingImageUrl }}
                                                                                style={{ width: 120, height: 120, borderRadius: 8 }}
                                                                                resizeMode="contain"
                                                                            />
                                                                        </Pressable>
                                                                    </View>
                                                                    <View className="flex-1 items-center justify-center pt-2">
                                                                        <Text variant="small" className="font-thin leading-5">Tap to open drawing to full screen</Text>
                                                                    </View>
                                                                </View>
                                                            )}
                                                            <View className="gap-2">
                                                                <Text variant="h4">Dates</Text>
                                                                <Text className="font-thin leading-5 text-text-secondary">
                                                                    If you need to manually reschedule, change time/location, or see history, tap the date
                                                                </Text>
                                                            </View>
                                                            {project.sessions.map((session, index) => {
                                                                const isExpanded = expandedSessions[project.id];
                                                                const shouldShowSession = index < 3 || isExpanded;

                                                                return (
                                                                    <View key={session.id} className="gap-1">
                                                                        {shouldShowSession && (
                                                                            <Pressable key={session.id} className="gap-1" onPress={() => handleDetailSession(String(id), project.id, session.id)}>
                                                                                <Text variant="h5">{formatDbDate(session.date, 'MMM DD, YYYY')}</Text>
                                                                                <Text className="text-text-secondary leading-none">{session.time}</Text>
                                                                                <Text variant="small" className="font-thin leading-5 text-text-secondary">
                                                                                    {session?.location}
                                                                                </Text>
                                                                            </Pressable>
                                                                        )}

                                                                        {index === 2 && project.sessions.length > 3 && !isExpanded && (
                                                                            <Pressable
                                                                                key={`show-more-${project.id}`}
                                                                                className="gap-1 flex-row items-center justify-center"
                                                                                onPress={() => toggleSessions(project.id)}
                                                                            >
                                                                                <Text>Show more</Text>
                                                                                <Icon as={ChevronDownIcon} size={24} />
                                                                            </Pressable>
                                                                        )}

                                                                        {index === project.sessions.length - 1 && isExpanded && project.sessions.length > 3 && (
                                                                            <Pressable
                                                                                key={`show-less-${project.id}`}
                                                                                className="gap-1 flex-row items-center justify-center"
                                                                                onPress={() => toggleSessions(project.id)}
                                                                            >
                                                                                <Text>Show less</Text>
                                                                                <Icon as={ChevronUpIcon} size={24} />
                                                                            </Pressable>
                                                                        )}
                                                                    </View>
                                                                );
                                                            })}

                                                            <View className="gap-2">
                                                                <Text variant="h4">Sign Waiver</Text>
                                                                <Pressable className="flex-row gap-2 bg-background-secondary p-4 rounded-lg border border-border" onPress={handleOpenWaiver}>
                                                                    <View className="h-12 w-12 rounded-full bg-foreground items-center justify-center">
                                                                        <Icon as={FileText} strokeWidth={2} size={24} className="text-background" />
                                                                    </View>
                                                                    <View className="gap-2 flex-1">
                                                                        <View style={{ width: project.waiverSigned ? 50 : 70 }} className={`border items-center justify-center rounded-full px-1 ${project.waiverSigned ? 'border-green bg-green/10' : 'border-destructive bg-destructive/10'}`}>
                                                                            <Text className={`text-xs items-center justify-center ${project.waiverSigned ? 'text-green' : 'text-destructive'}`} style={{ fontSize: 10 }}>{project.waiverSigned ? 'Signed' : 'Not Signed'}</Text>
                                                                        </View>
                                                                        <Text variant="small">{waiverFileName ? 'Waiver.pdf' : 'No waiver uploaded'}</Text>
                                                                        <View className="flex-row items-center gap-1">
                                                                            <Text variant="small">{project.waiverSigned ? 'Preview' : 'Preview and Signed'}</Text>
                                                                            <Icon as={FileSearch} strokeWidth={1} size={16} />
                                                                        </View>
                                                                    </View>
                                                                </Pressable>
                                                            </View>
                                                            <View className="gap-2">
                                                                <Text className="text-text-secondary">Notes</Text>
                                                                <Textarea
                                                                    placeholder="Enter notes"
                                                                    className="min-h-28"
                                                                    value={projectNotes[project.id] ?? project.notes}
                                                                    onChangeText={(text) => handleNotesChange(project.id, text)}
                                                                    spellCheck={false}
                                                                    autoComplete="off"
                                                                    textContentType="none"
                                                                    autoCapitalize="none"
                                                                    autoCorrect={false}
                                                                />
                                                            </View>

                                                        </View>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    }

                                    {projects.length === 0 &&
                                        <View className="items-center justify-center">
                                            <Text variant="h4">No projects found</Text>
                                            <Text variant="small">Add a project to get started</Text>
                                        </View>
                                    }
                                </View>
                            </KeyboardAwareScrollView>
                        </View>

                        <View className="gap-4 items-center justify-center pb-6">
                            {projects.length > 0 &&
                                <Button variant="outline" onPress={handleAddSession} className="w-full">
                                    <Text variant='h5'>Add Session</Text>
                                    <Image source={PLUS_IMAGE} style={BUTTON_ICON_STYLE} />
                                </Button>
                            }
                            <Button variant="outline" className="w-full">
                                <Text variant='h5'>Booking/Consult Request</Text>
                            </Button>
                        </View>
                    </View>
                </StableGestureWrapper>
                <Animated.View
                    pointerEvents={hasChanges ? 'auto' : 'none'}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        transform: [{ translateY: saveBarTranslateY }],
                        opacity: saveBarAnim,
                    }}
                >
                    <View className="px-4 py-4 bg-background">
                        <Button
                            variant="outline"
                            onPress={handleSaveNotes}
                            disabled={!hasChanges || Object.values(saving).some(s => s)}
                            className="w-full"
                        >
                            <Text className="text-white font-semibold">
                                {Object.values(saving).some(s => s) ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
                            </Text>
                        </Button>
                    </View>
                </Animated.View>

                <Modal
                    visible={waiverModalVisible}
                    onRequestClose={() => setWaiverModalVisible(false)}
                    transparent={true}
                    animationType="fade"
                >
                    <View className="flex-1 bg-black/50 justify-end items-center">
                        <View style={{ height: screenHeight - 30 }} className="w-full bg-background-secondary rounded-t-3xl p-4 pt-8 pb-8 gap-6">
                            <View className="items-start justify-center relative">
                                <Text variant="h6" className="leading-tight">Waiver Agreement between{'\n'}Artist & Client</Text>
                                <Pressable className="absolute top-0 right-0" onPress={() => setWaiverModalVisible(false)}>
                                    <Icon as={X} size={24} />
                                </Pressable>
                            </View>
                            <View className="gap-3 flex-1">
                                {isImageUri(waiverUrl) ? (
                                    <Pressable className="w-full h-full" onPress={() => handleImagePress({ uri: waiverUrl })}>
                                        <Image
                                            source={{ uri: waiverUrl }}
                                            style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                            resizeMode="contain"
                                        />
                                    </Pressable>
                                ) : (
                                    <Pressable onPress={handlePreview} className="gap-4 w-full items-center justify-center bg-background border border-border rounded-lg py-6">
                                        <Icon as={FileSearch} strokeWidth={1} size={32} />
                                        <Text variant="small">Preview</Text>
                                    </Pressable>
                                )}
                            </View>
                            <View className="flex-row items-center gap-3">
                                <Checkbox checked={agreeChecked} onCheckedChange={(v) => setAgreeChecked(!!v)} />
                                <Text className="flex-1 font-thin leading-0 text-text-secondary">I have read and understood the terms of this waiver agreement.</Text>
                            </View>
                            <Button variant="outline" disabled={!agreeChecked || !waiverUrl} onPress={handleSignWaiver}>
                                <Text className="font-semibold">Sign Waiver</Text>
                            </Button>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isImageViewerVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleCloseImageViewer}
                >
                    <View className="flex-1 bg-black/90 justify-center items-center">
                        <Pressable
                            className="absolute top-4 right-4 z-10"
                            onPress={handleCloseImageViewer}
                        >
                            <View className="bg-white/20 rounded-full p-2">
                                <Image
                                    source={require('@/assets/images/icons/x_circle.png')}
                                    style={{ width: 32, height: 32 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </Pressable>

                        <Pressable
                            className="flex-1 w-full justify-center items-center"
                            onPress={handleCloseImageViewer}
                        >
                            <Image
                                source={selectedImageSource}
                                style={{
                                    width: screenWidth - 40,
                                    height: screenHeight - 100,
                                    maxWidth: screenWidth,
                                    maxHeight: screenHeight
                                }}
                                resizeMode="contain"
                            />
                        </Pressable>
                    </View>
                </Modal>

                <Modal
                    visible={addSessionModalVisible}
                    onRequestClose={() => setAddSessionModalVisible(false)}
                    transparent={true}
                    animationType="fade"
                >
                    <Pressable
                        className="flex-1 bg-black/50 justify-center items-center"
                        onPress={() => setAddSessionModalVisible(false)}
                    >
                        <Pressable
                            className="w-[85%] bg-background-secondary rounded-2xl p-6 gap-6"
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View className="items-center justify-center gap-2">
                                <Text variant="h5" className="text-center">Add Session</Text>
                                <Text variant="small" className="text-text-secondary text-center">
                                    Choose how you want to add a new session
                                </Text>
                            </View>

                            <View className="gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full flex-row items-center"
                                    onPress={handleManualAddSession}
                                >
                                    <Text variant="h5">Manual Add Session</Text>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full flex-row items-center"
                                    onPress={handleAutoAddSession}
                                >
                                    <Text variant="h5">Auto Add Session</Text>
                                </Button>
                            </View>

                            <Button
                                variant="outline"
                                className="w-full"
                                onPress={() => setAddSessionModalVisible(false)}
                            >
                                <Text variant="h5">Cancel</Text>
                            </Button>
                        </Pressable>
                    </Pressable>
                </Modal>


            </SafeAreaView >
        </>
    );
}
