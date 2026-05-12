import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DeviceState {
  videoDeviceId: string | undefined;
  audioDeviceId: string | undefined;
  setVideoDeviceId: (id: string | undefined) => void;
  setAudioDeviceId: (id: string | undefined) => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      videoDeviceId: undefined,
      audioDeviceId: undefined,
      setVideoDeviceId: (id) => set({ videoDeviceId: id }),
      setAudioDeviceId: (id) => set({ audioDeviceId: id }),
    }),
    {
      name: 'lumina-device-settings',
    }
  )
);
