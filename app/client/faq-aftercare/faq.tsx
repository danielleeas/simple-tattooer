import { useState, useEffect } from "react";
import { View, ActivityIndicator, Image } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Minus, Plus } from "lucide-react-native";
import { Pressable } from "react-native";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { getArtistFAQs } from "@/lib/services/faq-service";
import { FAQCategoryWithItems } from "@/lib/types";
import { useToast } from "@/lib/contexts/toast-context";

// Collapsible FAQ Item Component for Client
interface CollapsibleFAQItemProps {
    question: string;
    answer: string;
    isExpanded: boolean;
    onToggle: () => void;
}

const CollapsibleFAQItem = ({
    question,
    answer,
    isExpanded,
    onToggle
}: CollapsibleFAQItemProps) => {
    return (
        <View>
            <Pressable
                className="flex-row items-center justify-start gap-5 py-4"
                onPress={onToggle}
            >
                <View className="flex-1">
                    <Text>{question}</Text>
                </View>
                <Icon as={isExpanded ? Minus : Plus} size={24} strokeWidth={1} />
            </Pressable>
            {isExpanded && (
                <View>
                    {answer.split('\n').map((line, index) => (
                        <Text key={index} className="text-text-secondary leading-5">{line}</Text>
                    ))}
                </View>
            )}
        </View>
    );
};

export default function FAQPage() {
    const { toast } = useToast();
    const artist = useSelector((state: RootState) => state.artist.artist);

    const [faqs, setFaqs] = useState<FAQCategoryWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (artist?.id) {
            loadFAQs();
        }
    }, [artist?.id]);

    const loadFAQs = async () => {
        if (!artist?.id) return;

        setLoading(true);
        const result = await getArtistFAQs(artist.id);

        if (result.success) {
            setFaqs(result.data || []);
        } else {
            toast({
                variant: 'error',
                title: 'Error',
                description: result.error || 'Failed to load FAQs',
                duration: 3000,
            });
        }
        setLoading(false);
    };

    const toggleFAQItem = (itemId: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleMessage = () => {
        // Navigate to messages - adjust route as needed
        // router.push('/client/messages');
    };

    return (
        <KeyboardAwareScrollView
            bottomOffset={50}
            contentContainerClassName="w-full"
            showsVerticalScrollIndicator={false}
        >
            <View className="flex-1 gap-6 bg-background px-4 pb-8 pt-2">
                {loading ? (
                    <View className="items-center justify-center" style={{ height: 200 }}>
                        <ActivityIndicator size="large" />
                        <Text className="mt-4 text-text-secondary">Loading FAQs...</Text>
                    </View>
                ) : (
                    <>
                        {faqs.length === 0 ? (
                            <View className="items-center py-8">
                                <Text className="text-text-secondary text-center">
                                    No FAQs available yet.
                                </Text>
                            </View>
                        ) : (
                            <View className="gap-6">
                                {faqs.map((faq) => (
                                    <View key={faq.id} className="gap-2">
                                        <Text variant="h5">{faq.category_name}</Text>
                                        <View className="gap-2">
                                            {faq.faq_items.map((item, index) => (
                                                <View key={item.id}>
                                                    <CollapsibleFAQItem
                                                        question={item.question}
                                                        answer={item.answer}
                                                        isExpanded={expandedItems[item.id] || false}
                                                        onToggle={() => toggleFAQItem(item.id)}
                                                    />
                                                    {index < faq.faq_items.length - 1 && (
                                                        <View className="h-px bg-border my-2" />
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View className="gap-4 pt-4">
                            <View className="gap-2">
                                <Text variant="h4">Got another question?</Text>
                                <Pressable
                                    onPress={handleMessage}
                                    className="flex-row gap-2"
                                >
                                    <Text className="text-text-secondary">
                                    📩 Message me directly in Your Messages thread.I’m happy to help
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </>
                )}
            </View>
        </KeyboardAwareScrollView>
    );
}

