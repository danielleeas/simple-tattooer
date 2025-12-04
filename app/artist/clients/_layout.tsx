import { Stack } from 'expo-router';
import { ClientProvider } from '@/lib/contexts';

export default function ClientsLayout() {
    return (
        <ClientProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            />
        </ClientProvider>
    );
}
