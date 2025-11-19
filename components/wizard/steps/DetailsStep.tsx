import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Image, Pressable, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { ChevronDown, PlusIcon } from 'lucide-react-native';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { LocationModal, LocationData } from '@/components/lib/location-modal';
import { checkBookingLinkAvailability } from '@/lib/services/auth-service';
import { BASE_URL } from '@/lib/constants';

import DeleteIcon from '@/assets/images/icons/delete.png';

export function DetailsStep() {
  const { details, updateDetails, bookingLinkError, setBookingLinkError } = useSetupWizard();
  const { artist } = useAuth();
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLocationSelect = (locationData: Omit<LocationData, 'id'>) => {
    if (editingLocation) {
      // Update existing location
      const updatedLocations = details.locations.map((loc) =>
        loc.id === editingLocation.id
          ? { ...locationData, id: editingLocation.id, isMainStudio: editingLocation.isMainStudio }
          : loc
      );
      updateDetails({ locations: updatedLocations });
    } else {
      // Add new location
      const newLocation: LocationData = {
        ...locationData,
        id: Date.now().toString(), // Simple ID generation
        isMainStudio: details.locations.length === 0, // First location is main studio
      };
      const updatedLocations = [...details.locations, newLocation];
      updateDetails({ locations: updatedLocations });
    }

    // Reset editing state
    setEditingLocation(null);
  };

  const handleRemoveLocation = (id: string) => {
    const updatedLocations = details.locations.filter((loc) => loc.id !== id);
    updateDetails({ locations: updatedLocations });
  };

  const handleEditLocation = (location: LocationData) => {
    setEditingLocation(location);
    setIsLocationModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsLocationModalVisible(false);
    setEditingLocation(null);
  };

  const checkUniqueBookingLink = async (bookingLinkSuffix: string) => {
    if (!bookingLinkSuffix.trim()) {
      setBookingLinkError('');
      return;
    }

    setBookingLinkError('');

    try {
      const result = await checkBookingLinkAvailability(bookingLinkSuffix, artist?.id);

      if (!result.isAvailable) {
        setBookingLinkError(result.error || 'Booking link is not available');
      }
    } catch (error) {
      console.error('Error checking booking link:', error);
      setBookingLinkError('Failed to check booking link availability');
    }
  };

  const debouncedCheckBookingLink = useCallback((bookingLinkSuffix: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      checkUniqueBookingLink(bookingLinkSuffix);
    }, 1000); // Wait 1 second after user stops typing
  }, [artist?.id]);

  const copyBookingLink = async (bookingLinkSuffix: string) => {
    await Clipboard.setStringAsync(`${BASE_URL}/${bookingLinkSuffix}`);
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View className="gap-6 pb-4">
        <View className="items-center justify-center">
          <Image
            source={require('@/assets/images/icons/portfolio.png')}
            style={{ width: 56, height: 56 }}
            resizeMode="contain"
          />
          <Text variant="h6" className="text-center uppercase">Your</Text>
          <Text variant="h6" className="text-center uppercase mb-2">Details</Text>
          <View className='flex-row items-end justify-center gap-1'>
            <Text className="text-center text-text-secondary leading-none">Tell us about yourself</Text>
            <Text className="text-center text-text-secondary text-xs leading-none">&</Text>
          </View>
          <Text className="text-center text-text-secondary">where to find you.</Text>
        </View>
        <View className="gap-6">
          <View className="gap-2">
            <Text variant="h5">Your Name</Text>
            <Input
              value={details.name}
              onChangeText={(text) => updateDetails({ name: text })}
            />
          </View>
          <View className="gap-2">
            <Text variant="h5">Studio Name</Text>
            <Input
              value={details.studioName}
              onChangeText={(text) => updateDetails({ studioName: text })}
            />
          </View>
          <View className="gap-1">
            <View className='flex-row gap-2 items-center'>
              <Text variant="h5">Edit/Copy Personal Booking Link</Text>
              <View className="relative">
                <TouchableOpacity
                  onPress={() => copyBookingLink(details.bookingLinkSuffix)}
                  className="p-1 rounded"
                >
                  <Image
                    source={require('@/assets/images/icons/copy.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View>
              <Text>Tap to edit, use icon to copy</Text>
              <Text>(Access anytime in Settings-Your App)</Text>
            </View>
            <View className={`border rounded-sm px-2 h-10 flex-row items-center overflow-hidden ${bookingLinkError ? 'border-destructive' : 'border-border-white'
              }`}>
              <Text className='text-text-secondary text-base'>{BASE_URL}/</Text>

              <Input
                className="border-0 pl-0"
                value={details.bookingLinkSuffix}
                onChangeText={(text) => {
                  updateDetails({ bookingLinkSuffix: text });
                  setBookingLinkError(''); // Clear error when typing
                  debouncedCheckBookingLink(text); // Check after user stops typing
                }}
                onEndEditing={() => checkUniqueBookingLink(details.bookingLinkSuffix)}
                placeholder="your-custom-link"
                placeholderTextColor="#666"
              />
            </View>
            {bookingLinkError && (
              <Text className="text-destructive text-sm">{bookingLinkError}</Text>
            )}
          </View>
          <View className="gap-2">
            <Text variant="h5">Location (Type address or studio name)</Text>
            <View className='items-center w-full'>
              <Text className='text-center text-text-secondary w-full leading-none'>Add your main studio address. You can set up guest spots and travel dates in your calendar</Text>
            </View>

            {/* Location Display */}
            {details.locations.length > 0 ? (
              <View className="w-full gap-2">
                {details.locations.map((location, index) => (
                  <View key={location.id} className="flex-row items-center justify-between gap-2">
                    <Pressable
                      className="flex-1 flex-row items-center justify-between px-4 h-10 border border-border-white rounded-md"
                      onPress={() => handleEditLocation(location)}
                    >
                      <View className='flex-1'>
                        <Text className="text-white text-sm font-normal" numberOfLines={1} ellipsizeMode="tail">
                          {location.address}
                        </Text>
                      </View>
                      <View className='min-w-6 items-end justify-center'>
                        <ChevronDown size={20} color="white" />
                      </View>
                    </Pressable>
                    <View className="flex-row gap-1">
                      <Pressable onPress={() => location.id && handleRemoveLocation(location.id)} className="p-2 bg-background-secondary border border-border rounded-full">
                        <Image
                          source={DeleteIcon}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Pressable className="p-3 bg-background border border-border-white rounded-sm h-10" onPress={() => setIsLocationModalVisible(true)} />
            )}
          </View>
          <View className="gap-2">
            <Text variant="h5">Social Media Handle</Text>
            <Input
              value={details.socialHandler}
              onChangeText={(text) => updateDetails({ socialHandler: text })}
            />
            <Text className='text-text-secondary'>Show clients where to find you</Text>
          </View>
        </View>
      </View>

      {/* Location Modal */}
      <LocationModal
        visible={isLocationModalVisible}
        onClose={handleCloseModal}
        onLocationSelect={handleLocationSelect}
        selectedLocation={editingLocation}
      />
    </KeyboardAwareScrollView>
  )
}
