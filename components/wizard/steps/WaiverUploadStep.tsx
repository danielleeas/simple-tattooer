import React from 'react';
import { View, Image, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { Note } from '@/components/ui/note';
import { FilePicker } from '@/components/lib/file-picker';

export function WaiverUploadStep() {

    const { waiverUpload, updateWaiverUpload } = useSetupWizard();

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-6 pb-4">
                <View className="items-center justify-center pb-2">
                    <Image
                        source={require('@/assets/images/icons/need_drawing.png')}
                        style={{ width: 56, height: 56 }}
                        resizeMode="contain"
                    />
                    <Text variant="h6" className="text-center uppercase">waiver</Text>
                    <Text variant="h6" className="text-center uppercase leading-none">upload</Text>
                </View>
                <View className="gap-6">
                    <View className="gap-1">
                        <FilePicker
                            onFileSelected={(file) => updateWaiverUpload({ waiverDocument: file })}
                            onFileRemoved={() => updateWaiverUpload({ waiverDocument: { uri: '', name: '', type: '', size: 0 } })}
                            placeholder="Upload your document"
                            helperText="Upload your standard waiver here (PDF or clear image file)."
                            maxFileSize={10 * 1024 * 1024} // 10MB
                            allowedFileTypes={['image/*', 'application/pdf']}
                            initialFile={waiverUpload.waiverDocument ? { uri: waiverUpload.waiverDocument.uri, name: waiverUpload.waiverDocument.name, type: waiverUpload.waiverDocument.type, size: waiverUpload.waiverDocument.size } : null}
                        />
                        <Text className="text-center">PDF, JPG, PNG — whatever works</Text>
                        <Text className="text-center leading-none">for you (max 10MB)</Text>
                    </View>

                    <Note
                        message="You can add this later in Settings."
                    />
                </View>
            </View>
        </ScrollView>
    )
}