import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

import type { CountdownCue } from "../utils/buzzerAudio.web";

const COUNTDOWN_GOLD = "#FFC533";
const RING_CIRCUMFERENCE = 2 * Math.PI * 88;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

function countdownCopy(cue: CountdownCue) {
  return cue === "GO!" ? "BẮT ĐẦU!" : `Bắt đầu sau ${cue} giây`;
}

function ringProgress(cue: CountdownCue) {
  if (cue === "3") return 0.76;
  if (cue === "2") return 0.51;
  if (cue === "1") return 0.26;
  return 1;
}

const SANS_FONT = "Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

export function CameraSessionOverlay({
  countdownCue,
  finished,
}: {
  countdownCue: CountdownCue | null;
  finished: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const cueRef = useRef<HTMLDivElement | null>(null);
  const finishRef = useRef<HTMLDivElement | null>(null);
  const progress = countdownCue ? ringProgress(countdownCue) : 0;

  useEffect(() => {
    const node = cueRef.current;
    if (!node || !countdownCue) return;
    node.getAnimations?.().forEach((animation) => animation.cancel());
    node.animate?.(
      reducedMotion
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "both" },
    );
  }, [countdownCue, reducedMotion]);

  useEffect(() => {
    const node = finishRef.current;
    if (!node || !finished) return;
    node.getAnimations?.().forEach((animation) => animation.cancel());
    node.animate?.(
      reducedMotion
        ? [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.88 }, { opacity: 0 }]
        : [
            { opacity: 0, transform: "translateX(-110%)", offset: 0 },
            { opacity: 1, transform: "translateX(0%)", offset: 0.2 },
            { opacity: 1, transform: "translateX(0%)", offset: 0.88 },
            { opacity: 0, transform: "translateX(110%)", offset: 1 },
          ],
      { duration: 2200, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "both" },
    );
  }, [finished, reducedMotion]);

  return (
    <>
      {countdownCue ? (
        <View accessibilityRole="alert" style={styles.countdownBackdrop as never}>
          <div ref={cueRef} aria-live="assertive" style={styles.countdownCard as never}>
            <div style={styles.ringContainer as never}>
              <svg aria-hidden="true" viewBox="0 0 208 208" style={styles.countdownRing as never}>
                <circle cx="104" cy="104" r="88" fill="none" stroke="rgba(255,197,51,0.18)" strokeWidth="9" />
                <circle
                  cx="104"
                  cy="104"
                  r="88"
                  fill="none"
                  stroke={COUNTDOWN_GOLD}
                  strokeLinecap="round"
                  strokeWidth="11"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
                  transform="rotate(-90 104 104)"
                />
              </svg>
              <div style={styles.ringCenter as never}>
                <ThemedText
                  type="subtitle"
                  style={[
                    styles.countdownText as never,
                    countdownCue === "GO!" && (styles.goText as never),
                  ]}
                >
                  {countdownCue}
                </ThemedText>
              </div>
            </div>
            <ThemedText type="heading" style={styles.countdownCopy as never}>
              {countdownCopy(countdownCue)}
            </ThemedText>
          </div>
        </View>
      ) : null}
      {finished ? (
        <View pointerEvents="none" style={styles.finishTrack as never}>
          <div ref={finishRef} role="status" aria-live="assertive" style={styles.animatedFinish as never}>
            <ThemedText type="subtitle" style={styles.finishText as never}>
              KẾT THÚC
            </ThemedText>
          </div>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  countdownBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.62)",
  },
  countdownCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "auto",
    minWidth: 320,
    maxWidth: 440,
    paddingVertical: 32,
    paddingHorizontal: 36,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: "rgba(255, 197, 51, 0.75)",
    backgroundColor: "rgba(8, 14, 22, 0.9)",
    boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45), 0 0 32px rgba(255, 197, 51, 0.24)",
  },
  ringContainer: {
    position: "relative",
    width: 216,
    height: 216,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownRing: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 216,
    height: 216,
    pointerEvents: "none",
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    pointerEvents: "none",
  },
  countdownText: {
    color: COUNTDOWN_GOLD,
    fontSize: 108,
    lineHeight: 112,
    fontWeight: "800",
    fontFamily: SANS_FONT,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    userSelect: "none",
  },
  goText: {
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: 2,
    fontWeight: "900",
  },
  countdownCopy: {
    marginTop: 20,
    color: Colors.light.surface,
    textAlign: "center",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    fontFamily: SANS_FONT,
    letterSpacing: 0.3,
  },
  finishTrack: {
    ...StyleSheet.absoluteFill,
    zIndex: 28,
    alignItems: "stretch",
    justifyContent: "center",
    overflow: "hidden",
  },
  animatedFinish: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 74,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  finishText: {
    color: Colors.light.surface,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 1.5,
    fontWeight: "800",
    fontFamily: SANS_FONT,
  },
});
