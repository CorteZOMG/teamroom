import { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { createConference, joinConference } from '../api/conferences';
import { useConferences } from '../context/ConferenceContext';
import type { Conference, ConferenceRole } from '../types';

interface ConferenceTabProps {
  courseId: number;
  userRole?: string;
}

interface JitsiConfig {
  jwt: string;
  roomName: string;
  subject: string;
  role: ConferenceRole;
}

export default function ConferenceTab({ courseId, userRole }: ConferenceTabProps) {
  const { conferences, loading, error, refreshConferences } = useConferences();
  const [jitsiConfig, setJitsiConfig] = useState<JitsiConfig | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newConferenceSubject, setNewConferenceSubject] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const isProfessor = userRole === 'OWNER' || userRole === 'PROFESSOR';

  const handleCreateConference = async () => {
    if (!newConferenceSubject.trim()) {
      alert('Назва конференції не може бути порожньою.');
      return;
    }
    try {
      setActionError(null);
      const subject = newConferenceSubject; // Capture the value
      const { jwt, role } = await createConference(courseId, subject);
       
       let waitMs = 1500;
       try {
         const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
         const now = Math.floor(Date.now() / 1000);
         const nbfOrIat = payload.nbf || payload.iat || now;
         const calculatedWait = Math.max(0, (nbfOrIat - now) * 1000 + 500);
         waitMs = Math.max(1500, calculatedWait);
       } catch (e) {
         console.warn('Could not decode JWT, using default delay:', e);
       }
       
       setTimeout(() => {
         setJitsiConfig({ jwt, roomName: subject, subject, role });
       }, waitMs);
       
       setShowCreateModal(false);
       setNewConferenceSubject('');
       refreshConferences();
    } catch (err) {
      setActionError('Не вдалося створити конференцію.');
      console.error(err);
    }
  };

  const handleJoinConference = async (conf: Conference) => {
    try {
       setActionError(null);
       const { jwt, role } = await joinConference(courseId, conf.id);
       
       let waitMs = 1500;
       try {
         const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
         const now = Math.floor(Date.now() / 1000);
         const nbfOrIat = payload.nbf || payload.iat || now;
         const calculatedWait = Math.max(0, (nbfOrIat - now) * 1000 + 500);
         waitMs = Math.max(1500, calculatedWait);
       } catch (e) {
         console.warn('Could not decode JWT, using default delay:', e);
       }
       
       setTimeout(() => {
         setJitsiConfig({ jwt, roomName: conf.subject, subject: conf.subject, role });
       }, waitMs);
    } catch (err) {
      setActionError('Не вдалося приєднатися до конференції.');
      console.error(err);
    }
  };

  const handleMeetingEnd = () => {
    setJitsiConfig(null);
    refreshConferences();
  };

  if (loading) {
    return <div className="text-center p-8">Завантаження конференцій...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (jitsiConfig) {
    const isViewer = jitsiConfig.role === 'VIEWER';
    return (
      <div className="w-full h-[600px] rounded-[10px] overflow-hidden shadow-lg">
        <JitsiMeeting
          domain="team-room-jitsi.duckdns.org"
          roomName={jitsiConfig.roomName}
          jwt={jitsiConfig.jwt}
          configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: isViewer,
            prejoinPageEnabled: true,
            toolbarButtons: isViewer ? ['fullscreen', 'tileview'] : undefined,
            disableSelfView: isViewer,
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
          }}
          onApiReady={(api) => {
            api.on('videoConferenceLeft', handleMeetingEnd);
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full font-montserrat space-y-6">
      {actionError && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{actionError}</div>}
      
      {isProfessor && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-accent hover:bg-secondary text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Створити конференцію
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl text-primary">Активні конференції</h3>
        {conferences.filter(c => c.status === 'ACTIVE').length > 0 ? (
          conferences.filter(c => c.status === 'ACTIVE').map(conf => (
            <div key={conf.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">{conf.subject}</p>
                <p className="text-sm text-gray-500">
                  Створено: {new Date(conf.createdAt).toLocaleString('uk-UA')} | Учасників: {conf.participants?.length ?? 0}
                </p>
              </div>
              <button
                onClick={() => handleJoinConference(conf)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                Приєднатися
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Активних конференцій немає.</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl text-primary">Завершені конференції</h3>
        {conferences.filter(c => c.status === 'ENDED').length > 0 ? (
          conferences.filter(c => c.status === 'ENDED').map(conf => (
            <div key={conf.id} className="bg-gray-100 p-4 rounded-lg shadow-sm">
              <p className="font-bold text-lg text-gray-600">{conf.subject}</p>
              <p className="text-sm text-gray-500">
                Завершено: {conf.endedAt ? new Date(conf.endedAt).toLocaleString('uk-UA') : 'N/A'}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Завершених конференцій немає.</p>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Створити нову конференцію</h2>
            <input
              type="text"
              value={newConferenceSubject}
              onChange={(e) => setNewConferenceSubject(e.target.value)}
              placeholder="Введіть назву конференції"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-300 rounded">
                Скасувати
              </button>
              <button onClick={handleCreateConference} className="px-4 py-2 bg-accent text-white rounded">
                Створити і приєднатися
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}