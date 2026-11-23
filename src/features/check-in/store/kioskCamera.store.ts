import { create } from 'zustand';

type KioskCameraState = {
  isCameraEnabled: boolean;
  setCameraEnabled: (isCameraEnabled: boolean) => void;
};

/** Shared by the kiosk MQTT runtime and the check-in screen. */
export const useKioskCameraStore = create<KioskCameraState>()((set) => ({
  isCameraEnabled: false,
  setCameraEnabled: (isCameraEnabled) => set({ isCameraEnabled }),
}));

export const kioskCameraStore = {
  setCameraEnabled: (isCameraEnabled: boolean) =>
    useKioskCameraStore.getState().setCameraEnabled(isCameraEnabled),
};
