import React, { useEffect, useState, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Modal,
  ScrollView,
  Platform,
  TextInput,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Maximize,
  Minimize,
  Settings,
  HelpCircle,
  Sliders,
  Tv,
  Check,
  Plus,
  Minus,
  MessageSquare,
  LogOut,
} from 'lucide-react-native';
import { ThemedText } from '@/shared/ui/ThemedText';
import { formatSparringTime, isSparringRoomCode } from '../domain/sparringRoom';
import { useSparringRoom } from '../hooks/useSparringRoom';
import type { SparringCommand, SparringSide } from '../domain/sparring.types';

const MAX_COMPETITOR_NAME_LENGTH = 30;

function normalizeStep(value: string, maximum: number): string {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return '1';
  return String(Math.min(maximum, Math.max(1, parsed)));
}

function stepAmount(value: string, maximum: number): number {
  return Number(normalizeStep(value, maximum));
}

type StepValueInputProps = {
  accessibilityLabel: string;
  maximum: number;
  value: string;
  onChange: (value: string) => void;
};

function StepValueInput({
  accessibilityLabel,
  maximum,
  value,
  onChange,
}: StepValueInputProps) {
  const commit = () => onChange(normalizeStep(value, maximum));
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={(nextValue) =>
        onChange(nextValue.replace(/\D/g, '').slice(0, String(maximum).length))
      }
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={String(maximum).length}
      selectTextOnFocus
      style={[styles.valueBox, styles.valueInput]}
    />
  );
}

type EditableTeamNameProps = {
  editable: boolean;
  name: string;
  side: SparringSide;
  style: StyleProp<TextStyle>;
  onCommit: (side: SparringSide, name: string) => void;
};

function EditableTeamName({
  editable,
  name,
  side,
  style,
  onCommit,
}: EditableTeamNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const committingRef = React.useRef(false);

  const finishEditing = () => {
    if (committingRef.current) return;
    committingRef.current = true;
    const normalized = draft.trim();
    if (normalized && normalized !== name) onCommit(side, normalized);
    setEditing(false);
  };

  if (editing && editable) {
    return (
      <TextInput
        accessibilityLabel={`Tên võ sĩ ${side === 'red' ? 'đỏ' : 'xanh'}`}
        autoFocus
        maxLength={MAX_COMPETITOR_NAME_LENGTH}
        onBlur={finishEditing}
        onChangeText={setDraft}
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === 'Escape') {
            committingRef.current = true;
            setDraft(name);
            setEditing(false);
          }
        }}
        onSubmitEditing={finishEditing}
        selectTextOnFocus
        style={[styles.teamNameInput, style]}
        value={draft}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole={editable ? 'button' : undefined}
      accessibilityLabel={editable ? `Sửa tên ${name}` : name}
      disabled={!editable}
      onPress={() => {
        committingRef.current = false;
        setDraft(name);
        setEditing(true);
      }}>
      <ThemedText style={style} numberOfLines={1}>{name}</ThemedText>
    </Pressable>
  );
}

