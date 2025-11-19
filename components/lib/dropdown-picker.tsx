import { cn } from '@/lib/utils';
import { Platform, Pressable, ScrollView, View, Modal } from 'react-native';
import { useState } from 'react';
import { ChevronDownIcon, CheckIcon, X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface DropdownPickerProps {
  options: DropdownOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  errorText?: string;
  className?: string;
  modalTitle?: string;
}

function DropdownPicker({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  helperText,
  errorText,
  className,
  modalTitle = "Select Option",
}: DropdownPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue);
    setIsOpen(false);
  };

  const handlePress = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Use modal dialog for all platforms
  return (
    <View className="w-full">
      <Pressable
        onPress={handlePress}
        className={cn(
          'border-border-white bg-background text-foreground rounded-sm flex h-10 w-full min-w-0 flex-row items-center justify-between border px-3 py-1 text-base leading-5 shadow-sm shadow-black/5',
          error && 'border-destructive',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled}
      >
        <Text className={cn(
          'flex-1',
          !selectedOption && 'text-text-secondary'
        )}>
          {displayText}
        </Text>
        <Icon as={ChevronDownIcon} size={16} className="text-muted-foreground" />
      </Pressable>

      <Modal
        visible={isOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: THEME.dark.backgroundSecondary,
            borderRadius: 12,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: THEME.dark.border,
            }}>
              <Text variant="h4" style={{ color: THEME.dark.foreground }}>
                {modalTitle}
              </Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <Icon as={X} size={20} color={THEME.dark.textSecondary} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView 
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ padding: 16 }}>
                <View style={{ gap: 4 }}>
                  {options.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => !option.disabled && handleSelect(option.value)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 8,
                        opacity: option.disabled ? 0.5 : 1,
                        backgroundColor: value === option.value 
                          ? THEME.dark.accent 
                          : 'transparent',
                      }}
                      disabled={option.disabled}
                    >
                      <Text style={{
                        flex: 1,
                        fontSize: 16,
                        color: option.disabled 
                          ? THEME.dark.textSecondary 
                          : value === option.value
                            ? THEME.dark.foreground
                            : THEME.dark.textSecondary,
                        fontWeight: value === option.value ? '600' : '400',
                      }}>
                        {option.label}
                      </Text>
                      {value === option.value && (
                        <Icon as={CheckIcon} size={20} color={THEME.dark.foreground} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {(() => {
        const textToShow = error ? errorText : helperText;
        return textToShow && textToShow.trim() ? (
          <Text
            className={cn(
              "mt-1 text-base",
              error ? "text-destructive" : "text-text-secondary"
            )}
          >
            {textToShow}
          </Text>
        ) : null;
      })()}
    </View>
  );
}

export { DropdownPicker };
