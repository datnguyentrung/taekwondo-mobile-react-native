import { ConfirmationDialog } from "@/shared/ui/ConfirmationDialog";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  View,
} from "react-native";
import { Camera } from "react-native-vision-camera";
import { CheckInHeader } from "../components/CheckInHeader";
import { CheckInResultSheet } from "../components/CheckInResultSheet";
import { CheckInSessionHistorySheet } from "../components/CheckInSessionHistorySheet";
import { CheckInSideControls } from "../components/CheckInSideControls";
import { CheckInViewfinder } from "../components/CheckInViewfinder";
import { useCheckInCamera } from "../hooks/useCheckInCamera";
import { useCheckInCameraLayout } from "../hooks/useCheckInCameraLayout";
import { useFaceCheckIn } from "../hooks/useFaceCheckIn";

const CAMERA_PERMISSION_DESCRIPTION =
  "Camera được dùng để nhận diện khuôn mặt và điểm danh học viên/HLV.";
const CAMERA_PERMISSION_DENIED_DESCRIPTION =
  "Bạn đã từ chối quyền Camera. Vui lòng cho phép để tiếp tục điểm danh.";
const CAMERA_PERMISSION_LOCKED_DESCRIPTION =
  "Thiết bị không cho hỏi lại quyền Camera. Vui lòng bật quyền trong phần Cài đặt của hệ thống.";

