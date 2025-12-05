import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { getClientById, clientHasProjectNeedingDrawing, updateClient } from '@/lib/services/clients-service';

interface ClientContextType {
  client: any | null;
  loading: boolean;
  needsDrawing: boolean;
  loadClient: (clientId: string) => Promise<void>;
  refreshClient: () => Promise<void>;
  updateClientData: (formData: {
    name: string;
    email: string;
    phone_number: string;
    location: string;
    notes: string;
  }) => Promise<boolean>;
  clearClient: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { artist } = useAuth();
  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [needsDrawing, setNeedsDrawing] = useState<boolean>(false);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);

  const loadClient = useCallback(async (clientId: string) => {
    if (!artist?.id || !clientId) {
      setClient(null);
      setNeedsDrawing(false);
      setCurrentClientId(null);
      return;
    }

    setLoading(true);
    setCurrentClientId(clientId);
    
    try {
      const [clientData, needsDrawingData] = await Promise.all([
        getClientById(artist.id, clientId),
        clientHasProjectNeedingDrawing(artist.id, clientId),
      ]);
      
      setClient(clientData);
      setNeedsDrawing(needsDrawingData);
    } catch (error) {
      console.error('Error loading client:', error);
      setClient(null);
      setNeedsDrawing(false);
    } finally {
      setLoading(false);
    }
  }, [artist?.id]);

  const refreshClient = useCallback(async () => {
    if (!currentClientId) return;
    await loadClient(currentClientId);
  }, [currentClientId, loadClient]);

  const updateClientData = useCallback(async (formData: {
    name: string;
    email: string;
    phone_number: string;
    location: string;
    notes: string;
  }): Promise<boolean> => {
    if (!artist?.id || !client?.id) return false;

    // Store previous state for rollback
    const previousClient = client;

    // Optimistic UI update - update state directly
    setClient((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        location: formData.location,
        links: prev.links?.map((link: any, index: number) => 
          index === 0 ? { ...link, notes: formData.notes } : link
        ) || [{ notes: formData.notes }],
      };
    });

    try {
      const success = await updateClient(artist.id, client.id, formData);
      if (!success) {
        // Revert on failure
        setClient(previousClient);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      // Revert on error
      setClient(previousClient);
      return false;
    }
  }, [artist?.id, client]);

  const clearClient = useCallback(() => {
    setClient(null);
    setNeedsDrawing(false);
    setCurrentClientId(null);
  }, []);

  return (
    <ClientContext.Provider
      value={{
        client,
        loading,
        needsDrawing,
        loadClient,
        refreshClient,
        updateClientData,
        clearClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

