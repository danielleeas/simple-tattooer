import { useState, useRef, useEffect } from "react";
import { View, Image, Dimensions, Pressable, ActivityIndicator, Modal } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CustomModal from "@/components/lib/custom-modal";
import { useToast } from "@/lib/contexts";
import { useAuth } from "@/lib/contexts";
import {
    getArtistFAQs,
    createFAQCategory,
    updateFAQCategory,
    deleteFAQCategory,
    createFAQItem,
    updateFAQItem,
    deleteFAQItem
} from "@/lib/services/faq-service";
import { FAQCategoryWithItems, FAQItem } from "@/lib/types";
import { Minus, Plus, X } from "lucide-react-native";

const { width } = Dimensions.get('window');

// Collapsible FAQ Item Component
interface CollapsibleFAQItemProps {
    question: string;
    answer: string;
    isExpanded: boolean;
    onToggle: () => void;
    onDelete: () => void;
    onEdit?: () => void;
    isDeleting?: boolean;
}

const CollapsibleFAQItem = ({
    question,
    answer,
    isExpanded,
    onToggle,
    onDelete,
    onEdit,
    isDeleting = false
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
                    <View className="pt-3 flex-row items-center justify-start gap-2">
                        <Pressable className="p-1 items-center justify-start flex-row gap-1" onPress={onEdit}>
                            <Image
                                source={require('@/assets/images/icons/pencil_simple.png')}
                                style={{ width: 14, height: 14 }}
                                resizeMode="contain"
                            />
                            <Text className="text-xs text-text-secondary">Edit</Text>
                        </Pressable>
                        <Pressable
                            className="p-1 items-center justify-start flex-row gap-1"
                            onPress={onDelete}
                            disabled={isDeleting}
                        >
                            <Image
                                source={require('@/assets/images/icons/trash.png')}
                                style={{ width: 14, height: 14, opacity: isDeleting ? 0.5 : 1 }}
                                resizeMode="contain"
                            />
                            <Text className={`text-xs ${isDeleting ? 'text-text-secondary opacity-50' : 'text-text-secondary'}`}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );
};


