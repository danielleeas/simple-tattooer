import { useEffect, useState, useMemo } from "react";
import { View, Image, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ChevronUpIcon, ChevronDownIcon, DollarSignIcon } from "lucide-react-native";

import { StableGestureWrapper } from '@/components/lib/stable-gesture-wrapper';
import Header from "@/components/lib/Header";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/contexts";
import { getClientById, getClientProjectsWithSessions, updateProjectDepositPaid, updateProjectDepositPaidDate, updateProjectDepositPaymentMethod, updateSessionPaymentMethod, updateSessionTip } from "@/lib/services/clients-service";
import { sendClientPortalEmail } from "@/lib/services/booking-service";
import { Collapse } from "@/components/lib/collapse";

import HOME_IMAGE from "@/assets/images/icons/home.png";
import MENU_IMAGE from "@/assets/images/icons/menu.png";
import BACK_IMAGE from "@/assets/images/icons/arrow_left.png";
import MONEYBAG_IMAGE from "@/assets/images/icons/money_bag.png";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/lib/date-input";
import { DropdownPicker } from "@/components/lib/dropdown-picker";
import { formatDbDate, parseDbDateLike } from "@/lib/utils";

const PAYMENT_METHODS = [
    // Only methods controlled by enabled flags
    { label: "PayPal", value: "paypal" },
    { label: "E-Transfer", value: "e_transfer" },
    { label: "Credit Card", value: "credit-card" },
    { label: "Venmo", value: "venmo" },
];

