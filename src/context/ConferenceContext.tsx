import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { webSocketService } from '../services/websocket';
import type { Conference } from '../types';
import { getConferences } from '../api/conferences';

interface ConferenceContextValue {
  conferences: Conference[];
  loading: boolean;
  error: string | null;
  refreshConferences: () => void;
}

const ConferenceContext = createContext<ConferenceContextValue | undefined>(undefined);

export const useConferences = () => {
  const context = useContext(ConferenceContext);
  if (!context) {
    throw new Error('useConferences must be used within a ConferenceProvider');
  }
  return context;
};

interface ConferenceProviderProps {
  children: ReactNode;
  courseId: number;
}

export const ConferenceProvider = ({ children, courseId }: ConferenceProviderProps) => {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConferences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getConferences(courseId);
      setConferences(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError('Не вдалося завантажити конференції.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    refreshConferences();

    const handleNotification = (notification: any) => {
      if (notification.course_id !== courseId) return;

      const type = notification.broadcastMetadata?.messageType || notification.type;

      if (
        type === 'CONFERENCE_STARTED' ||
        type === 'CONFERENCE_ENDED' ||
        type === 'CONFERENCE_PARTICIPANT_LIST_UPDATE'
      ) {
        refreshConferences();
      }
    };

    if (webSocketService.isConnected()) {
      webSocketService.subscribeToUserNotifications(handleNotification);
    } else {
      webSocketService.connect(
        () => webSocketService.subscribeToUserNotifications(handleNotification),
        (err) => console.error('WebSocket connection error:', err)
      );
    }

    // This is a simplified cleanup. In a real app, you'd want to manage subscriptions more carefully.
    return () => {
      // Consider if unsubscribing is needed when component unmounts
    };
  }, [courseId, refreshConferences]);

  const value = {
    conferences,
    loading,
    error,
    refreshConferences,
  };

  return (
    <ConferenceContext.Provider value={value}>
      {children}
    </ConferenceContext.Provider>
  );
};