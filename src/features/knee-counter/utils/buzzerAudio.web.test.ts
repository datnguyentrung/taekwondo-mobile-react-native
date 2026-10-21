import { playRefereeBuzzer } from "./buzzerAudio.web";

describe("playRefereeBuzzer", () => {
  it("runs without crashing when AudioContext is mocked or unavailable", () => {
    expect(() => playRefereeBuzzer(100)).not.toThrow();
  });
});
