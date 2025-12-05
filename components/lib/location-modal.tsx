import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, FlatList, Modal, ActivityIndicator, Keyboard } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { XIcon, MapPinIcon, SearchIcon } from 'lucide-react-native';
import { THEME } from '@/lib/theme';
import { GOOGLE_PLACES_API_KEY } from '@/lib/constants';

export interface LocationData {
  id?: string; // Optional for new locations
  address: string;
  placeId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isMainStudio: boolean;
}

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: Omit<LocationData, 'id'>) => void;
  selectedLocation?: LocationData | null;
}

interface SearchResult {
  id: string;
  displayName: {
    text: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  formattedAddress: string;
}

export function LocationModal({
  visible,
  onClose,
  onLocationSelect,
  selectedLocation
}: LocationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
    } else if (selectedLocation) {
      // Pre-fill search query when editing
      setSearchQuery(selectedLocation.address);
    }
  }, [visible, selectedLocation]);

  // Debounced search function
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchLocations(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchLocations = async (query: string) => {
    setIsSearching(true);
    try {
      // Using Google Places API
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText?textQuery=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress',
          },
          body: '', // Empty body as shown in your working Postman request
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setSearchResults(data.places || []);
    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (result: SearchResult) => {
    Keyboard.dismiss();
    const newLocation: Omit<LocationData, 'id'> = {
      address: result.formattedAddress || result.displayName.text,
      placeId: result.id,
      coordinates: {
        latitude: result.location.latitude,
        longitude: result.location.longitude,
      },
      isMainStudio: false, // Will be set by parent component
    };

    onLocationSelect(newLocation);
    onClose();
  };



  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      onPress={() => handleLocationSelect(item)}
      className="p-4 border-b border-border active:bg-muted/50"
    >
      <View className="flex-row items-start gap-3">
        <MapPinIcon size={18} color={THEME.dark.textSecondary} />
        <Text className="flex-1 text-sm leading-5">
          {item.formattedAddress || item.displayName.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center p-4"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          className="bg-background-secondary rounded-xl border border-border w-full max-w-md max-h-[80%] shadow-2xl"
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text variant="h5">{selectedLocation ? 'Edit Location' : 'Select Location'}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 -mr-2"
            >
              <Icon as={XIcon} size={20} color={THEME.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="p-4">
            {/* Search section */}
            <View>
              <Text className="text-text-secondary text-sm mb-4">
                Search for a location or enter address manually
              </Text>

              {/* Search Input */}
              <View className="relative mb-4">
                <View className="flex-row items-center border border-border-white rounded-sm px-4 shadow-sm">
                  <SearchIcon size={16} color={THEME.dark.textSecondary} />
                  <TextInput
                    className="flex-1 ml-3 h-12 text-foreground text-base"
                    placeholder="Type address or studio name"
                    placeholderTextColor={THEME.dark.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={!selectedLocation}
                  />
                  {isSearching && (
                    <ActivityIndicator size="small" color={THEME.dark.textSecondary} />
                  )}
                </View>

                {/* Search Results */}
                {searchQuery.length >= 3 && !isSearching && (
                  <View className="mt-2 border border-border-white rounded-sm overflow-hidden">
                    {searchResults.length > 0 ? (
                      <FlatList
                        data={searchResults}
                        renderItem={renderSearchResult}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        
                      />
                    ) : (
                      <View className="p-4 items-center justify-center">
                        <Text className="text-text-secondary text-sm">No results found</Text>
                      </View>
                    )}
                  </View>
                )}

              </View>

            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
