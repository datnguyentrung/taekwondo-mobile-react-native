import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { AppIcon } from '@/shared/ui/AppIcon';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, effects, radii } from '@/theme';

import { getMockHistoryRecords } from '../data/history.mock';
import type { AttendanceHistoryMode } from '../domain/historyAccess';
import {
  DEFAULT_HISTORY_YEAR,
  getCalendarQuarterDateRange,
  getDefaultHistoryYears,
  QUARTER_OPTIONS,
  type CalendarQuarter,
} from '../domain/historyDateRange';
import { HistoryRecordCard } from '../components/HistoryRecordCard';
import { HistorySelectSheet } from '../components/HistorySelectSheet';
import { TrainingScoreFloatingButton } from '../components/TrainingScoreFloatingButton';
import { TrainingScoreSheet } from '../components/TrainingScoreSheet';

type AttendanceHistoryScreenProps = {
  mode: AttendanceHistoryMode;
};

type PickerType = 'year' | 'quarter' | null;

const SHEET_HANDOFF_DELAY_MS = 140;

export default function AttendanceHistoryScreen({
  mode,
}: AttendanceHistoryScreenProps) {
  const [selectedYear, setSelectedYear] = useState<number>();
  const [selectedQuarter, setSelectedQuarter] = useState<CalendarQuarter>();
  const [picker, setPicker] = useState<PickerType>(null);
  const [quarterError, setQuarterError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yearOptions = useMemo(
    () =>
      getDefaultHistoryYears(DEFAULT_HISTORY_YEAR).map((year) => ({
        value: year,
        label: String(year),
      })),
    [],
  );
  const quarterOptions = useMemo(
    () =>
      QUARTER_OPTIONS.map((quarter) => ({
        value: quarter,
        label: String(quarter),
      })),
    [],
  );
  const canSearch = Boolean(selectedYear && selectedQuarter);
  const records = useMemo(() => getMockHistoryRecords(mode), [mode]);
  const title = mode === 'student' ? 'Điểm danh' : 'Chấm công';

  const selectedRange =
    selectedYear && selectedQuarter
      ? getCalendarQuarterDateRange(selectedYear, selectedQuarter)
      : null;

  useEffect(
    () => () => {
      if (handoffTimerRef.current) {
        clearTimeout(handoffTimerRef.current);
      }
    },
    [],
  );

  const closePicker = () => {
    if (handoffTimerRef.current) {
      clearTimeout(handoffTimerRef.current);
    }
    setPicker(null);
  };

  const openQuarterPickerAfterHandoff = () => {
    if (handoffTimerRef.current) {
      clearTimeout(handoffTimerRef.current);
    }

    setPicker(null);
    handoffTimerRef.current = setTimeout(() => {
      setPicker('quarter');
    }, SHEET_HANDOFF_DELAY_MS);
  };

  const handleYearPress = () => {
    setQuarterError(null);
    setPicker('year');
  };

  const handleQuarterPress = () => {
    if (!selectedYear) {
      setQuarterError('Vui lòng chọn năm học trước');
      return;
    }
    setQuarterError(null);
    setPicker('quarter');
  };

  return (
    <>
      <StackScreenLayout
        title={title}
        contentContainerStyle={styles.content}
        floatingContent={
          hasSearched && mode === 'student' ? (
            <TrainingScoreFloatingButton onPress={() => setScoreVisible(true)} />
          ) : undefined
        }
      >
        <SelectField
          label="Năm học"
          value={selectedYear ? String(selectedYear) : 'Chọn'}
          onPress={handleYearPress}
        />
        <SelectField
          label="Quý"
          value={selectedQuarter ? String(selectedQuarter) : 'Chọn'}
          onPress={handleQuarterPress}
          error={quarterError}
          style={styles.quarterField}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tra cứu"
          accessibilityState={{ disabled: !canSearch }}
          disabled={!canSearch}
          onPress={() => setHasSearched(true)}
          style={({ pressed }) => [
            styles.searchButton,
            canSearch ? styles.searchButtonActive : null,
            pressed && canSearch ? styles.pressed : null,
          ]}
        >
          <ThemedText type="body" style={styles.searchButtonText}>
            Tra cứu
          </ThemedText>
        </Pressable>

        {selectedRange && hasSearched ? (
          <ThemedText type="bodySmall" style={styles.rangeHint}>
            {selectedRange.from} - {selectedRange.to}
          </ThemedText>
        ) : null}

        {hasSearched ? (
          <View style={styles.list}>
            {records.map((record) => (
              <HistoryRecordCard key={record.id} record={record} />
            ))}
          </View>
        ) : null}
      </StackScreenLayout>

      <HistorySelectSheet
        visible={picker === 'year'}
        title="Chọn năm học"
        options={yearOptions}
        selectedValue={selectedYear}
        onClose={closePicker}
        onPreviewSelect={(year) => {
          setSelectedYear(year);
          setQuarterError(null);
          setHasSearched(false);
        }}
        onSelect={() => {
          openQuarterPickerAfterHandoff();
        }}
      />

      <HistorySelectSheet
        visible={picker === 'quarter'}
        title="Chọn quý"
        options={quarterOptions}
        selectedValue={selectedQuarter}
        onClose={closePicker}
        onPreviewSelect={(quarter) => {
          setSelectedQuarter(quarter);
          setQuarterError(null);
          setHasSearched(false);
        }}
        onSelect={() => {
          setPicker(null);
        }}
      />

      <TrainingScoreSheet
        visible={scoreVisible}
        onClose={() => setScoreVisible(false)}
      />
    </>
  );
}

function SelectField({
  label,
  value,
  onPress,
  style,
  error,
}: {
  label: string;
  value: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  error?: string | null;
}) {
  return (
    <View style={style}>
      <ThemedText type="subtitle" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.selectBox,
          error ? styles.selectBoxError : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <ThemedText
          type="body"
          style={[styles.selectValue, error ? styles.selectValueError : null]}
        >
          {value}
        </ThemedText>
        <AppIcon
          name="chevronRight"
          width={9}
          height={15}
          color={error ? Colors.light.primary : Colors.light.text}
          style={styles.dropdownIcon}
        />
      </Pressable>
      {error ? (
        <View style={styles.errorHint}>
          <AppIcon name="fiRrInfo" size={14} color={Colors.light.primary} />
          <ThemedText type="bodySmall" style={styles.errorHintText}>
            {error}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  fieldLabel: {
    color: Colors.light.text,
    marginBottom: 12,
  },
  quarterField: {
    marginTop: 23,
  },
  selectBox: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    ...effects.card,
  },
  selectBoxError: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  selectValue: {
    color: Colors.light.text,
  },
  selectValueError: {
    color: Colors.light.primary,
  },
  dropdownIcon: {
    transform: [{ rotate: '90deg' }],
  },
  errorHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorHintText: {
    color: Colors.light.primary,
  },
  searchButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: Colors.light.divider,
    marginTop: 30,
  },
  searchButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  searchButtonText: {
    color: Colors.light.surface,
  },
  rangeHint: {
    marginTop: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  list: {
    gap: 20,
    marginTop: 21,
    paddingBottom: 36,
  },
  pressed: {
    opacity: 0.78,
  },
});