export default function CheckInScreen() {
  const layout = useCheckInCameraLayout();
  const [isFocused, setIsFocused] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraMountError, setCameraMountError] = useState<string | null>(null);
  const [cameraReloadKey, setCameraReloadKey] = useState(0);

  const {
    handlePermissionAction,
    refreshPermission,
    isPermissionLoading,
    isPermissionGranted,
    isPermissionDenied,
    isPermissionUndetermined,
    canAskAgain,
    isPermissionActionPending,
    permissionError,
    facing,
    torch,
    isTorchAvailable,
    toggleFacing,
    toggleTorch,
  } = useCheckInCamera();

  const leaveCheckInScreen = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, []);

  const goHome = useCallback(() => {
    router.replace("/");
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      void refreshPermission().then((result) => {
        if (!result?.granted) {
          setIsCameraReady(false);
        }
      });

      return () => {
        setIsFocused(false);
        setIsCameraReady(false);
      };
    }, [refreshPermission]),
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshPermission().then((result) => {
          if (!result?.granted) {
            setIsCameraReady(false);
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isFocused, refreshPermission]);

  const handleCameraReady = useCallback(() => {
    setCameraMountError(null);
    setIsCameraReady(true);
  }, []);

  const handleCameraMountError = useCallback(
    (event: Error | { message?: string }) => {
      setIsCameraReady(false);
      setCameraMountError(
        event.message || "Camera chưa khởi động được. Vui lòng thử lại.",
      );
    },
    [],
  );

  const handleRetryCamera = useCallback(() => {
    setCameraMountError(null);
    setIsCameraReady(false);
    setCameraReloadKey((value) => value + 1);
  }, []);

  const handleAllowPermission = useCallback(async () => {
    setCameraMountError(null);
    setIsCameraReady(false);
    await handlePermissionAction();
  }, [handlePermissionAction]);

  const handleToggleFacing = useCallback(() => {
    setCameraMountError(null);
    setIsCameraReady(false);
    toggleFacing();
  }, [toggleFacing]);

  const isCameraActive =
    isFocused && isPermissionGranted && !cameraMountError;

  const {
    scannerState,
    feedbackMessage,
    currentResult,
    sessionHistory,
    isResultSheetVisible,
    isHistorySheetVisible,
    device,
    photoOutput,
    faceDetectorOutput,
    handleNextScan,
    closeResultSheet,
    openHistorySheet,
    closeHistorySheet,
  } = useFaceCheckIn({
    facing,
    isActive: isCameraActive && isCameraReady,
  });

  const shouldRenderCamera = isCameraActive && device;
  const shouldShowPermissionDialog =
    isFocused && !isPermissionLoading && !isPermissionGranted;
  const permissionDialogDescription =
    permissionError ||
    (!canAskAgain
      ? CAMERA_PERMISSION_LOCKED_DESCRIPTION
      : isPermissionDenied && !isPermissionUndetermined
        ? CAMERA_PERMISSION_DENIED_DESCRIPTION
        : CAMERA_PERMISSION_DESCRIPTION);
  const cameraKey = `check-in-camera-${facing}-${cameraReloadKey}-${isPermissionGranted ? "granted" : "blocked"}`;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* VisionCamera Layer */}
      {shouldRenderCamera ? (
        <Camera
          key={cameraKey}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isCameraActive}
          outputs={[photoOutput, faceDetectorOutput]}
          torchMode={isTorchAvailable && torch ? "on" : "off"}
          onStarted={handleCameraReady}
          onError={handleCameraMountError}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallbackBackground]} />
      )}

      {/* Dark tint overlay for contrast */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.darkOverlay,
          !shouldRenderCamera ? styles.fallbackOverlay : null,
        ]}
        pointerEvents="none"
      />

      {/* UI Overlay Content */}
      <View style={styles.overlayContainer}>
        {/* Transparent Header */}
        <CheckInHeader
          torch={torch}
          onToggleTorch={toggleTorch}
          isTorchAvailable={isTorchAvailable}
          topInset={layout.topInset}
          onBack={leaveCheckInScreen}
        />

        <View
          style={[
            styles.scanArea,
            {
              top: layout.headerHeight,
              bottom: layout.bottomClearance,
            },
          ]}
          pointerEvents="box-none"
        >
          {shouldRenderCamera ? (
            <>
              {!isCameraReady ? (
                <View style={styles.cameraLoadingBadge}>
                  <ActivityIndicator color={Colors.light.surface} />
                  <ThemedText type="bodySmall" style={styles.cameraLoadingText}>
                    Đang mở camera...
                  </ThemedText>
                </View>
              ) : null}
              <CheckInViewfinder
                scanState={scannerState}
                scanAreaHeight={layout.scanAreaHeight}
                feedbackMessage={feedbackMessage}
              />
            </>
          ) : null}
        </View>

        {/* Side Floating Controls */}
        {shouldRenderCamera ? (
          <CheckInSideControls
            onToggleFacing={handleToggleFacing}
            onOpenHistory={openHistorySheet}
            historyCount={sessionHistory.length}
            top={layout.controlsTop}
          />
        ) : null}
      </View>

      {/* Result Bottom Sheet */}
      <CheckInResultSheet
        visible={isResultSheetVisible}
        record={currentResult}
        onNextScan={handleNextScan}
        onClose={closeResultSheet}
      />

      {/* Session History Bottom Sheet */}
      <CheckInSessionHistorySheet
        visible={isHistorySheetVisible}
        history={sessionHistory}
        onClose={closeHistorySheet}
      />

      <ConfirmationDialog
        visible={shouldShowPermissionDialog}
        title="Cho phép sử dụng Camera"
        description={permissionDialogDescription}
        cancelLabel="Để sau"
        confirmLabel={canAskAgain ? "Cho phép" : "Chuyển hướng"}
        pending={isPermissionActionPending}
        actionOrder="confirm-cancel"
        onCancel={goHome}
        onConfirm={() => void handleAllowPermission()}
      />

      <ConfirmationDialog
        visible={Boolean(cameraMountError)}
        title="Không mở được Camera"
        description={
          cameraMountError || "Camera chưa khởi động được. Vui lòng thử lại."
        }
        cancelLabel="Quay lại"
        confirmLabel="Thử lại"
        onCancel={leaveCheckInScreen}
        onConfirm={handleRetryCamera}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fallbackBackground: {
    backgroundColor: "#18191B",
  },
  darkOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  fallbackOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  scanArea: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraLoadingBadge: {
    position: "absolute",
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 2,
  },
  cameraLoadingText: {
    color: Colors.light.surface,
    fontWeight: "600",
  },
});
