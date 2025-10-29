import { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { getUsernameFromToken } from '../services/auth';

interface ConferenceTabProps {
  courseId: number;
  userRole?: string;
}

export default function ConferenceTab({ }: ConferenceTabProps) {
  const [showMeeting, setShowMeeting] = useState(false);
  const username = getUsernameFromToken() || 'Guest';

  const roomName = `testlobby`;

  const handleJoin = () => {
    setShowMeeting(true);
    console.log('Joining meeting as', username, 'in room', roomName);
  };

//  const handleMeetingEnd = () => {
//    setShowMeeting(false);
//    console.log('Meeting ended');
//  };

  return (
    <div className="w-full h-full font-montserrat">
      <div className="bg-white rounded-[10px] p-6 shadow-sm mb-6">
        <h2 className="text-primary text-2xl font-semibold mb-2">Відеоконференція курсу</h2>
        <p className="text-gray-600">
          Приєднуйтесь до відеодзвінка з іншими учасниками курсу в реальному часі.
        </p>
      </div>

      {showMeeting ? (
        <div className="w-full h-[600px] rounded-[10px] overflow-hidden shadow-lg">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            userInfo={{
              displayName: username,
              email: `${username}@teamroom.local`
            }}
            configOverwrite={{
              startWithAudioMuted: true,
              disableModeratorIndicator: true,
              startScreenSharing: false,
              enableEmailInStats: false,
              prejoinPageEnabled: false,
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              FILM_STRIP_VIEW_ENABLED: true,
              TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat',
                'settings', 'videoquality', 'tileview', 'mute-everyone'
              ],
            }}
         //   onApiReady={(api) => {
         //     api.on('videoConferenceLeft', handleMeetingEnd);
         //   }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }}
          />
        </div>
      ) : (
        <div className="text-center bg-gray-50 rounded-[10px] p-12">
          <h3 className="text-xl text-gray-700 mb-4">Готові почати?</h3>
          <button
            onClick={handleJoin}
            className="px-8 py-4 bg-accent hover:bg-secondary text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Приєднатися до конференції
          </button>
        </div>
      )}
    </div>
  );
}