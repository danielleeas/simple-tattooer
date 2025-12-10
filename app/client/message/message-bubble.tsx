import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Message } from '@/lib/types';

interface MessageBubbleProps {
    message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.sender === 'user';
    
    return (
        <View className={`flex-row gap-3 items-end ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <Avatar
                    alt={message.senderName}
                    className="bg-white size-10 mt-1">
                    <AvatarFallback className="bg-white">
                        <Text className="text-black font-medium">{message.avatar}</Text>
                    </AvatarFallback>
                </Avatar>
            )}
            
            <View className={`flex-1 gap-1 ${isUser ? 'items-end' : ''}`}>
                <View className={`flex-row items-center gap-2 ${isUser ? 'justify-end' : ''}`}>
                    {!isUser && (
                        <Text className="text-white text-xs">{message.senderName}</Text>
                    )}
                    <Text className="text-white/70 text-xs">{message.timestamp}</Text>
                    {isUser && (
                        <Text className="text-white text-sm font-medium">{message.senderName}</Text>
                    )}
                </View>
                
                <View className={`rounded-lg px-4 py-3 ${
                    isUser 
                        ? 'bg-slate-600' 
                        : 'bg-background-secondary'
                }`}>
                    <Text className="text-white text-sm leading-5">
                        {message.text}
                    </Text>
                </View>
            </View>
            
            {isUser && (
                <Avatar
                    alt={message.senderName}
                    className="bg-white size-10 mt-1">
                    <AvatarFallback className="bg-white">
                        <Text className="text-black font-medium">{message.avatar}</Text>
                    </AvatarFallback>
                </Avatar>
            )}
        </View>
    );
}
