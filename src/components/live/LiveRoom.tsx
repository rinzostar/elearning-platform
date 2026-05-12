'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  Chat,
  useTracks,
  ParticipantTile,
  TrackRefContext,
  DisconnectButton,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { useDeviceStore } from '@/lib/store/useDeviceStore';

interface LiveRoomProps {
  roomId: string;
  username: string;
  isProfessor?: boolean;
}

export default function LiveRoom({ roomId, username, isProfessor = false }: LiveRoomProps) {
  const [token, setToken] = useState('');
  const { videoDeviceId, audioDeviceId } = useDeviceStore();

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/live/token?room=${roomId}&username=${username}&isProfessor=${isProfessor}`);
        const data = await resp.json();
        setToken(data.token);

        // Auto-start recording if user is professor
        if (isProfessor && data.token) {
          fetch('/api/live/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: roomId, action: 'start' })
          }).catch(err => console.error('Failed to start recording:', err));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomId, username, isProfessor]);

  if (token === '') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
      Joining live session...
    </div>;
  }

  return (
    <LiveKitRoom
      video={isProfessor ? (videoDeviceId ? { deviceId: videoDeviceId } : true) : false}
      audio={isProfessor ? (audioDeviceId ? { deviceId: audioDeviceId } : true) : false}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com'}
      onDisconnected={() => {
        console.log('Disconnected');
        // We will reload the page to trigger the "This live session has ended" UI
        window.location.reload();
      }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }} // Tailwind slate-900
    >
      <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
        {/* Main Video Area */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '24px' }}>
            <StreamView />
          </div>
          
          {/* Professor Controls */}
          {isProfessor && (
            <div style={{ 
              padding: '16px 24px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              backgroundColor: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10
            }}>
              <ControlBar controls={{ camera: true, microphone: true, screenShare: true, chat: false, leave: false }} style={{ background: 'transparent', border: 'none', padding: 0 }} />
              <button 
                onClick={async () => {
                  if (confirm('Are you sure you want to end the stream for everyone?')) {
                    try {
                      await fetch('/api/live/end', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ room: roomId })
                      });
                      // Disconnection is handled by onDisconnected
                    } catch (e) {
                      console.error('Failed to end room', e);
                    }
                  }
                }}
                style={{ 
                  padding: '10px 24px', 
                  backgroundColor: '#ef4444', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '9999px', 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3), 0 2px 4px -1px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                Stop Stream
              </button>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div style={{ 
          width: '360px', 
          backgroundColor: '#ffffff', 
          borderLeft: '1px solid #e2e8f0', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
          zIndex: 20
        }}>
          <div style={{ 
            padding: '20px', 
            borderBottom: '1px solid #e2e8f0', 
            fontWeight: 700,
            fontSize: '16px',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)' }} />
            Live Chat
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
             <Chat style={{ height: '100%', border: 'none', borderRadius: 0, ['--lk-bg' as any]: 'transparent' }} />
          </div>
        </div>
      </div>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// Sub-component to render the stream tracks
function StreamView() {
  // Try to find a screen share first, then fall back to camera
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  );

  if (tracks.length === 0) {
    return <div style={{ color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#333', animation: 'pulse 2s infinite' }} />
      Waiting for broadcast to begin...
    </div>;
  }

  // Render the primary track (first in list: screenshare, else camera)
  return (
    <TrackRefContext.Provider value={tracks[0]}>
      <ParticipantTile 
        style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} 
      />
    </TrackRefContext.Provider>
  );
}