export default function ClientMoneyStuff() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { artist } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [client, setClient] = useState<any | null>(null);
    const [depositUsed, setDepositUsed] = useState<string>("");
    const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});
    const [expandedSessions, setExpandedSessions] = useState<{ [key: string]: boolean }>({});

    type UiSession = {
        id: string;
        date: string;
        time: string;
        rate: number;
        tip: number;
        paymentMethod: string;
    };
    type UiProject = {
        id: string;
        name: string;
        deposit: {
            amount: number;
            isPaid: boolean;
            datePaid?: Date;
            paymentMethod: string;
            isUsed: boolean;
        };
        sessions: UiSession[];
    };
    const [projects, setProjects] = useState<UiProject[]>([]);
    const [sessionTipDraft, setSessionTipDraft] = useState<{ [sessionId: string]: string }>({});

    useEffect(() => {
        let isMounted = true;
        async function load() {
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
                const mapped: UiProject[] = (projectRows || []).map((p: any) => {
                    const toDisplayTime = (hhmm?: string): string => {
                        if (!hhmm) return '';
                        const [hStr, mStr] = hhmm.split(':');
                        let h = Number(hStr);
                        const m = Number(mStr);
                        const period = h < 12 ? 'AM' : 'PM';
                        const h12 = ((h + 11) % 12) + 1;
                        return `${h12}:${String(m).padStart(2, '0')} ${period}`;
                    };
                    const sessions: UiSession[] = (p.sessions || []).map((s: any) => ({
                        id: s.id,
                        date: String(s.date || ''),
                        time: toDisplayTime(s.start_time),
                        rate: Number(s.session_rate || 0),
                        tip: Number(s.tip || 0),
                        paymentMethod: String(s.payment_method || ''),
                    }));
                    return {
                        id: p.id,
                        name: String(p.title || 'Untitled Project'),
                        deposit: {
                            amount: Number(p.deposit_amount || 0),
                            isPaid: Boolean(p.deposit_paid),
                            // Parse DB value as date-only to avoid timezone shifts in display
                            datePaid: (() => {
                                const raw = p.deposit_paid_date;
                                if (!raw) return undefined;
                                const str = String(raw);
                                const ymd = str.includes('T') ? str.slice(0, 10) : str;
                                const parts = parseDbDateLike(ymd);
                                return parts ? new Date(parts.year, parts.month - 1, parts.day) : undefined;
                            })(),
                            paymentMethod: String(p.deposit_payment_method || ''),
                            // Not currently modeled in DB; leave default
                            isUsed: false,
                        },
                        sessions,
                    };
                });
                setProjects(mapped);
            } catch {
                if (isMounted) {
                    setClient(null);
                    setProjects([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        load();
        return () => { isMounted = false; };
    }, [artist?.id, id]);

    // Set default expanded state - first project and first session of each project
    useEffect(() => {
        if (projects.length > 0) {
            // Expand first project
            setExpandedProjects({ [projects[0].id]: true });

            // Expand first session of each project
            const firstSessions: { [key: string]: boolean } = {};
            projects.forEach(project => {
                if ((project.sessions || []).length > 0) {
                    firstSessions[project.sessions[0].id] = true;
                }
            });
            setExpandedSessions(firstSessions);
        }
    }, [projects]);

    const commitPendingSessionTips = async () => {
        const draftEntries = Object.entries(sessionTipDraft);
        if (draftEntries.length === 0) return;
        await Promise.all(
            draftEntries.map(async ([sessionId]) => {
                const project = projects.find(p => p.sessions.some(s => s.id === sessionId));
                if (!project) return;
                await handleSessionTipBlur(project.id, sessionId);
            })
        );
    };

    const handleBack = async () => {
        await commitPendingSessionTips();
        router.back();
    };

    const handleHome = async () => {
        await commitPendingSessionTips();
        router.dismissAll();
    }

    const handleMenu = () => {
        router.push('/artist/menu');
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

        // When opening a project, expand its first session
        const project = projects.find(p => p.id === projectId);
        if (project && project.sessions.length > 0) {
            setExpandedSessions({ [project.sessions[0].id]: true });
        } else {
            setExpandedSessions({});
        }
    };

    const toggleSession = (sessionId: string) => {
        setExpandedSessions(prev => {
            const isCurrentlyExpanded = prev[sessionId];
            // If currently expanded, close it; otherwise, close all other sessions and open this one
            if (isCurrentlyExpanded) {
                return { [sessionId]: false };
            } else {
                return { [sessionId]: true };
            }
        });
        // Don't close projects when opening a session - sessions belong to projects
    };

    const handleDepositPaidToggle = async (projectId: string, checked: boolean) => {
        if (!artist?.id || !id) return;
        // Optimistic UI update
        setProjects(prev =>
            prev.map(p =>
                p.id === projectId
                    ? {
                        ...p,
                        deposit: {
                            ...p.deposit,
                            isPaid: checked,
                            datePaid: checked ? new Date() : undefined,
                        },
                    }
                    : p
            )
        );
        const ok = await updateProjectDepositPaid(projectId, checked, artist.id, String(id));
        if (!ok) {
            // Revert on failure
            setProjects(prev =>
                prev.map(p =>
                    p.id === projectId
                        ? {
                            ...p,
                            deposit: {
                                ...p.deposit,
                                isPaid: !checked,
                                datePaid: !checked ? undefined : p.deposit.datePaid,
                            },
                        }
                        : p
                )
            );
        }

		// If deposit successfully marked as paid, send client portal email (non-blocking)
		if (ok && checked) {
			void sendClientPortalEmail({
				artist: artist as any,
				clientId: String(id),
				projectId,
			});
		}
    };

    const enabledPaymentValues = useMemo(() => {
        const rule = (artist as any)?.rule || {};
        const enabled: string[] = [];
        if (rule.paypal_enabled) enabled.push('paypal');
        if (rule.etransfer_enabled) enabled.push('e_transfer');
        if (rule.creditcard_enabled) enabled.push('credit-card');
        if (rule.venmo_enabled) enabled.push('venmo');
        return enabled;
    }, [artist]);

    const enabledPaymentOptions = PAYMENT_METHODS.filter(opt => enabledPaymentValues.includes(opt.value));

    const handleDepositPaymentMethodChange = async (projectId: string, method: string) => {
        // Optimistic UI update
        const prev = projects.find(p => p.id === projectId)?.deposit.paymentMethod;
        setProjects(prevProjects =>
            prevProjects.map(p => p.id === projectId
                ? { ...p, deposit: { ...p.deposit, paymentMethod: method } }
                : p
            )
        );
        const ok = await updateProjectDepositPaymentMethod(projectId, method);
        if (!ok) {
            // Revert on failure
            setProjects(prevProjects =>
                prevProjects.map(p => p.id === projectId
                    ? { ...p, deposit: { ...p.deposit, paymentMethod: prev || '' } }
                    : p
                )
            );
        }
    };

    const handleSessionPaymentMethodChange = async (projectId: string, sessionId: string, method: string) => {
        const prev = projects.find(p => p.id === projectId)?.sessions.find(s => s.id === sessionId)?.paymentMethod;
        // Optimistic UI update
        setProjects(prevProjects =>
            prevProjects.map(p =>
                p.id === projectId
                    ? {
                        ...p,
                        sessions: p.sessions.map(s =>
                            s.id === sessionId ? { ...s, paymentMethod: method } : s
                        ),
                    }
                    : p
            )
        );
        const ok = await updateSessionPaymentMethod(sessionId, method);
        if (!ok) {
            // Revert on failure
            setProjects(prevProjects =>
                prevProjects.map(p =>
                    p.id === projectId
                        ? {
                            ...p,
                            sessions: p.sessions.map(s =>
                                s.id === sessionId ? { ...s, paymentMethod: prev || '' } : s
                            ),
                        }
                        : p
                )
            );
        }
    };

    const handleDepositDateChange = async (projectId: string, date: Date) => {
        console.log('handleDepositDateChange', date);
        const previousDate = projects.find(p => p.id === projectId)?.deposit.datePaid;
        // Optimistic UI update
        setProjects(prev =>
            prev.map(p =>
                p.id === projectId
                    ? {
                        ...p,
                        deposit: {
                            ...p.deposit,
                            datePaid: date,
                        },
                    }
                    : p
            )
        );
        const ok = await updateProjectDepositPaidDate(projectId, date);
        if (!ok) {
            // Revert on failure by clearing the change (reload would also fix)
            setProjects(prev =>
                prev.map(p =>
                    p.id === projectId
                        ? {
                            ...p,
                            deposit: {
                                ...p.deposit,
                                datePaid: previousDate,
                            },
                        }
                        : p
                )
            );
        }
    };

    // Swipe gesture for navigation - using stable wrapper to prevent scroll issues

    const handleSessionTipChange = (sessionId: string, text: string) => {
        // Allow digits and a single decimal point
        const sanitized = text.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
        setSessionTipDraft(prev => ({ ...prev, [sessionId]: normalized }));
    };

    const handleSessionTipBlur = async (projectId: string, sessionId: string) => {
        const draft = sessionTipDraft[sessionId];
        const nextVal = draft !== undefined && draft !== '' ? Number(draft) : 0;
        const prevVal = projects.find(p => p.id === projectId)?.sessions.find(s => s.id === sessionId)?.tip ?? 0;

        // If unchanged, just clear draft
        if (Number.isFinite(prevVal) && prevVal === nextVal) {
            setSessionTipDraft(prev => {
                const copy = { ...prev };
                delete copy[sessionId];
                return copy;
            });
            return;
        }

        // Optimistic UI update
        setProjects(prevProjects =>
            prevProjects.map(p =>
                p.id === projectId
                    ? {
                        ...p,
                        sessions: p.sessions.map(s =>
                            s.id === sessionId ? { ...s, tip: Number.isFinite(nextVal) ? nextVal : 0 } : s
                        ),
                    }
                    : p
            )
        );

        const ok = await updateSessionTip(sessionId, Number.isFinite(nextVal) ? nextVal : 0);
        if (!ok) {
            // Revert on failure
            setProjects(prevProjects =>
                prevProjects.map(p =>
                    p.id === projectId
                        ? {
                            ...p,
                            sessions: p.sessions.map(s =>
                                s.id === sessionId ? { ...s, tip: prevVal } : s
                            ),
                        }
                        : p
                )
            );
        }

        // Clear draft either way
        setSessionTipDraft(prev => {
            const copy = { ...prev };
            delete copy[sessionId];
            return copy;
        });
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
                    <View className="flex-1 bg-background px-4 py-2 gap-6">
                        <KeyboardAwareScrollView bottomOffset={20} contentContainerClassName="w-full" showsVerticalScrollIndicator={false}>
                            <View className="gap-6 pb-6">
                                <View className="items-center justify-center pb-[22px]">
                                    <Image
                                        source={MONEYBAG_IMAGE}
                                        style={{ width: 56, height: 56 }}
                                        resizeMode="contain"
                                    />
                                    <Text variant="h6" className="text-center uppercase">Money</Text>
                                    <Text variant="h6" className="text-center uppercase leading-none">stuff</Text>
                                    <Text className="text-center mt-2 text-text-secondary max-w-[350px]">One place for all deposit, billing, and payment info for this client</Text>
                                </View>

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
                                                <View className="gap-6 w-full">
                                                    <View className="flex-row items-start justify-between gap-2">
                                                        <Image
                                                            source={require('@/assets/images/icons/deposit.png')}
                                                            style={{ width: 48, height: 48 }}
                                                            resizeMode="contain"
                                                        />
                                                        <View className="flex-1">
                                                            <Text variant="h5">Deposit details</Text>
                                                            <Text className="text-text-secondary text-sm">Track every deposit in one calm place. Toggle when used — never lose track.</Text>
                                                        </View>
                                                    </View>
                                                    <View className="flex-row items-start justify-between gap-3">
                                                        <View className="flex-1 gap-3 items-start">
                                                            <Text variant="h5">Amount</Text>
                                                            <Input readOnly={true} value={project.deposit.amount.toString()} leftIcon={DollarSignIcon} />
                                                        </View>
                                                        <View className="flex-1 gap-2">
                                                            <View className="flex-row items-center justify-between">
                                                                <Text>Deposit Paid?</Text>
                                                                <Switch
                                                                    checked={project.deposit.isPaid}
                                                                    onCheckedChange={(checked) => handleDepositPaidToggle(project.id, checked)}
                                                                />
                                                            </View>
                                                            <Text className="text-text-secondary text-xs">A Paid Deposit sends your client their Dashboard Access for the full app experience.</Text>
                                                        </View>
                                                    </View>
                                                    <View className="gap-2">
                                                        <Text variant="h5">Date Paid</Text>
                                                        <DateInput
                                                            selectedDate={project.deposit.datePaid || undefined}
                                                            onDateSelect={(d) => handleDepositDateChange(project.id, d)}
                                                            placeholder="Select date paid"
                                                            dateFormat="MMM DD, YYYY"
                                                            modalTitle="Select Date Paid"
                                                        />
                                                    </View>

                                                    <View className="gap-2">
                                                        <Collapse title="Payment Method" textClassName="text-xl">
                                                            <DropdownPicker
                                                                options={enabledPaymentOptions}
                                                                value={project.deposit.paymentMethod}
                                                                onValueChange={(val) => handleDepositPaymentMethodChange(project.id, val)}
                                                                placeholder="Select payment method"
                                                                modalTitle="Select Payment Method"
                                                            />
                                                        </Collapse>
                                                    </View>

                                                    <View className="gap-2">
                                                        <Collapse title="Deposit Used?" textClassName="text-xl">
                                                            <DropdownPicker
                                                                options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }, { label: "Forfeit", value: "forfeit" }]}
                                                                value={project.deposit.isPaid ? "yes" : project.deposit.isPaid ? "no" : "forfeit"}
                                                                onValueChange={(val) => (console.log(val))}
                                                                placeholder="Select deposit used"
                                                                modalTitle="Select Deposit Used"
                                                            />
                                                        </Collapse>
                                                    </View>

                                                    <View className="flex-row items-start justify-between gap-2">
                                                        <Image
                                                            source={require('@/assets/images/icons/payment.png')}
                                                            style={{ width: 48, height: 48 }}
                                                            resizeMode="contain"
                                                        />
                                                        <View className="flex-1">
                                                            <Text variant="h5">Payment Info</Text>
                                                            <Text className="text-text-secondary text-sm">Keep track of each session here.</Text>
                                                        </View>
                                                    </View>

                                                    {project.sessions.map((session, index) => (
                                                        <View key={session.id} className="gap-6">
                                                            <Pressable
                                                                className="gap-2 flex-row items-center justify-between"
                                                                onPress={() => toggleSession(session.id)}
                                                            >
                                                                <Text variant="h5">
                                                                    {formatDbDate(session.date, 'MMM DD, YYYY')} at {session.time}
                                                                </Text>
                                                                <Icon
                                                                    as={expandedSessions[session.id] ? ChevronUpIcon : ChevronDownIcon}
                                                                    size={24}
                                                                />
                                                            </Pressable>

                                                            {expandedSessions[session.id] && (
                                                                <View className="gap-6 w-full">
                                                                    <View className="gap-2 flex-row items-center justify-between">
                                                                        <Text variant="h5" className="flex-1">Session Rate</Text>
                                                                        <View>
                                                                            <Input readOnly={true} value={session.rate.toString()} className="w-20" leftIcon={DollarSignIcon} />
                                                                        </View>
                                                                    </View>
                                                                    <View className="gap-2">
                                                                        <Collapse title="Payment Method" textClassName="text-xl">
                                                                            <DropdownPicker
                                                                                options={enabledPaymentOptions}
                                                                                value={session.paymentMethod}
                                                                                onValueChange={(val) => handleSessionPaymentMethodChange(project.id, session.id, val)}
                                                                                placeholder="Select payment method"
                                                                                modalTitle="Select Payment Method"
                                                                            />
                                                                        </Collapse>
                                                                    </View>
                                                                    <View className="gap-2 flex-row items-center justify-between">
                                                                        <Text variant="h5" className="flex-1">Tip</Text>
                                                                        <View>
                                                                            <Input
                                                                                value={(sessionTipDraft[session.id] ?? session.tip.toString())}
                                                                                onChangeText={(t) => handleSessionTipChange(session.id, t)}
                                                                                onBlur={() => handleSessionTipBlur(project.id, session.id)}
                                                                                keyboardType="decimal-pad"
                                                                                className="w-20"
                                                                                leftIcon={DollarSignIcon}
                                                                            />
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                            )}
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </StableGestureWrapper>
            </SafeAreaView>
        </>
    );
}
