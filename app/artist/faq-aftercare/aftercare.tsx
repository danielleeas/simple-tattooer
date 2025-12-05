import { useState, useEffect } from "react";
import { View, Image, Dimensions, Pressable, ScrollView, Modal, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CustomModal from "@/components/lib/custom-modal";
import { useToast } from "@/lib/contexts";
import { useAuth } from "@/lib/contexts/auth-context";
import { Plus } from "lucide-react-native";
import {
    getArtistAftercareTips,
    createAftercareTip,
    updateAftercareTip,
    deleteAftercareTip
} from "@/lib/services/aftercare-service";
import { AftercareTip, CreateAftercareTipData } from "@/lib/types";

const { width } = Dimensions.get('window');

// Aftercare Item Component
interface AftercareItemProps {
    tip: AftercareTip;
    onEdit: () => void;
    onDelete: () => void;
}

const AftercareItem = ({ tip, onEdit, onDelete }: AftercareItemProps) => {
    // Parse instructions from string to array
    const instructions = tip.instructions.split('\n').filter(instruction => instruction.trim() !== '');

    return (
        <View className="gap-2">
            <Text>{tip.title}</Text>
            <View>
                {instructions.map((instruction, index) => (
                    <Text key={index} variant="small" className="text-text-secondary leading-1">
                        {instruction.trim()}
                    </Text>
                ))}
            </View>
            <View className="flex-row items-center justify-start gap-2">
                <Pressable className="p-1 flex-row items-center justify-start gap-1" onPress={onEdit}>
                    <Image
                        source={require('@/assets/images/icons/pencil_simple.png')}
                        style={{ width: 14, height: 14 }}
                        resizeMode="contain"
                    />
                    <Text className="text-xs text-text-secondary">Edit</Text>
                </Pressable>
                <Pressable className="p-1 flex-row items-center justify-start gap-1" onPress={onDelete}>
                    <Image
                        source={require('@/assets/images/icons/trash.png')}
                        style={{ width: 14, height: 14 }}
                        resizeMode="contain"
                    />
                    <Text className="text-xs text-text-secondary">Delete</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default function AftercarePage() {
    const { toast } = useToast();
    const { artist, isAuthenticated } = useAuth();

    const [aftercareItems, setAftercareItems] = useState<AftercareTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTip, setEditingTip] = useState<AftercareTip | null>(null);
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [newTipTitle, setNewTipTitle] = useState('');
    const [newTipInstructions, setNewTipInstructions] = useState('');

    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // Loading states
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Load aftercare tips on component mount
    useEffect(() => {
        if (isAuthenticated && artist?.id) {
            loadAftercareTips();
        }
    }, [isAuthenticated, artist?.id]);

    const loadAftercareTips = async () => {
        if (!artist?.id) return;

        setLoading(true);
        const result = await getArtistAftercareTips(artist.id);

        if (result.success && result.data) {
            setAftercareItems(result.data);
        } else {
            toast({
                variant: 'error',
                title: 'Failed to load aftercare tips',
                description: result.error || 'Unknown error occurred',
                duration: 5000,
            });
        }
        setLoading(false);
    };

    const handleEdit = (tip: AftercareTip) => {
        setEditingTip(tip);
        setNewTipTitle(tip.title);
        setNewTipInstructions(tip.instructions);
        setShowAddEditModal(true);
    };

    const handleDelete = (tipId: string) => {
        setDeleteTargetId(tipId);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTargetId) return;

        setIsDeleting(true);
        const result = await deleteAftercareTip(deleteTargetId);

        if (result.success) {
            setAftercareItems(prev => prev.filter(item => item.id !== deleteTargetId));
            toast({
                variant: 'success',
                title: 'Aftercare tip deleted!',
                duration: 3000,
            });
        } else {
            toast({
                variant: 'error',
                title: 'Failed to delete aftercare tip',
                description: result.error || 'Unknown error occurred',
                duration: 5000,
            });
        }

        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
    };

    const handleAddNewTips = () => {
        setEditingTip(null);
        setNewTipTitle('');
        setNewTipInstructions('');
        setShowAddEditModal(true);
    };

    const handleSaveTip = async () => {
        if (!artist?.id) return;

        if (!newTipTitle.trim() || !newTipInstructions.trim()) {
            toast({
                variant: 'error',
                title: 'Please fill in all fields',
                duration: 3000,
            });
            return;
        }

        setIsSaving(true);

        const tipData: CreateAftercareTipData = {
            title: newTipTitle.trim(),
            instructions: newTipInstructions.trim()
        };

        let result;
        if (editingTip) {
            result = await updateAftercareTip(editingTip.id, tipData);
        } else {
            result = await createAftercareTip(artist.id, tipData);
        }

        if (result.success) {
            if (editingTip) {
                // Update existing tip in state
                setAftercareItems(prev => prev.map(item =>
                    item.id === editingTip.id ? result.data! : item
                ));
            } else {
                // Add new tip to state
                setAftercareItems(prev => [...prev, result.data!]);
            }

            setShowAddEditModal(false);
            setEditingTip(null);
            setNewTipTitle('');
            setNewTipInstructions('');
            toast({
                variant: 'success',
                title: editingTip ? 'Aftercare tip updated!' : 'Aftercare tip created!',
                duration: 3000,
            });
        } else {
            toast({
                variant: 'error',
                title: editingTip ? 'Failed to update aftercare tip' : 'Failed to create aftercare tip',
                description: result.error || 'Unknown error occurred',
                duration: 5000,
            });
        }

        setIsSaving(false);
    };

    const handleInstructionsChange = (text: string) => {
        // Split by line breaks to process each line
        const lines = text.split('\n');
        const processedLines = lines.map((line, index) => {
            // Skip empty lines
            if (line.trim() === '') return line;

            // If line doesn't start with bullet point, add it
            if (!line.startsWith('•')) {
                return '• ' + line;
            }

            return line;
        });

        setNewTipInstructions(processedLines.join('\n'));
    };

    const handleCancelEdit = () => {
        setShowAddEditModal(false);
        setEditingTip(null);
        setNewTipTitle('');
        setNewTipInstructions('');
    };


    const renderModalForm = () => (
        <View className="gap-6 px-4 pb-8">
            <View className="gap-2">
                <Text variant="h3" className="text-center">
                    {editingTip ? 'Edit Aftercare Tip' : 'Add New Aftercare Tip'}
                </Text>
                <Text className="text-center text-text-secondary text-sm">
                    {editingTip ? 'Update your aftercare instructions' : 'Create instructions to help clients care for their tattoos'}
                </Text>
            </View>

            <View className="gap-4">
                {/* Title Input */}
                <View className="gap-2">
                    <Text className="text-sm font-medium">Title</Text>
                    <Input
                        value={newTipTitle}
                        onChangeText={setNewTipTitle}
                        placeholder="e.g., Second Skin, Healing Process, etc."
                        className="text-base bg-background-secondary"
                    />
                </View>

                {/* Instructions Input */}
                <View className="gap-2">
                    <Text className="text-sm font-medium">Instructions</Text>
                    <Textarea
                        spellCheck={false}
                        autoCorrect={false}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoFocus={false}
                        value={newTipInstructions}
                        onChangeText={handleInstructionsChange}
                        placeholder="Enter your aftercare instructions here...&#10;&#10;Example:&#10;• Keep the bandage on for 24 hours&#10;• Wash gently with mild soap&#10;• Apply thin layer of ointment"
                        className="text-sm min-h-[120px]"
                        multiline={true}
                        numberOfLines={6}
                    />
                </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 pt-2">
                <View className="flex-1">
                    <Button
                        variant="outline"
                        onPress={handleCancelEdit}
                        disabled={isSaving}
                        className="items-center justify-center"
                    >
                        <Text>Cancel</Text>
                    </Button>
                </View>
                <View className="flex-1">
                    <Button
                        variant="outline"
                        onPress={handleSaveTip}
                        disabled={isSaving}
                        className="items-center justify-center"
                    >
                        {isSaving ? (
                            <View className="flex-row items-center gap-2">
                                <ActivityIndicator size="small" color="white" />
                                <Text>Saving...</Text>
                            </View>
                        ) : (
                            <Text>{editingTip ? 'Update' : 'Create'}</Text>
                        )}
                    </Button>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={{ width }} className="flex-1 items-center justify-center">
                <Text>Loading aftercare tips...</Text>
            </View>
        );
    }

    return (
        <View style={{ width }} className="flex-1">
            <ScrollView contentContainerClassName="w-full px-4 pb-4" showsVerticalScrollIndicator={false}>
                <View className="gap-6">
                    <View className="items-center justify-center" style={{ height: 180 }}>
                        <Image
                            source={require('@/assets/images/icons/aftercare.png')}
                            style={{ width: 56, height: 56 }}
                            resizeMode="contain"
                        />
                        <Text variant="h6" className="text-center uppercase">edit</Text>
                        <Text variant="h6" className="text-center uppercase leading-none">aftercare</Text>
                        <Text className="text-center mt-2 text-text-secondary max-w-80">Share how to keep your work looking its best, long after they leave</Text>
                    </View>

                    <View className="gap-6">
                        {aftercareItems.length === 0 && (
                            <View className="items-center py-8">
                                <Text className="text-text-secondary text-center">
                                    No aftercare tips yet.
                                </Text>
                            </View>
                        )}
                        {aftercareItems.map((item) => (
                            <AftercareItem
                                key={item.id}
                                tip={item}
                                onEdit={() => handleEdit(item)}
                                onDelete={() => handleDelete(item.id)}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
            {!(showAddEditModal || isDeleteModalOpen) && (
                <View className="gap-4 px-4 py-4">
                    <Button variant="outline" onPress={handleAddNewTips}>
                        <Text>Add New Tips</Text>
                        <Icon as={Plus} size={24} strokeWidth={1} />
                    </Button>
                </View>
            )}

            {/* Add/Edit Modal */}
            <CustomModal
                visible={showAddEditModal}
                onClose={handleCancelEdit}
                variant="bottom-sheet"
                showCloseButton={false}
                closeOnBackdrop={true}
                backdropOpacity={0.5}
                animationDuration={300}
                borderRadius={40}
                className="bg-background-secondary"
            >
                {renderModalForm()}
            </CustomModal>

            {/* Delete Confirmation Modal */}
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
                            <Text variant="h3">Delete Aftercare Tip</Text>
                            <Text className="text-text-secondary text-center text-sm leading-5">Are you sure? This action can't be undone.</Text>
                        </View>
                        <View style={{ gap: 8, flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <Button
                                    onPress={() => setIsDeleteModalOpen(false)}
                                    variant="outline"
                                    size='lg'
                                    className='items-center justify-center'
                                    disabled={isDeleting}
                                >
                                    <Text>Cancel</Text>
                                </Button>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Button
                                    variant="outline"
                                    onPress={handleDeleteConfirm}
                                    size='lg'
                                    className='items-center justify-center'
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
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
        </View>
    );
}