export function SparringRoomScreen() {
  const { roomCode: raw } = useLocalSearchParams<{ roomCode: string }>();
  const roomCode = Array.isArray(raw) ? raw[0] : raw;
  const { snapshot, operator, error, connecting, send } = useSparringRoom(
    roomCode ?? ''
  );

  // View state: 'operator' (ảnh 1) hoặc 'display' (ảnh 2)
  const [viewMode, setViewMode] = useState<'operator' | 'display'>('operator');
  // Modal Settings
  const [showSettings, setShowSettings] = useState(false);
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Settings form states
  const [maxJudges, setMaxJudges] = useState(3);
  const [judgesToScore, setJudgesToScore] = useState(2);
  const [secondScoringWindow, setSecondScoringWindow] = useState(2.0);
  const [roundsPerMatch, setRoundsPerMatch] = useState(3);
  const [roundTimeSeconds, setRoundTimeSeconds] = useState(120);
  const [breakTimeSeconds, setBreakTimeSeconds] = useState(30);

  const [resetScoreBetweenRounds, setResetScoreBetweenRounds] = useState(true);
  const [resetPenaltiesBetweenRounds, setResetPenaltiesBetweenRounds] =
    useState(true);
  const [trackRoundWinners, setTrackRoundWinners] = useState(true);

  const [enableDisqualify, setEnableDisqualify] = useState(true);
  const [penaltiesToDisqualify, setPenaltiesToDisqualify] = useState(10);
  const [enablePointDiff, setEnablePointDiff] = useState(true);
  const [pointDiff, setPointDiff] = useState(20);
  const [enablePointWin, setEnablePointWin] = useState(true);
  const [pointsToWin, setPointsToWin] = useState(99);

  // Step amounts for middle controller
  const [timeStep, setTimeStep] = useState('1');
  const [redScoreStep, setRedScoreStep] = useState('1');
  const [blueScoreStep, setBlueScoreStep] = useState('1');
  const [redPenaltyStep, setRedPenaltyStep] = useState('1');
  const [bluePenaltyStep, setBluePenaltyStep] = useState('1');

  // Hiệp thắng (Round rounds won / summary)
  const [redRoundsWon] = useState(0);
  const [blueRoundsWon] = useState(0);

  const action = useCallback(
    (command: SparringCommand) => {
      send(command);
    },
    [send]
  );

  const toggleTimer = useCallback(() => {
    action(snapshot.running ? { type: 'pause' } : { type: 'start' });
  }, [action, snapshot.running]);

  const adjustScore = useCallback(
    (side: SparringSide, delta: number) => {
      action({ type: 'operatorAdjustScore', side, delta });
    },
    [action]
  );

  const adjustPenalty = useCallback(
    (side: SparringSide, delta: number) => {
      action({ type: 'operatorAdjustPenalty', side, delta });
    },
    [action]
  );

  const adjustTime = useCallback(
    (deltaSeconds: number) => {
      const nextSeconds = Math.max(0, snapshot.remainingSeconds + deltaSeconds);
      action({ type: 'setDuration', seconds: nextSeconds });
    },
    [action, snapshot.remainingSeconds]
  );

  // Bắt phím Space trên web để Start/Pause
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tránh bắt phím khi đang gõ vào input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer]);

  // Xử lý nút Fullscreen F11
  const toggleFullscreen = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isSparringRoomCode(roomCode ?? '')) return null;

  return (
    <View style={styles.page}>
      {/* HEADER TOP BAR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.brandTitle}>
            total<ThemedText style={styles.brandAccent}>TKD</ThemedText>
            <ThemedText style={styles.brandPlus}>+</ThemedText>
          </ThemedText>
          <Pressable style={styles.headerIconButton}>
            <MessageSquare size={20} color="#ccc" />
          </Pressable>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.headerIconButton}>
            <LogOut size={20} color="#ccc" />
          </Pressable>
          <View style={styles.roomCodeBadge}>
            <ThemedText style={styles.roomCodeText}>{roomCode}</ThemedText>
          </View>
        </View>
      </View>

      {/* MATCH SUMMARY BADGE (Góc trên bên phải) */}
      <View style={styles.matchScoreBadge}>
        <ThemedText style={styles.matchScoreRed}>{redRoundsWon}</ThemedText>
        <ThemedText style={styles.matchScoreDash}> - </ThemedText>
        <ThemedText style={styles.matchScoreBlue}>{blueRoundsWon}</ThemedText>
      </View>

      {/* ROUND TITLE */}
      <View style={styles.roundHeader}>
        <ThemedText style={styles.roundText}>ROUND {snapshot.round}</ThemedText>
      </View>

      {/* TIMER BOX: Click or Space to Start/Pause */}
      <Pressable
        onPress={toggleTimer}
        accessibilityRole="button"
        accessibilityLabel="Bấm giờ thi đấu"
        style={[
          styles.clockBox,
          snapshot.running ? styles.clockRunning : styles.clockPaused,
        ]}>
        <ThemedText
          style={[
            styles.clockText,
            snapshot.running ? styles.clockTextRunning : styles.clockTextPaused,
          ]}>
          {connecting
            ? '--:--'
            : formatSparringTime(snapshot.remainingSeconds)}
        </ThemedText>
      </Pressable>

      {/* MAIN SCOREBOARD & CONTROLS */}
      <View
        style={[
          styles.arenaContainer,
          viewMode === 'display' && styles.arenaContainerDisplay,
        ]}>
        {/* RED SIDE */}
        <View
          style={[
            styles.teamColumn,
            viewMode === 'operator' && styles.teamColumnOperator,
            viewMode === 'display' && styles.teamColumnDisplay,
          ]}>
          <EditableTeamName
            editable={operator && viewMode === 'operator'}
            name={snapshot.redName}
            side="red"
            style={[styles.teamLabel, styles.redLabel]}
            onCommit={(side, name) => action({ type: 'setCompetitorName', side, name })}
          />
          <View
            style={[
              styles.scoreCard,
              styles.redScoreCard,
              viewMode === 'operator' && styles.scoreCardOperator,
              viewMode === 'display' && styles.scoreCardDisplay,
            ]}>
            <ThemedText
              style={[
                styles.scoreNumber,
                viewMode === 'display' && styles.scoreNumberDisplay,
              ]}>
              {snapshot.redScore}
            </ThemedText>
          </View>
          {/* Thanh chỉ số phụ / hiệp thắng */}
          <View style={styles.subBarContainer}>
            <View style={styles.subBar} />
            <ThemedText style={styles.subBarText}>
              {snapshot.redPenalties}
            </ThemedText>
          </View>
        </View>

        {/* MIDDLE CONTROLS (Chỉ hiển thị khi viewMode === 'operator') */}
        {viewMode === 'operator' && (
          <View style={styles.middleController}>
            {/* TIME ADJUST */}
            <View style={styles.controlSection}>
              <ThemedText style={styles.controlHeader}>TIME (SEC)</ThemedText>
              <View style={styles.controlRow}>
                <Pressable
                  accessibilityLabel="Giảm thời gian"
                  onPress={() => adjustTime(-stepAmount(timeStep, 60))}
                  style={styles.circleBtn}>
                  <Minus size={18} color="#444" strokeWidth={3} />
                </Pressable>
                <StepValueInput
                  accessibilityLabel="Bước điều chỉnh thời gian"
                  maximum={60}
                  value={timeStep}
                  onChange={setTimeStep}
                />
                <Pressable
                  accessibilityLabel="Tăng thời gian"
                  onPress={() => adjustTime(stepAmount(timeStep, 60))}
                  style={styles.circleBtn}>
                  <Plus size={18} color="#444" strokeWidth={3} />
                </Pressable>
              </View>
            </View>

            {/* POINTS ADJUST ROW */}
            <View style={styles.dualControlSection}>
              <View style={styles.halfControl}>
                <ThemedText style={styles.controlHeader}>POINTS</ThemedText>
                <View style={styles.controlRow}>
                  <Pressable
                    accessibilityLabel="Giảm điểm đỏ"
                    onPress={() => adjustScore('red', -stepAmount(redScoreStep, 99))}
                    style={styles.circleBtn}>
                    <Minus size={18} color="#444" strokeWidth={3} />
                  </Pressable>
                  <StepValueInput
                    accessibilityLabel="Bước điều chỉnh điểm đỏ"
                    maximum={99}
                    value={redScoreStep}
                    onChange={setRedScoreStep}
                  />
                  <Pressable
                    accessibilityLabel="Tăng điểm đỏ"
                    onPress={() => adjustScore('red', stepAmount(redScoreStep, 99))}
                    style={styles.circleBtn}>
                    <Plus size={18} color="#444" strokeWidth={3} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.halfControl}>
                <ThemedText style={styles.controlHeader}>POINTS</ThemedText>
                <View style={styles.controlRow}>
                  <Pressable
                    accessibilityLabel="Giảm điểm xanh"
                    onPress={() => adjustScore('blue', -stepAmount(blueScoreStep, 99))}
                    style={styles.circleBtn}>
                    <Minus size={18} color="#444" strokeWidth={3} />
                  </Pressable>
                  <StepValueInput
                    accessibilityLabel="Bước điều chỉnh điểm xanh"
                    maximum={99}
                    value={blueScoreStep}
                    onChange={setBlueScoreStep}
                  />
                  <Pressable
                    accessibilityLabel="Tăng điểm xanh"
                    onPress={() => adjustScore('blue', stepAmount(blueScoreStep, 99))}
                    style={styles.circleBtn}>
                    <Plus size={18} color="#444" strokeWidth={3} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* PENALTY ADJUST ROW */}
            <View style={styles.dualControlSection}>
              <View style={styles.halfControl}>
                <ThemedText style={styles.controlHeader}>PENALTY</ThemedText>
                <View style={styles.controlRow}>
                  <Pressable
                    accessibilityLabel="Giảm điểm phạt đỏ"
                    onPress={() => adjustPenalty('red', -stepAmount(redPenaltyStep, 20))}
                    style={styles.circleBtn}>
                    <Minus size={18} color="#444" strokeWidth={3} />
                  </Pressable>
                  <StepValueInput
                    accessibilityLabel="Bước điều chỉnh điểm phạt đỏ"
                    maximum={20}
                    value={redPenaltyStep}
                    onChange={setRedPenaltyStep}
                  />
                  <Pressable
                    accessibilityLabel="Tăng điểm phạt đỏ"
                    onPress={() => adjustPenalty('red', stepAmount(redPenaltyStep, 20))}
                    style={styles.circleBtn}>
                    <Plus size={18} color="#444" strokeWidth={3} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.halfControl}>
                <ThemedText style={styles.controlHeader}>PENALTY</ThemedText>
                <View style={styles.controlRow}>
                  <Pressable
                    accessibilityLabel="Giảm điểm phạt xanh"
                    onPress={() => adjustPenalty('blue', -stepAmount(bluePenaltyStep, 20))}
                    style={styles.circleBtn}>
                    <Minus size={18} color="#444" strokeWidth={3} />
                  </Pressable>
                  <StepValueInput
                    accessibilityLabel="Bước điều chỉnh điểm phạt xanh"
                    maximum={20}
                    value={bluePenaltyStep}
                    onChange={setBluePenaltyStep}
                  />
                  <Pressable
                    accessibilityLabel="Tăng điểm phạt xanh"
                    onPress={() => adjustPenalty('blue', stepAmount(bluePenaltyStep, 20))}
                    style={styles.circleBtn}>
                    <Plus size={18} color="#444" strokeWidth={3} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* BLUE SIDE */}
        <View
          style={[
            styles.teamColumn,
            viewMode === 'operator' && styles.teamColumnOperator,
            viewMode === 'display' && styles.teamColumnDisplay,
          ]}>
          <EditableTeamName
            editable={operator && viewMode === 'operator'}
            name={snapshot.blueName}
            side="blue"
            style={[styles.teamLabel, styles.blueLabel]}
            onCommit={(side, name) => action({ type: 'setCompetitorName', side, name })}
          />
          <View
            style={[
              styles.scoreCard,
              styles.blueScoreCard,
              viewMode === 'operator' && styles.scoreCardOperator,
              viewMode === 'display' && styles.scoreCardDisplay,
            ]}>
            <ThemedText
              style={[
                styles.scoreNumber,
                viewMode === 'display' && styles.scoreNumberDisplay,
              ]}>
              {snapshot.blueScore}
            </ThemedText>
          </View>
          <View style={styles.subBarContainer}>
            <View style={styles.subBar} />
            <ThemedText style={styles.subBarText}>
              {snapshot.bluePenalties}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* FOOTER BOTTOM BAR */}
      <View style={[styles.footer, viewMode === 'display' && styles.footerDisplay]}>
        {/* Left footer buttons: ?, Settings, Fullscreen (F11) - Chỉ hiển thị ở operator mode */}
        {viewMode === 'operator' ? (
          <View style={styles.footerLeft}>
            <Pressable style={styles.footerIconBtn}>
              <HelpCircle size={24} color="#000" strokeWidth={2.4} />
            </Pressable>
            <Pressable
              onPress={() => setShowSettings(true)}
              style={styles.footerIconBtn}>
              <Settings size={24} color="#000" strokeWidth={2.4} />
            </Pressable>
            <Pressable onPress={toggleFullscreen} style={styles.footerIconBtn}>
              {isFullscreen ? (
                <Minimize size={24} color="#000" strokeWidth={2.4} />
              ) : (
                <Maximize size={24} color="#000" strokeWidth={2.4} />
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )}

        {/* Center toggle switch: 2 trạng thái hiển thị */}
        <View style={styles.footerCenter}>
          <Pressable
            onPress={() =>
              setViewMode((prev) =>
                prev === 'operator' ? 'display' : 'operator'
              )
            }
            style={styles.viewToggleBtn}>
            <View style={styles.toggleIconWrap}>
              {viewMode === 'operator' ? (
                <Sliders size={20} color="#10B981" />
              ) : (
                <Tv size={20} color="#666" />
              )}
            </View>
            <View
              style={[
                styles.toggleTrack,
                viewMode === 'operator' && styles.toggleTrackActive,
              ]}>
              <View
                style={[
                  styles.toggleThumb,
                  viewMode === 'operator' && styles.toggleThumbActive,
                ]}
              />
            </View>
          </Pressable>
        </View>

        {/* Right footer buttons: End Match, Debug - Chỉ hiển thị ở operator mode */}
        {viewMode === 'operator' ? (
          <View style={styles.footerRight}>
            <Pressable
              onPress={() => action({ type: 'end' })}
              style={styles.footerActionBtn}>
              <ThemedText style={styles.footerActionText}>End Match</ThemedText>
            </Pressable>
            <Pressable style={styles.footerActionBtn}>
              <ThemedText style={styles.footerActionText}>Debug</ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )}
      </View>

      {error ? (
        <View style={styles.errorToast}>
          <ThemedText style={styles.errorToastText}>{error}</ThemedText>
        </View>
      ) : null}

      {/* MODAL CÀI ĐẶT (VIỆT HÓA HOÀN TOÀN TỪ ẢNH 3) */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.modalTitle}>CÀI ĐẶT</ThemedText>

              {/* SECTION: TRỌNG TÀI */}
              <View style={styles.settingSection}>
                <ThemedText style={styles.sectionHeader}>TRỌNG TÀI</ThemedText>

                <View style={styles.settingRow}>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() => setMaxJudges((v) => Math.max(1, v - 1))}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>{maxJudges}</ThemedText>
                    <Pressable
                      onPress={() => setMaxJudges((v) => v + 1)}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Số lượng giám định tối đa
                  </ThemedText>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() => setJudgesToScore((v) => Math.max(1, v - 1))}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>{judgesToScore}</ThemedText>
                    <Pressable
                      onPress={() => setJudgesToScore((v) => v + 1)}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Số giám định đồng thuận để tính điểm
                  </ThemedText>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() =>
                        setSecondScoringWindow((v) =>
                          Math.max(0.5, +(v - 0.25).toFixed(2))
                        )
                      }
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>
                      {secondScoringWindow.toFixed(2)}
                    </ThemedText>
                    <Pressable
                      onPress={() =>
                        setSecondScoringWindow((v) => +(v + 0.25).toFixed(2))
                      }
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Độ trễ tính điểm đồng thuận (giây)
                  </ThemedText>
                </View>
              </View>

              {/* SECTION: HIỆP ĐẤU */}
              <View style={styles.settingSection}>
                <ThemedText style={styles.sectionHeader}>HIỆP ĐẤU</ThemedText>

                <View style={styles.settingRow}>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() =>
                        setRoundsPerMatch((v) => Math.max(1, v - 1))
                      }
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>
                      {roundsPerMatch}
                    </ThemedText>
                    <Pressable
                      onPress={() => setRoundsPerMatch((v) => v + 1)}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Số hiệp mỗi trận đấu
                  </ThemedText>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() =>
                        setRoundTimeSeconds((v) => Math.max(10, v - 10))
                      }
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>
                      {roundTimeSeconds}
                    </ThemedText>
                    <Pressable
                      onPress={() => setRoundTimeSeconds((v) => v + 10)}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Thời gian mỗi hiệp (giây)
                  </ThemedText>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() =>
                        setBreakTimeSeconds((v) => Math.max(5, v - 5))
                      }
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>
                      {breakTimeSeconds}
                    </ThemedText>
                    <Pressable
                      onPress={() => setBreakTimeSeconds((v) => v + 5)}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Thời gian nghỉ giữa hiệp (giây)
                  </ThemedText>
                </View>
              </View>

              {/* SECTION: QUY TẮC TRẬN ĐẤU */}
              <View style={styles.settingSection}>
                <ThemedText style={styles.sectionHeader}>
                  QUY TẮC TRẬN ĐẤU
                </ThemedText>

                <Pressable
                  onPress={() =>
                    setResetScoreBetweenRounds((v) => !v)
                  }
                  style={styles.checkboxRow}>
                  <View
                    style={[
                      styles.checkbox,
                      resetScoreBetweenRounds && styles.checkboxActive,
                    ]}>
                    {resetScoreBetweenRounds && <Check size={16} color="#fff" />}
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Đặt lại điểm số khi sang hiệp mới
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setResetPenaltiesBetweenRounds((v) => !v)
                  }
                  style={styles.checkboxRow}>
                  <View
                    style={[
                      styles.checkbox,
                      resetPenaltiesBetweenRounds && styles.checkboxActive,
                    ]}>
                    {resetPenaltiesBetweenRounds && (
                      <Check size={16} color="#fff" />
                    )}
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Đặt lại điểm phạt khi sang hiệp mới
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setTrackRoundWinners((v) => !v)}
                  style={styles.checkboxRow}>
                  <View
                    style={[
                      styles.checkbox,
                      trackRoundWinners && styles.checkboxActive,
                    ]}>
                    {trackRoundWinners && <Check size={16} color="#fff" />}
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Theo dõi người thắng từng hiệp
                  </ThemedText>
                </Pressable>
              </View>

              {/* SECTION: TIÊU CHÍ CHIẾN THẮNG BỔ SUNG */}
              <View style={styles.settingSection}>
                <ThemedText style={styles.sectionHeader}>
                  TIÊU CHÍ CHIẾN THẮNG BỔ SUNG
                </ThemedText>

                <View style={styles.checkboxWithStepRow}>
                  <Pressable
                    onPress={() => setEnableDisqualify((v) => !v)}
                    style={[
                      styles.checkbox,
                      enableDisqualify && styles.checkboxActive,
                    ]}>
                    {enableDisqualify && <Check size={16} color="#fff" />}
                  </Pressable>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() =>
                        setPenaltiesToDisqualify((v) => Math.max(1, v - 1))
                      }
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>
                      {penaltiesToDisqualify}
                    </ThemedText>
                    <Pressable
                      onPress={() => setPenaltiesToDisqualify((v) => v + 1)}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Điểm phạt tối đa bị xử thua (Gam-jeom)
                  </ThemedText>
                </View>

                <View style={styles.checkboxWithStepRow}>
                  <Pressable
                    onPress={() => setEnablePointDiff((v) => !v)}
                    style={[
                      styles.checkbox,
                      enablePointDiff && styles.checkboxActive,
                    ]}>
                    {enablePointDiff && <Check size={16} color="#fff" />}
                  </Pressable>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() => setPointDiff((v) => Math.max(1, v - 1))}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>{pointDiff}</ThemedText>
                    <Pressable
                      onPress={() => setPointDiff((v) => v + 1)}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Cách biệt điểm số để thắng hiệp (Point Gap)
                  </ThemedText>
                </View>

                <View style={styles.checkboxWithStepRow}>
                  <Pressable
                    onPress={() => setEnablePointWin((v) => !v)}
                    style={[
                      styles.checkbox,
                      enablePointWin && styles.checkboxActive,
                    ]}>
                    {enablePointWin && <Check size={16} color="#fff" />}
                  </Pressable>
                  <View style={styles.stepControls}>
                    <Pressable
                      onPress={() => setPointsToWin((v) => Math.max(1, v - 1))}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.stepVal}>{pointsToWin}</ThemedText>
                    <Pressable
                      onPress={() => setPointsToWin((v) => v + 1)}
                      style={styles.stepBtn}>
                      <ThemedText style={styles.stepBtnText}>+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.settingLabel}>
                    Điểm số tối đa để thắng ngay
                  </ThemedText>
                </View>
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setShowSettings(false)}
                  style={styles.cancelBtn}>
                  <ThemedText style={styles.cancelBtnText}>Hủy</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    action({ type: 'setDuration', seconds: roundTimeSeconds });
                    setShowSettings(false);
                  }}
                  style={styles.saveBtn}>
                  <ThemedText style={styles.saveBtnText}>
                    Lưu và bắt đầu trận mới
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    height: '100vh' as any,
    width: '100vw' as any,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  header: {
    height: 48,
    alignSelf: 'stretch',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#EF4444',
  },
  brandPlus: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '900',
  },
  headerIconButton: {
    padding: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomCodeBadge: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  roomCodeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 54,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 2,
  },
  matchScoreRed: {
    fontSize: 22,
    fontWeight: '900',
    color: '#EF4444',
  },
  matchScoreDash: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  matchScoreBlue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2563EB',
  },
  roundHeader: {
    marginTop: 2,
  },
  roundText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  clockBox: {
    width: 320,
    height: 96,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
  },
  clockPaused: {
    backgroundColor: '#D1D5DB',
  },
  clockRunning: {
    backgroundColor: '#FACC15',
  },
  clockText: {
    fontSize: 68,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    lineHeight: 74,
  },
  clockTextPaused: {
    color: '#111827',
  },
  clockTextRunning: {
    color: '#000000',
  },
  arenaContainer: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' as any,
  },
  arenaContainerDisplay: {
    paddingHorizontal: 36,
    gap: 48,
    paddingBottom: 28,
  },
  teamColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' as any,
  },
  teamColumnOperator: {
    maxWidth: 'min(31vw, 420px)' as any,
  },
  teamColumnDisplay: {
    maxWidth: 'none' as any,
  },
  teamLabel: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 1,
    maxWidth: 420,
    textAlign: 'center',
  },
  teamNameInput: {
    minWidth: 180,
    maxWidth: 420,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    outlineStyle: 'none' as any,
  },
  redLabel: {
    color: '#EF4444',
  },
  blueLabel: {
    color: '#2563EB',
  },
  scoreCard: {
    width: '100%',
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' as any,
  },
  scoreCardDisplay: {
    borderRadius: 24,
  },
  scoreCardOperator: {
    width: '88%',
    flex: 0.86,
  },
  redScoreCard: {
    backgroundColor: '#EF4444',
  },
  blueScoreCard: {
    backgroundColor: '#1D4ED8',
  },
  scoreNumber: {
    fontSize: 'min(27vh, 207px)' as any,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    lineHeight: 'min(27vh, 207px)' as any,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' as any,
  },
  scoreNumberDisplay: {
    fontSize: 'min(36vh, 260px)' as any,
    lineHeight: 'min(36vh, 260px)' as any,
  },
  subBarContainer: {
    width: '80%',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  subBar: {
    width: '100%',
    height: 14,
    backgroundColor: '#D1D5DB',
    borderRadius: 7,
  },
  subBarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
  },
  middleController: {
    width: 292,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  controlSection: {
    alignItems: 'center',
    gap: 4,
  },
  dualControlSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  halfControl: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  controlHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  valueBox: {
    width: 66,
    height: 42,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  valueInput: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    outlineStyle: 'none' as any,
  },
  footer: {
    height: 44,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  footerDisplay: {
    height: 32,
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    pointerEvents: 'box-none' as any,
  },
  footerSpacer: {
    flex: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  footerIconBtn: {
    padding: 6,
    cursor: 'pointer' as any,
  },
  footerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    cursor: 'pointer' as any,
  },
  toggleIconWrap: {
    padding: 2,
  },
  toggleTrack: {
    width: 38,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#9CA3AF',
  },
  toggleThumbActive: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flex: 1,
  },
  footerActionBtn: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    cursor: 'pointer' as any,
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  errorToast: {
    position: 'absolute',
    bottom: 52,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  errorToastText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalScroll: {
    gap: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
  },
  settingSection: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer' as any,
  },
  checkboxWithStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  stepVal: {
    minWidth: 44,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flexShrink: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer' as any,
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
  },
  cancelBtn: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  saveBtn: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
} as any);
