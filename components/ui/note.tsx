import React from 'react';
import { type ImageStyle, View, Image } from 'react-native';
import { Text } from './text';
import { cn } from '@/lib/utils';

import INFOCIRCLE from '@/assets/images/icons/info_circle.png';

interface NoteProps {
  /**
   * The main message to display in the note
   */
  message: string;
  /**
   * Custom className for the message
   */
  messageClassName?: string;
  /**
   * Optional secondary message to display below the main message
   */
  secondaryMessage?: string;
  /**
   * Optional third message to display below the secondary message
   */
  thirdMessage?: string;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Custom style for the container
   */
  style?: any;

  isOneLine?: boolean;
}

const ICON_STYLE: ImageStyle = {
  height: 16,
  width: 16,
};

export function Note({
  message,
  messageClassName,
  secondaryMessage,
  thirdMessage,
  className = "",
  style,
  isOneLine = false
}: NoteProps) {
  return (
    <View
      className={cn(`px-3 py-2.5 border border-border flex-row gap-2 bg-background-secondary rounded-lg`, className)}
      style={style}
    >
      <View className='pt-0.5'>
        <Image source={INFOCIRCLE} style={ICON_STYLE} />
      </View>
      <View className="flex-1">
        {isOneLine ? (
          <Text variant="p" className={`text-text-secondary ${messageClassName}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {message}
          </Text>
        ) : (
          <Text variant="p" className={`text-text-secondary ${messageClassName}`}>
            {message}
          </Text>
        )}
        {secondaryMessage && (
          <Text variant="p" className='text-text-secondary mt-0.5'>
            {secondaryMessage}
          </Text>
        )}
        {thirdMessage && (
          <Text variant="p" className='text-text-secondary mt-4'>
            {thirdMessage}
          </Text>
        )}
      </View>
    </View>
  );
}