export default function FAQPage() {
    const { toast } = useToast();
    const { artist } = useAuth();

    // State for FAQ data
    const [faqs, setFaqs] = useState<FAQCategoryWithItems[]>([]);
    const [loading, setLoading] = useState(true);

    // State for collapsible FAQ items
    const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

    // State for modals
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [showAddFAQModal, setShowAddFAQModal] = useState(false);
    const [showEditFAQModal, setShowEditFAQModal] = useState(false);

    // State for form data
    const [categoryFormData, setCategoryFormData] = useState({ category_name: '' });
    const [faqFormData, setFaqFormData] = useState({ question: '', answer: '' });
    const [editingCategory, setEditingCategory] = useState<{ categoryId: string; category_name: string } | null>(null);
    const [editingItem, setEditingItem] = useState<{ itemId: string; question: string; answer: string; categoryId: string } | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteType, setDeleteType] = useState<'faq' | 'aftercare'>('faq');
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // Loading states for operations
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isCreatingItem, setIsCreatingItem] = useState(false);
    const [isUpdatingItem, setIsUpdatingItem] = useState(false);
    const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
    const [isDeletingItem, setIsDeletingItem] = useState(false);
    const [isDeletingCategory, setIsDeletingCategory] = useState(false);

    const openDeleteModal = (type: 'faq' | 'aftercare', id: string) => {
        setDeleteType(type);
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    // Load FAQs on component mount
    useEffect(() => {
        loadFAQs();
    }, []);

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

    const openAddFAQModal = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        setFaqFormData({ question: '', answer: '' });
        setShowAddFAQModal(true);
    };

    const openEditFAQModal = (item: FAQItem, categoryId: string) => {
        setEditingItem({
            itemId: item.id,
            question: item.question,
            answer: item.answer,
            categoryId: categoryId
        });
        setShowEditFAQModal(true);
    };

    const openEditCategoryModal = (category: FAQCategoryWithItems) => {
        setEditingCategory({
            categoryId: category.id,
            category_name: category.category_name
        });
        setShowEditCategoryModal(true);
    };

    const saveFAQ = async () => {
        if (!selectedCategoryId || !faqFormData.question.trim() || !faqFormData.answer.trim()) return;

        setIsCreatingItem(true);

        const result = await createFAQItem({
            category_id: selectedCategoryId,
            question: faqFormData.question.trim(),
            answer: faqFormData.answer.trim()
        });

        if (result.success && result.data) {
            // Update state directly instead of reloading
            setFaqs(prev => prev.map(faq =>
                faq.id === selectedCategoryId
                    ? { ...faq, faq_items: [...faq.faq_items, result.data!] }
                    : faq
            ));

            // Reset form and close modal
            setFaqFormData({ question: '', answer: '' });
            setSelectedCategoryId(null);
            setShowAddFAQModal(false);

            toast({
                variant: 'success',
                title: 'FAQ Added!',
                duration: 3000,
            });
        } else {
            toast({
                variant: 'error',
                title: 'Error',
                description: result.error || 'Failed to add FAQ',
                duration: 3000,
            });
        }

        setIsCreatingItem(false);
    };

    const saveCategory = async () => {
        if (!artist?.id || !categoryFormData.category_name.trim()) return;

        setIsCreatingCategory(true);

        const result = await createFAQCategory(artist.id, {
            category_name: categoryFormData.category_name.trim()
        });

        if (result.success && result.data) {
            // Insert new category at top (under header) instead of bottom
            setFaqs(prev => [...prev, { ...result.data!, faq_items: [] }]);

            setCategoryFormData({ category_name: '' });
            setShowAddCategoryModal(false);
            toast({
                variant: 'success',
                title: 'Category Added!',
                duration: 3000,
            });
        } else {
            toast({
                variant: 'error',
                title: 'Error',
                description: result.error || 'Failed to add category',
                duration: 3000,
            });
        }

        setIsCreatingCategory(false);
    };

    const handleFaqDelete = async (itemId: string) => {
        // Open modal instead of deleting immediately
        openDeleteModal('faq', itemId);
    };

    const handleCategoryDelete = async (categoryId: string) => {
        // Open modal instead of deleting immediately
        openDeleteModal('aftercare', categoryId);
    };

    const saveEditItem = async () => {
        if (!editingItem) return;

        setIsUpdatingItem(true);

        const result = await updateFAQItem(editingItem.itemId, {
            question: editingItem.question,
            answer: editingItem.answer
        });

        if (result.success && result.data) {
            // Update state directly instead of reloading
            setFaqs(prev => prev.map(faq => ({
                ...faq,
                faq_items: faq.faq_items.map(item =>
                    item.id === editingItem.itemId ? result.data! : item
                )
            })));

            setEditingItem(null);
            setShowEditFAQModal(false);
            toast({
                variant: 'success',
                title: 'FAQ Updated!',
                duration: 3000,
            });
        } else {
            toast({
                variant: 'error',
                title: 'Error',
                description: result.error || 'Failed to update FAQ',
                duration: 3000,
            });
        }

        setIsUpdatingItem(false);
    };

    const saveEditCategory = async () => {
        if (!editingCategory) return;

        setIsUpdatingCategory(true);

        const result = await updateFAQCategory(editingCategory.categoryId, {
            category_name: editingCategory.category_name
        });

        if (result.success && result.data) {
            // Update state directly instead of reloading
            setFaqs(prev => prev.map(faq =>
                faq.id === editingCategory.categoryId
                    ? { ...faq, category_name: result.data!.category_name }
                    : faq
            ));

            setEditingCategory(null);
            setShowEditCategoryModal(false);
            toast({
                variant: 'success',
                title: 'Category Updated!',
                duration: 3000,
            });
        } else {
            toast({
                variant: 'error',
                title: 'Error',
                description: result.error || 'Failed to update category',
                duration: 3000,
            });
        }

        setIsUpdatingCategory(false);
    };

    // Used by the modal added below to confirm deletion
    const handleFaqDeleteConfirm = async () => {
        if (!deleteTargetId) return;

        if (deleteType === 'faq') {
            setIsDeletingItem(true);
            const res = await deleteFAQItem(deleteTargetId);
            if (res.success) {
                // Update state directly instead of reloading
                setFaqs(prev => prev.map(faq => ({
                    ...faq,
                    faq_items: faq.faq_items.filter(item => item.id !== deleteTargetId)
                })));
                toast({ variant: 'success', title: 'FAQ Deleted!', duration: 3000 });
            } else {
                toast({ variant: 'error', title: 'Error', description: res.error || 'Failed to delete FAQ', duration: 3000 });
            }
            setIsDeletingItem(false);
        } else {
            setIsDeletingCategory(true);
            const res = await deleteFAQCategory(deleteTargetId);
            if (res.success) {
                // Update state directly instead of reloading
                setFaqs(prev => prev.filter(faq => faq.id !== deleteTargetId));
                toast({ variant: 'success', title: 'Category Deleted!', duration: 3000 });
            } else {
                toast({ variant: 'error', title: 'Error', description: res.error || 'Failed to delete category', duration: 3000 });
            }
            setIsDeletingCategory(false);
        }
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
    };

    return (
        <View style={{ width }} className="flex-1">
            <KeyboardAwareScrollView
                bottomOffset={100}
                
                contentContainerClassName="w-full px-4"
                showsVerticalScrollIndicator={false}
            >
                <View className="gap-6 pb-4">
                    <View className="items-center justify-center" style={{ height: 180 }}>
                        <Image
                            source={require('@/assets/images/icons/question.png')}
                            style={{ width: 56, height: 56 }}
                            resizeMode="contain"
                        />
                        <Text variant="h6" className="text-center uppercase">edit</Text>
                        <Text variant="h6" className="text-center uppercase leading-none">faqs</Text>
                        <Text className="text-center mt-2 text-text-secondary max-w-80">organize your FAQS to help clients find answers faster</Text>
                    </View>

                    {loading ? (
                        <View className="items-center justify-center" style={{ height: 180 }}>
                            <ActivityIndicator size="large" />
                            <Text className="mt-4 text-text-secondary">Loading FAQs...</Text>
                        </View>
                    ) : (
                        <View className="gap-10">
                            {faqs.length === 0 && (
                                <View className="items-center py-8">
                                    <Text className="text-text-secondary text-center">
                                        No FAQs yet.
                                    </Text>
                                </View>
                            )}

                            {faqs.map((faq, index) => (
                                <View key={faq.id} className="gap-2">
                                    <View className="flex-row items-center justify-start gap-2">
                                        <Text variant="h5">{faq.category_name}</Text>
                                        <View className="flex-row gap-1">
                                            <Pressable className="h-8 w-8 items-center justify-center rounded-full" onPress={() => openEditCategoryModal(faq)}>
                                                <Image
                                                    source={require('@/assets/images/icons/pencil_simple.png')}
                                                    style={{ width: 22, height: 22 }}
                                                    resizeMode="contain"
                                                />
                                            </Pressable>
                                            <Pressable
                                                className="h-8 w-8 items-center justify-center rounded-full"
                                                onPress={() => handleCategoryDelete(faq.id)}
                                                disabled={isDeletingCategory}
                                            >
                                                <Icon
                                                    as={X}
                                                    size={24}
                                                    strokeWidth={1}
                                                    style={{ opacity: isDeletingCategory ? 0.5 : 1 }}
                                                />
                                            </Pressable>
                                        </View>
                                    </View>
                                    <View className="pb-4">
                                        {faq.faq_items.map((item) => (
                                            <CollapsibleFAQItem
                                                key={item.id}
                                                question={item.question}
                                                answer={item.answer}
                                                isExpanded={expandedItems[item.id] || false}
                                                onToggle={() => toggleFAQItem(item.id)}
                                                onDelete={() => handleFaqDelete(item.id)}
                                                onEdit={() => openEditFAQModal(item, faq.id)}
                                                isDeleting={isDeletingItem}
                                            />
                                        ))}
                                    </View>
                                    <View className="gap-4">
                                        <Button
                                            variant="outline"
                                            onPress={() => openAddFAQModal(faq.id)}
                                        >
                                            <Text>Add New FAQ</Text>
                                            <Icon as={Plus} size={24} strokeWidth={1} />
                                        </Button>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </KeyboardAwareScrollView>

            {!(showAddCategoryModal || showEditCategoryModal || showAddFAQModal || showEditFAQModal) && (
                <View className="gap-4 px-4 pb-4 pt-2">
                    <Button variant="outline" onPress={() => { setCategoryFormData({ category_name: '' }); setShowAddCategoryModal(true); }}>
                        <Text>Add New Category</Text>
                        <Icon as={Plus} size={24} strokeWidth={1} />
                    </Button>
                </View>
            )}


            <Modal
                visible={isDeleteModalOpen}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsDeleteModalOpen(false)}
            >
                <View className="flex-1 bg-black/50 justify-end items-center">
                    <View className="w-full bg-background-secondary rounded-t-3xl p-6 gap-6">
                        <View style={{ gap: 8, alignItems: 'center', height: 200 }}>
                            <Image source={require('@/assets/images/icons/warning_circle.png')} style={{ width: 80, height: 80 }} />
                            <Text variant="h3">{deleteType === 'faq' ? 'Delete FAQ' : 'Delete Category'}</Text>
                            <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? This action can't be undone.</Text>
                        </View>
                        <View style={{ gap: 8, flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <Button variant="outline" onPress={() => setIsDeleteModalOpen(false)} size='lg' className='items-center justify-center'>
                                    <Text>Cancel</Text>
                                </Button>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Button
                                    variant="outline"
                                    onPress={handleFaqDeleteConfirm}
                                    size='lg'
                                    className='items-center justify-center'
                                    disabled={isDeletingItem || isDeletingCategory}
                                >
                                    {(isDeletingItem || isDeletingCategory) ? (
                                        <View className="flex-row items-center gap-2">
                                            <ActivityIndicator size="small" color="white" />
                                            <Text>Deleting...</Text>
                                        </View>
                                    ) : (
                                        <Text>Delete</Text>
                                    )}
                                </Button>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Category Modal */}
            <CustomModal
                visible={showAddCategoryModal}
                onClose={() => {
                    setShowAddCategoryModal(false);
                    setCategoryFormData({ category_name: '' });
                }}
                closeOnBackdrop={true}
                showCloseButton={false}
                backdropOpacity={0.5}
                animationDuration={300}
                borderRadius={40}
                variant="bottom-sheet"
                className="bg-background-secondary"
            >
                <View className="gap-6 px-4 py-0 pb-4">
                    <View className="items-center">
                        <Text variant="h4">Add New Category</Text>
                        <Text className="text-text-secondary text-center mt-2">
                            Create a new FAQ category
                        </Text>
                    </View>

                    <View className="gap-4">
                        <Input
                            placeholder="Category name"
                            value={categoryFormData.category_name}
                            onChangeText={(value) => setCategoryFormData({ category_name: value })}
                            className="text-base bg-background-secondary"
                        />
                    </View>

                    <View className="flex-row gap-3">
                        <Button
                            variant="outline"
                            onPress={() => {
                                setShowAddCategoryModal(false);
                                setCategoryFormData({ category_name: '' });
                            }}
                            disabled={isCreatingCategory}
                            className="flex-1"
                        >
                            <Text>Cancel</Text>
                        </Button>
                        <Button
                            variant="outline"
                            onPress={saveCategory}
                            disabled={!categoryFormData.category_name.trim() || isCreatingCategory}
                            className="flex-1"
                        >
                            {isCreatingCategory ? (
                                <View className="flex-row items-center gap-2">
                                    <ActivityIndicator size="small" color="white" />
                                    <Text>Saving...</Text>
                                </View>
                            ) : (
                                <Text>Save</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </CustomModal>

            {/* Edit Category Modal */}
            <CustomModal
                visible={showEditCategoryModal}
                onClose={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                }}
                closeOnBackdrop={true}
                showCloseButton={false}
                backdropOpacity={0.5}
                animationDuration={300}
                borderRadius={40}
                variant="bottom-sheet"
                className="bg-background-secondary"
            >
                <View className="gap-6 px-4 py-0 pb-4">
                    <View className="items-center">
                        <Text variant="h4">Edit Category</Text>
                        <Text className="text-text-secondary text-center mt-2">
                            Update category name
                        </Text>
                    </View>

                    <View className="gap-4">
                        <Input
                            placeholder="Category name"
                            value={editingCategory?.category_name || ''}
                            onChangeText={(value) => setEditingCategory(prev => prev ? { ...prev, category_name: value } : null)}
                            className="text-base bg-background-secondary"
                        />
                    </View>

                    <View className="flex-row gap-3">
                        <Button
                            variant="outline"
                            onPress={() => {
                                setShowEditCategoryModal(false);
                                setEditingCategory(null);
                            }}
                            disabled={isUpdatingCategory}
                            className="flex-1"
                        >
                            <Text>Cancel</Text>
                        </Button>
                        <Button
                            variant="outline"
                            onPress={saveEditCategory}
                            disabled={!editingCategory?.category_name.trim() || isUpdatingCategory}
                            className="flex-1"
                        >
                            {isUpdatingCategory ? (
                                <View className="flex-row items-center gap-2">
                                    <ActivityIndicator size="small" color="white" />
                                    <Text>Saving...</Text>
                                </View>
                            ) : (
                                <Text>Save</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </CustomModal>

            {/* Add FAQ Modal */}
            <CustomModal
                visible={showAddFAQModal}
                onClose={() => {
                    setShowAddFAQModal(false);
                    setFaqFormData({ question: '', answer: '' });
                    setSelectedCategoryId(null);
                }}
                closeOnBackdrop={true}
                showCloseButton={false}
                backdropOpacity={0.5}
                animationDuration={300}
                borderRadius={40}
                variant="bottom-sheet"
                className="bg-background-secondary"
            >
                <View className="gap-6 px-4 py-0 pb-4">
                    <View className="items-center">
                        <Text variant="h4">Add New FAQ</Text>
                        <Text className="text-text-secondary text-center mt-2">
                            Add a new FAQ item
                        </Text>
                    </View>

                    <View className="gap-4">
                        <Input
                            placeholder="Question"
                            value={faqFormData.question}
                            onChangeText={(value) => setFaqFormData(prev => ({ ...prev, question: value }))}
                            className="text-base bg-background-secondary"
                        />
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            placeholder="Answer"
                            value={faqFormData.answer}
                            onChangeText={(value) => setFaqFormData(prev => ({ ...prev, answer: value }))}
                            className="text-text-secondary text-sm min-h-20"
                        />
                    </View>

                    <View className="flex-row gap-3">
                        <Button
                            variant="outline"
                            onPress={() => {
                                setShowAddFAQModal(false);
                                setFaqFormData({ question: '', answer: '' });
                                setSelectedCategoryId(null);
                            }}
                            disabled={isCreatingItem}
                            className="flex-1"
                        >
                            <Text>Cancel</Text>
                        </Button>
                        <Button
                            variant="outline"
                            onPress={saveFAQ}
                            disabled={!faqFormData.question.trim() || !faqFormData.answer.trim() || isCreatingItem}
                            className="flex-1"
                        >
                            {isCreatingItem ? (
                                <View className="flex-row items-center gap-2">
                                    <ActivityIndicator size="small" color="white" />
                                    <Text>Saving...</Text>
                                </View>
                            ) : (
                                <Text>Save</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </CustomModal>

            {/* Edit FAQ Modal */}
            <CustomModal
                visible={showEditFAQModal}
                onClose={() => {
                    setShowEditFAQModal(false);
                    setEditingItem(null);
                }}
                closeOnBackdrop={true}
                showCloseButton={false}
                backdropOpacity={0.5}
                animationDuration={300}
                borderRadius={40}
                variant="bottom-sheet"
                className="bg-background-secondary"
            >
                <View className="gap-6 px-4 py-0 pb-4">
                    <View className="items-center">
                        <Text variant="h4">Edit FAQ</Text>
                        <Text className="text-text-secondary text-center mt-2">
                            Update FAQ question and answer
                        </Text>
                    </View>

                    <View className="gap-4">
                        <Input
                            placeholder="Question"
                            value={editingItem?.question || ''}
                            onChangeText={(value) => setEditingItem(prev => prev ? { ...prev, question: value } : null)}
                            className="text-base bg-background-secondary"
                        />
                        <Textarea
                            placeholder="Answer"
                            value={editingItem?.answer || ''}
                            onChangeText={(value) => setEditingItem(prev => prev ? { ...prev, answer: value } : null)}
                            className="text-text-secondary text-sm min-h-20"
                        />
                    </View>

                    <View className="flex-row gap-3">
                        <Button
                            variant="outline"
                            onPress={() => {
                                setShowEditFAQModal(false);
                                setEditingItem(null);
                            }}
                            disabled={isUpdatingItem}
                            className="flex-1"
                        >
                            <Text>Cancel</Text>
                        </Button>
                        <Button
                            variant="outline"
                            onPress={saveEditItem}
                            disabled={!editingItem?.question.trim() || !editingItem?.answer.trim() || isUpdatingItem}
                            className="flex-1"
                        >
                            {isUpdatingItem ? (
                                <View className="flex-row items-center gap-2">
                                    <ActivityIndicator size="small" color="white" />
                                    <Text>Saving...</Text>
                                </View>
                            ) : (
                                <Text>Save</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </CustomModal>
        </View>
    );
}