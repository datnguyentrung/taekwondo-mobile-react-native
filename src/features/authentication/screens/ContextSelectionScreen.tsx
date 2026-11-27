import { useLocalSearchParams, useRouter } from 'expo-router';
import { BriefcaseBusiness, ChevronLeft, GraduationCap, ShieldCheck, UserRound } from 'lucide-react-native';
import { memo, useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TenantInfo, UserContext } from '../domain/auth.types';
import { useSelectTenant, useSwitchContext } from '../hooks/useAuthentication';
import { useAuthStore } from '../store/auth.store';
import { normalizeAuthError } from '../utils/normalizeAuthError';

function contextLabel(context: UserContext): string {
  if (context.personCode?.startsWith('VQ_')) return 'Học viên';
  if (context.personCode?.startsWith('VQT_')) return 'Nhân viên';
  return 'Quản lý';
}

function relationshipLabel(context: UserContext): string | null {
  if (!context.relationshipType) return null;
  if (context.relationshipType === 'OWNER') return 'Chính chủ';
  if (context.relationshipType === 'GUARDIAN') return 'Giám hộ';
  if (context.relationshipType === 'MANAGER') return 'Quản lý';
  return context.relationshipType;
}

function ContextIcon({ context }: { context: UserContext }) {
  if (context.personCode?.startsWith('VQ_')) return <GraduationCap size={22} color="#A9151A" aria-hidden />;
  if (context.personCode?.startsWith('VQT_')) return <ShieldCheck size={22} color="#A9151A" aria-hidden />;
  if (context.relationshipType === 'MANAGER') return <BriefcaseBusiness size={22} color="#A9151A" aria-hidden />;
  return <UserRound size={22} color="#A9151A" aria-hidden />;
}

type ContextRowProps = {
  context: UserContext;
  disabled: boolean;
  selected: boolean;
  onSelect: (context: UserContext) => void;
};

const ContextRow = memo(function ContextRow({
  context,
  disabled,
  selected,
  onSelect,
}: ContextRowProps) {
  const relationship = relationshipLabel(context);
  const handlePress = useCallback(() => onSelect(context), [context, onSelect]);

  return (
    <Pressable
      disabled={disabled || selected}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || selected, selected }}
      accessibilityLabel={`${context.displayName}, ${contextLabel(context)}`}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.rowSelected : null,
        pressed ? styles.rowPressed : null,
      ]}>
      <View style={styles.rowIcon}>
        <ContextIcon context={context} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>{context.displayName}</Text>
        <Text style={styles.rowMeta}>
          {relationship ? `${contextLabel(context)} · ${relationship}` : contextLabel(context)}
        </Text>
      </View>
      {disabled && !selected ? <ActivityIndicator color="#A9151A" /> : null}
    </Pressable>
  );
});

const keyExtractor = (context: UserContext) => context.userPersonId;

export default function ContextSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isSwitchMode = params.mode === 'switch';
  const availableTenants = useAuthStore((state) => state.availableTenants);
  const activeTenant = useAuthStore((state) => state.activeTenant);
  const requiresTenantSelection = useAuthStore((state) => state.requiresTenantSelection);
  const contexts = useAuthStore((state) => state.availableContexts);
  const activeContext = useAuthStore((state) => state.activeContext);
  const selectTenant = useSelectTenant();
  const switchContext = useSwitchContext();

  const showTenantList = requiresTenantSelection || !activeTenant;

  const handleBack = useCallback(() => {
    if (!isSwitchMode) return;
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, [isSwitchMode, router]);

  const selectContext = useCallback(
    (context: UserContext) => {
      switchContext.mutate({
        userPersonId: context.userPersonId,
      });
    },
    [switchContext],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserContext }) => (
      <ContextRow
        context={item}
        disabled={switchContext.isPending}
        selected={
          isSwitchMode &&
          activeContext?.userPersonId === item.userPersonId
        }
        onSelect={selectContext}
      />
    ),
    [activeContext, isSwitchMode, selectContext, switchContext.isPending],
  );

  const errorObj = selectTenant.error ?? switchContext.error;
  const error = errorObj ? normalizeAuthError(errorObj) : null;

  if (showTenantList) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={availableTenants}
          keyExtractor={(item: TenantInfo) => item.tenantId}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={ListSeparator}
          renderItem={({ item }) => (
            <Pressable
              disabled={selectTenant.isPending}
              onPress={() => selectTenant.mutate({ tenantId: item.tenantId })}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                activeTenant?.tenantId === item.tenantId ? styles.rowSelected : null,
                pressed ? styles.rowPressed : null,
              ]}>
              <View style={styles.rowIcon}>
                <ShieldCheck size={22} color="#D71113" aria-hidden />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>{item.code}</Text>
              </View>
              {selectTenant.isPending ? <ActivityIndicator color="#D71113" /> : null}
            </Pressable>
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.eyebrow}>CHỌN TRUNG TÂM</Text>
              <Text style={styles.title}>Bạn muốn làm việc với trung tâm nào?</Text>
              <Text style={styles.subtitle}>
                Dữ liệu, vai trò và hồ sơ sẽ được cô lập theo trung tâm bạn chọn.
              </Text>
              {error ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={contexts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={ListSeparator}
        ListHeaderComponent={
          <View style={styles.header}>
            {isSwitchMode ? (
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Quay lại"
                style={styles.backButton}>
                <ChevronLeft size={24} color="#252529" aria-hidden />
              </Pressable>
            ) : null}
            {activeTenant && availableTenants.length > 1 ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.eyebrow}>{activeTenant.name}</Text>
                <Pressable
                  disabled={selectTenant.isPending}
                  onPress={() => {
                    const next = availableTenants.find((t) => t.tenantId !== activeTenant.tenantId);
                    if (next) selectTenant.mutate({ tenantId: next.tenantId });
                  }}>
                  <Text style={[styles.eyebrow, { textDecorationLine: 'underline' }]}>Đổi trung tâm</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.eyebrow}>CHỌN NGỮ CẢNH</Text>
            )}
            <Text style={styles.title}>Bạn muốn thao tác với hồ sơ nào?</Text>
            <Text style={styles.subtitle}>
              Dữ liệu, quyền hạn và thông báo sẽ đồng bộ theo hồ sơ bạn chọn.
            </Text>
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty} accessibilityRole="alert">
            Chưa có ngữ cảnh khả dụng. Vui lòng liên hệ quản trị viên.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingVertical: 18, flexGrow: 1 },
  header: { gap: 8, marginBottom: 24 },
  backButton: {
    width: 48,
    height: 48,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { color: '#A9151A', fontSize: 12, fontWeight: '800' },
  title: { color: '#18181B', fontSize: 26, lineHeight: 33, fontWeight: '800' },
  subtitle: { color: '#626268', fontSize: 15, lineHeight: 22 },
  error: { color: '#9B1C22', fontSize: 14, marginTop: 6 },
  row: {
    minHeight: 82,
    borderWidth: 1,
    borderColor: '#E0E0E4',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  rowSelected: { borderColor: '#A9151A', backgroundColor: '#FFF7F7' },
  rowPressed: { opacity: 0.78 },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCEBEC',
  },
  rowContent: { flex: 1, gap: 4 },
  rowName: { color: '#202024', fontSize: 16, fontWeight: '700' },
  rowMeta: { color: '#68686F', fontSize: 14 },
  separator: { height: 10 },
  empty: { color: '#626268', fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
