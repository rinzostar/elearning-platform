'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  GridLayout,
  ParticipantTile,
  TrackReference,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

interface LiveRoomProps {
  roomId: string;
  username: string;
}

export default function LiveRoom({ roomId, username }: LiveRoomProps) {
  const [token, setToken] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/live/token?room=${roomId}&username=${username}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomId, username]);

  if (token === '') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
      Joining live session...
    </div>;
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com'}
      // Use the correct lambda for onDisconnected
      onDisconnected={() => console.log('Disconnected')}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#111' }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
