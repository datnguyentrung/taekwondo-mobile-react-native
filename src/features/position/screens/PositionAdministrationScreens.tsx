import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { positionApi } from '../api/positionApi';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { ThemedText } from '@/shared/ui/ThemedText';
import { useToast } from '@/shared/ui/Toast';
import { Colors, radii } from '@/theme';
import {
  AdminButton,
  AdminCard,
  AdminChip,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminField,
  AdminInfoBanner,
  AdminIntro,
  AdminListRow,
  AdminLoadingState,
  AdminSearchField,
  AdminSectionHeader,
  AdminSwitchField,
  adminStyles,
} from '@/shared/ui/admin/AdministrationPrimitives';
import { positionKeys, usePosition, usePositionPeople, usePositions } from '../queries/positionQueries';
import { formatDateTime } from '@/shared/utils/dateTime';
import { containsSearch, initials } from '@/shared/utils/string';

function usePositionId() {
  const { positionId } = useLocalSearchParams<{ positionId: string }>();
  return Array.isArray(positionId) ? positionId[0] : positionId;
}

function navigate(router: ReturnType<typeof useRouter>, path: string) { router.push(path as Href); }

function Avatar({ name }: { name?: string | null }) {
  return <View style={styles.avatar}><ThemedText type="featureLabel" style={styles.avatarText}>{initials(name)}</ThemedText></View>;
}

export function PositionListScreen() {
  const router = useRouter();
  const positions = usePositions();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const visible = (positions.data?.content ?? []).filter((item) => containsSearch(search, item.name, item.code) && (status === 'all' || item.active === (status === 'active')));
  return (
    <StackScreenLayout title="Chức vụ" contentContainerStyle={adminStyles.screen}>
      <AdminIntro>Quản lý chức vụ và tra cứu nhân sự theo vị trí công việc.</AdminIntro>
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Tìm tên hoặc mã chức vụ" />
      <View style={adminStyles.chips}>
        <AdminChip label="Tất cả" selected={status === 'all'} onPress={() => setStatus('all')} />
        <AdminChip label="Hoạt động" selected={status === 'active'} onPress={() => setStatus('active')} />
        <AdminChip label="Ngừng dùng" selected={status === 'inactive'} onPress={() => setStatus('inactive')} />
      </View>
      <AdminSectionHeader title={`${visible.length} chức vụ`} actionLabel="Tạo chức vụ" onAction={() => navigate(router, '/admin/positions/create')} />
      {positions.isPending ? <AdminLoadingState /> : visible.length === 0 ? <AdminEmptyState message="Không tìm thấy chức vụ phù hợp" /> : (
        <View style={styles.list}>{visible.map((item) => <AdminListRow key={item.positionId} title={item.name} subtitle={item.code} meta={<AdminChip label={item.active ? 'Hoạt động' : 'Ngừng dùng'} tone={item.active ? 'success' : 'neutral'} />} onPress={() => navigate(router, `/admin/positions/${item.positionId}`)} />)}</View>
      )}
    </StackScreenLayout>
  );
}

export function PositionDetailScreen() {
  const router = useRouter();
  const positionId = usePositionId();
  const position = usePosition(positionId);
  const people = usePositionPeople(positionId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => positionApi.remove(positionId as string),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: positionKeys.lists() }); toast.show({ message: 'Đã xóa chức vụ', variant: 'success' }); router.replace('/admin/positions' as Href); },
    onError: () => toast.show({ message: 'Không thể xóa chức vụ đang có nhân sự', variant: 'error' }),
  });
  return (
    <StackScreenLayout title="Chi tiết chức vụ" contentContainerStyle={adminStyles.screen}>
      {position.isPending ? <AdminLoadingState /> : !position.data ? <AdminEmptyState message="Không tìm thấy chức vụ" /> : <>
        <AdminCard style={adminStyles.gap}>
          <View style={styles.titleRow}><View style={adminStyles.grow}><ThemedText type="heading">{position.data.name}</ThemedText><ThemedText type="code" style={styles.code}>{position.data.code}</ThemedText></View><AdminChip label={position.data.active ? 'Hoạt động' : 'Ngừng dùng'} tone={position.data.active ? 'success' : 'neutral'} /></View>
          <ThemedText type="bodySmall" style={adminStyles.muted}>{position.data.description || 'Chưa có mô tả'}</ThemedText>
        </AdminCard>
        <AdminCard><AdminListRow title={`${people.people.length} nhân sự`} subtitle="Đang giữ chức vụ này" onPress={() => navigate(router, `/admin/positions/${positionId}/staff`)} /></AdminCard>
        <AdminCard style={adminStyles.gap}><View style={adminStyles.labelValue}><ThemedText type="featureLabel">Ngày tạo</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>{formatDateTime(position.data.createdAt)}</ThemedText></View><View style={adminStyles.labelValue}><ThemedText type="featureLabel">Cập nhật gần nhất</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>{formatDateTime(position.data.updatedAt)}</ThemedText></View></AdminCard>
        <AdminButton label="Chỉnh sửa chức vụ" onPress={() => navigate(router, `/admin/positions/${positionId}/edit`)} />
        <AdminButton label="Xóa chức vụ" variant="text" onPress={() => setConfirming(true)} />
      </>}
      <AdminConfirmDialog confirming={confirming} title="Xóa chức vụ?" message={`Chức vụ “${position.data?.name ?? ''}” sẽ bị xóa vĩnh viễn. Hãy bảo đảm không còn nhân sự được gán.`} confirmLabel="Xóa" destructive loading={remove.isPending} onCancel={() => setConfirming(false)} onConfirm={() => remove.mutate()} />
    </StackScreenLayout>
  );
}

