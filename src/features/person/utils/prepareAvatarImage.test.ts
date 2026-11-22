import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

import { prepareAvatarImage } from "./prepareAvatarImage";

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: "file:///processed/avatar.jpg",
    width: 640,
    height: 480,
  }),
  SaveFormat: { JPEG: "jpeg" },
}));

describe("prepareAvatarImage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("resizes a large image and emits a compressed JPEG", async () => {
    const result = await prepareAvatarImage({
      uri: "file:///original.jpg",
      width: 4000,
      height: 3000,
      fileName: "original.jpg",
      mimeType: "image/jpeg",
    } as any);

    expect(manipulateAsync).toHaveBeenCalledWith(
      "file:///original.jpg",
      [{ resize: { width: 640, height: 480 } }],
      { compress: 0.82, format: SaveFormat.JPEG },
    );
    expect(result).toMatchObject({ uri: "file:///processed/avatar.jpg", type: "image/jpeg" });
  });
});
