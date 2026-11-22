import type * as ImagePicker from "expo-image-picker";

import type { MobileUploadFile } from "@/infrastructure/http/http.types";

const MAX_AVATAR_DIMENSION = 640;
const AVATAR_QUALITY = 0.82;

type ImageManipulatorModule = {
  manipulateAsync: (
    uri: string,
    actions: { resize: { width?: number; height?: number } }[],
    options: { compress: number; format: string },
  ) => Promise<{ uri: string; width: number; height: number }>;
  SaveFormat: { JPEG?: string };
};

function getImageManipulator(): ImageManipulatorModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require("expo-image-manipulator");
    return typeof module?.manipulateAsync === "function"
      ? (module as ImageManipulatorModule)
      : null;
  } catch {
    return null;
  }
}

/** Produces a small JPEG for face verification; falls back to the original file. */
export async function prepareAvatarImage(
  asset: ImagePicker.ImagePickerAsset,
): Promise<MobileUploadFile> {
  const fallback: MobileUploadFile = {
    uri: asset.uri,
    name: asset.fileName || `avatar_${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  };
  const manipulator = getImageManipulator();
  if (!manipulator) return fallback;

  const width = asset.width ?? MAX_AVATAR_DIMENSION;
  const height = asset.height ?? MAX_AVATAR_DIMENSION;
  const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(width, height));
  const actions = scale < 1
    ? [{ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } }]
    : [];

  try {
    const result = await manipulator.manipulateAsync(asset.uri, actions, {
      compress: AVATAR_QUALITY,
      format: manipulator.SaveFormat.JPEG ?? "jpeg",
    });
    return { uri: result.uri, name: `avatar_${Date.now()}.jpg`, type: "image/jpeg" };
  } catch {
    return fallback;
  }
}