export function PositionStaffScreen() {
  const positionId = usePositionId();
  const position = usePosition(positionId);
  const people = usePositionPeople(positionId);
  const [search, setSearch] = useState('');
  const visible = people.people.filter((person) => containsSearch(search, person.fullName, person.personCode));
  return (
    <StackScreenLayout title="Nhân sự theo chức vụ" contentContainerStyle={adminStyles.screen}>
      <AdminCard><ThemedText type="title">{position.data?.name ?? 'Chức vụ'}</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>{people.people.length} nhân sự</ThemedText></AdminCard>
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Tìm tên hoặc mã nhân sự" />
      {people.isPending ? <AdminLoadingState /> : visible.length === 0 ? <AdminEmptyState message="Chưa có nhân sự ở chức vụ này" /> : <View style={styles.list}>{visible.map((person) => <AdminListRow key={person.personId} leading={<Avatar name={person.fullName} />} title={person.fullName} subtitle={person.personCode} meta={<AdminChip label={person.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'} tone={person.status === 'ACTIVE' ? 'success' : 'neutral'} />} />)}</View>}
    </StackScreenLayout>
  );
}

function PositionFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const positionId = usePositionId();
  const position = usePosition(mode === 'edit' ? positionId : undefined);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!position.data) return;
    // Async server state seeds an editable draft when the record arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode(position.data.code); setName(position.data.name); setDescription(position.data.description ?? ''); setActive(position.data.active);
  }, [position.data]);
  const save = useMutation({
    mutationFn: () => mode === 'create' ? positionApi.create({ code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || null, active }) : positionApi.update(positionId as string, { code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || null, active }),
    onSuccess: async (saved) => { await queryClient.invalidateQueries({ queryKey: positionKeys.lists() }); toast.show({ message: mode === 'create' ? 'Đã tạo chức vụ' : 'Đã cập nhật chức vụ', variant: 'success' }); setConfirming(false); router.replace(`/admin/positions/${saved.positionId}` as Href); },
    onError: () => toast.show({ message: 'Không thể lưu chức vụ', variant: 'error' }),
  });
  const remove = useMutation({ mutationFn: () => positionApi.remove(positionId as string), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: positionKeys.lists() }); router.replace('/admin/positions' as Href); }, onError: () => toast.show({ message: 'Không thể xóa chức vụ đang có nhân sự', variant: 'error' }) });
  const valid = code.trim().length > 1 && name.trim().length > 1;
  return (
    <StackScreenLayout title={mode === 'create' ? 'Tạo chức vụ' : 'Sửa chức vụ'} contentContainerStyle={adminStyles.screen}>
      <AdminField label="Mã chức vụ" value={code} onChangeText={setCode} placeholder="Ví dụ: HEAD_COACH" />
      <AdminField label="Tên chức vụ" value={name} onChangeText={setName} placeholder="Nhập tên hiển thị" />
      <AdminField label="Mô tả" value={description} onChangeText={setDescription} multiline placeholder="Mô tả trách nhiệm chính" />
      <AdminSwitchField label="Đang hoạt động" description="Cho phép gán chức vụ này cho nhân sự." value={active} onValueChange={setActive} />
      {mode === 'edit' ? <AdminInfoBanner>Việc ngừng dùng chức vụ không tự động gỡ chức vụ khỏi nhân sự hiện tại.</AdminInfoBanner> : null}
      <AdminButton label={mode === 'create' ? 'Tạo chức vụ' : 'Lưu thay đổi'} disabled={!valid} onPress={() => setConfirming(true)} />
      {mode === 'edit' ? <AdminButton label="Xóa chức vụ" variant="text" onPress={() => setConfirmDelete(true)} /> : <AdminButton label="Hủy" variant="secondary" onPress={() => router.back()} />}
      <AdminConfirmDialog confirming={confirming} title={mode === 'create' ? 'Tạo chức vụ mới?' : 'Lưu thay đổi?'} message={`Thông tin “${name || 'chức vụ'}” sẽ được ${mode === 'create' ? 'tạo mới' : 'cập nhật'}.`} confirmLabel={mode === 'create' ? 'Tạo mới' : 'Lưu'} loading={save.isPending} onCancel={() => setConfirming(false)} onConfirm={() => save.mutate()} />
      <AdminConfirmDialog confirming={confirmDelete} title="Xóa chức vụ?" message="Chức vụ sẽ bị xóa vĩnh viễn và không thể hoàn tác." confirmLabel="Xóa" destructive loading={remove.isPending} onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />
    </StackScreenLayout>
  );
}

export function PositionCreateScreen() { return <PositionFormScreen mode="create" />; }
export function PositionEditScreen() { return <PositionFormScreen mode="edit" />; }

const styles = StyleSheet.create({
  list: { overflow: 'hidden', borderRadius: radii.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  code: { color: Colors.light.primary, marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primarySoft },
  avatarText: { color: Colors.light.primary },
});
