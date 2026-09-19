import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import type { RelationshipType } from '@/features/authentication/domain/auth.types';
import { userPersonApi } from '@/features/person';
import { userRoleApi } from '@/features/roles';
import { userApi, type UserStatus } from '@/features/user';
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
  AdminPickerField,
  AdminPickerSheet,
  AdminSearchField,
  AdminSectionHeader,
  adminStyles,
} from '../components/AdministrationPrimitives';
import { containsSearch, formatDateTime, initials, relationshipLabel, roleCodesForUser, userStatusLabel } from '../domain/administrationViewModel';
import { administrationKeys, usePeople, useRoles, useUser, useUserPersons, useUserRoles, useUsers } from '../queries/administrationQueries';

const statuses = ['ACTIVE', 'PENDING', 'DEACTIVATED', 'BANNED'] as const satisfies readonly UserStatus[];
const relationships = ['OWNER', 'GUARDIAN', 'MANAGER'] as const satisfies readonly RelationshipType[];

function useUserId() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return Array.isArray(userId) ? userId[0] : userId;
}

function navigate(router: ReturnType<typeof useRouter>, path: string) { router.push(path as Href); }

function Avatar({ name }: { name?: string | null }) {
  return <View style={styles.avatar}><ThemedText type="featureLabel" style={styles.avatarText}>{initials(name)}</ThemedText></View>;
}

function StatusChip({ status }: { status?: UserStatus | null }) {
  const tone = status === 'ACTIVE' ? 'success' : status === 'PENDING' ? 'warning' : status === 'BANNED' ? 'danger' : 'neutral';
  return <AdminChip label={userStatusLabel(status)} tone={tone} />;
}

export function UserListScreen() {
  const router = useRouter();
  const users = useUsers();
  const profiles = useUserPersons();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | UserStatus>('ALL');
  const visible = (users.data?.content ?? []).filter((user) => {
    const person = profiles.data?.content.find((item) => item.user.userId === user.userId)?.person;
    return containsSearch(search, user.phoneNumber, person?.fullName, person?.personCode) && (status === 'ALL' || user.status === status);
  });
  return (
    <StackScreenLayout title="Người dùng" contentContainerStyle={adminStyles.screen}>
      <AdminIntro>Quản lý tài khoản, hồ sơ liên kết và vai trò truy cập.</AdminIntro>
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Tìm số điện thoại hoặc tên hồ sơ" />
      <View style={adminStyles.chips}>
        <AdminChip label="Tất cả" selected={status === 'ALL'} onPress={() => setStatus('ALL')} />
        <AdminChip label="Hoạt động" selected={status === 'ACTIVE'} onPress={() => setStatus('ACTIVE')} />
        <AdminChip label="Chờ kích hoạt" selected={status === 'PENDING'} onPress={() => setStatus('PENDING')} />
      </View>
      <AdminSectionHeader title={`${visible.length} người dùng`} actionLabel="Tạo người dùng" onAction={() => navigate(router, '/admin/users/create')} />
      {users.isPending || profiles.isPending ? <AdminLoadingState /> : visible.length === 0 ? <AdminEmptyState message="Không tìm thấy người dùng phù hợp" /> : (
        <View style={styles.list}>{visible.map((user) => {
          const person = profiles.data?.content.find((item) => item.user.userId === user.userId)?.person;
          return <AdminListRow key={user.userId} leading={<Avatar name={person?.fullName ?? user.phoneNumber} />} title={person?.fullName ?? user.phoneNumber ?? 'Tài khoản chưa có tên'} subtitle={person ? user.phoneNumber : 'Chưa liên kết hồ sơ'} meta={<StatusChip status={user.status} />} onPress={() => navigate(router, `/admin/users/${user.userId}`)} />;
        })}</View>
      )}
    </StackScreenLayout>
  );
}

export function UserDetailScreen() {
  const router = useRouter();
  const userId = useUserId();
  const user = useUser(userId);
  const profiles = useUserPersons();
  const assignments = useUserRoles();
  const roles = useRoles();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const userProfiles = (profiles.data?.content ?? []).filter((item) => item.user.userId === userId);
  const codes = roleCodesForUser(userId ?? '', assignments.data?.content ?? []);
  const assignedRoles = (roles.data?.content ?? []).filter((role) => codes.includes(role.code));
  const remove = useMutation({
    mutationFn: () => userApi.remove(userId as string),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: administrationKeys.users }); toast.show({ message: 'Đã xóa người dùng', variant: 'success' }); router.replace('/admin/users' as Href); },
    onError: () => toast.show({ message: 'Không thể xóa người dùng này', variant: 'error' }),
  });
  return (
    <StackScreenLayout title="Chi tiết người dùng" contentContainerStyle={adminStyles.screen}>
      {user.isPending ? <AdminLoadingState /> : !user.data ? <AdminEmptyState message="Không tìm thấy người dùng" /> : <>
        <AdminCard style={adminStyles.gap}>
          <View style={styles.titleRow}><Avatar name={userProfiles[0]?.person.fullName ?? user.data.phoneNumber} /><View style={adminStyles.grow}><ThemedText type="heading">{userProfiles[0]?.person.fullName ?? user.data.phoneNumber ?? 'Người dùng'}</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>{user.data.phoneNumber}</ThemedText></View><StatusChip status={user.data.status} /></View>
          <View style={adminStyles.labelValue}><ThemedText type="featureLabel">Đăng nhập gần nhất</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>{formatDateTime(user.data.lastLoginAt)}</ThemedText></View>
          <View style={adminStyles.labelValue}><ThemedText type="featureLabel">Phiên bản phân quyền</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>v{user.data.authorizationVersion ?? 0}</ThemedText></View>
        </AdminCard>
        <View style={adminStyles.actions}><AdminButton label="Chỉnh sửa" variant="secondary" onPress={() => navigate(router, `/admin/users/${userId}/edit`)} style={adminStyles.grow} /><AdminButton label="Gán vai trò" onPress={() => navigate(router, `/admin/users/${userId}/roles`)} style={adminStyles.grow} /></View>
        <AdminSectionHeader title="Hồ sơ liên kết" actionLabel="Quản lý" onAction={() => navigate(router, `/admin/users/${userId}/profiles`)} />
        {userProfiles.length === 0 ? <AdminEmptyState message="Chưa liên kết hồ sơ" /> : <AdminCard style={styles.zeroPadding}>{userProfiles.map((profile) => <AdminListRow key={profile.userPersonId} leading={<Avatar name={profile.person.fullName} />} title={profile.person.fullName} subtitle={`${profile.person.personCode} · ${relationshipLabel(profile.relationshipType)}`} meta={<AdminChip label={profile.active ? 'Đang dùng' : 'Tạm dừng'} tone={profile.active ? 'success' : 'neutral'} />} />)}</AdminCard>}
        <AdminSectionHeader title="Vai trò được gán" />
        {assignedRoles.length === 0 ? <AdminEmptyState message="Chưa được gán vai trò" /> : <View style={adminStyles.chips}>{assignedRoles.map((role) => <AdminChip key={role.code} label={role.name} tone="info" />)}</View>}
        <AdminButton label="Xóa người dùng" variant="text" onPress={() => setConfirming(true)} />
      </>}
      <AdminConfirmDialog confirming={confirming} title="Xóa người dùng?" message="Tài khoản, vai trò và các liên kết hồ sơ của người dùng sẽ bị ảnh hưởng. Thao tác này không thể hoàn tác." confirmLabel="Xóa" destructive loading={remove.isPending} onCancel={() => setConfirming(false)} onConfirm={() => remove.mutate()} />
    </StackScreenLayout>
  );
}

export function UserCreateScreen() {
  const router = useRouter();
  const people = usePeople();
  const roles = useRoles();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [personId, setPersonId] = useState<string>();
  const [relationship, setRelationship] = useState<RelationshipType>('OWNER');
  const [roleCodes, setRoleCodes] = useState<string[]>([]);
  const [personSheet, setPersonSheet] = useState(false);
  const [relationshipSheet, setRelationshipSheet] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const selectedPerson = people.data?.content.find((person) => person.personId === personId);
  const create = useMutation({
    mutationFn: async () => {
      const created = await userApi.create({ phoneNumber: phone.trim(), passwordHash: password, personId: personId as string, relationshipType: relationship });
      if (roleCodes.length) await userRoleApi.replaceForUser(created.userId, { roleCodes });
      return created;
    },
    onSuccess: async (created) => { await queryClient.invalidateQueries({ queryKey: administrationKeys.all }); toast.show({ message: 'Đã tạo người dùng', variant: 'success' }); setConfirming(false); router.replace(`/admin/users/${created.userId}` as Href); },
    onError: () => toast.show({ message: 'Không thể tạo người dùng. Kiểm tra hồ sơ và số điện thoại.', variant: 'error' }),
  });
  const toggleRole = (code: string) => setRoleCodes((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  const valid = phone.trim().length >= 9 && password.length >= 6 && Boolean(personId);
  return (
    <StackScreenLayout title="Tạo người dùng" contentContainerStyle={adminStyles.screen}>
      <AdminField label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Nhập số điện thoại đăng nhập" />
      <AdminField label="Mật khẩu ban đầu" value={password} onChangeText={setPassword} secureTextEntry placeholder="Tối thiểu 6 ký tự" />
      <AdminPickerField label="Hồ sơ" valueLabel={selectedPerson?.fullName} placeholder="Chọn một hồ sơ bắt buộc" onPress={() => setPersonSheet(true)} />
      <AdminPickerField label="Mối quan hệ" valueLabel={relationshipLabel(relationship)} placeholder="Chọn mối quan hệ" onPress={() => setRelationshipSheet(true)} />
      <AdminSectionHeader title="Vai trò ban đầu" />
      <View style={adminStyles.chips}>{(roles.data?.content ?? []).map((role) => <AdminChip key={role.code} label={role.name} selected={roleCodes.includes(role.code)} onPress={() => toggleRole(role.code)} />)}</View>
      <AdminInfoBanner>Tài khoản bắt buộc liên kết chính xác một hồ sơ khi tạo, theo hợp đồng backend hiện tại.</AdminInfoBanner>
      <AdminButton label="Tạo người dùng" disabled={!valid} onPress={() => setConfirming(true)} />
      <AdminButton label="Hủy" variant="secondary" onPress={() => router.back()} />
      <AdminPickerSheet visible={personSheet} title="Chọn hồ sơ" options={(people.data?.content ?? []).map((person) => ({ value: person.personId, label: person.fullName, description: person.personCode ?? undefined }))} selectedValue={personId} onSelect={setPersonId} onClose={() => setPersonSheet(false)} />
      <AdminPickerSheet visible={relationshipSheet} title="Chọn mối quan hệ" options={relationships.map((value) => ({ value, label: relationshipLabel(value) }))} selectedValue={relationship} onSelect={(value) => setRelationship(value as RelationshipType)} onClose={() => setRelationshipSheet(false)} />
      <AdminConfirmDialog confirming={confirming} title="Tạo người dùng mới?" message={`Tài khoản ${phone} sẽ được tạo và liên kết với ${selectedPerson?.fullName ?? 'hồ sơ đã chọn'}.`} confirmLabel="Tạo mới" loading={create.isPending} onCancel={() => setConfirming(false)} onConfirm={() => create.mutate()} />
    </StackScreenLayout>
  );
}

export function UserEditScreen() {
  const router = useRouter();
  const userId = useUserId();
  const user = useUser(userId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [confirming, setConfirming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!user.data) return;
    // Async server state seeds an editable draft when the record arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhone(user.data.phoneNumber ?? ''); setStatus(user.data.status ?? 'PENDING');
  }, [user.data]);
  const save = useMutation({
    mutationFn: () => userApi.update(userId as string, { phoneNumber: phone.trim(), passwordHash: user.data?.passwordHash ?? '', status, lastLoginAt: user.data?.lastLoginAt ?? '1970-01-01T00:00:00', authorizationVersion: user.data?.authorizationVersion ?? 0 }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: administrationKeys.users }); await queryClient.invalidateQueries({ queryKey: administrationKeys.user(userId ?? '') }); toast.show({ message: 'Đã cập nhật người dùng', variant: 'success' }); setConfirming(false); router.replace(`/admin/users/${userId}` as Href); },
    onError: () => toast.show({ message: 'Không thể cập nhật người dùng', variant: 'error' }),
  });
  const remove = useMutation({ mutationFn: () => userApi.remove(userId as string), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: administrationKeys.users }); router.replace('/admin/users' as Href); }, onError: () => toast.show({ message: 'Không thể xóa người dùng', variant: 'error' }) });
  return (
    <StackScreenLayout title="Sửa người dùng" contentContainerStyle={adminStyles.screen}>
      <AdminField label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <AdminSectionHeader title="Trạng thái" />
      <View style={adminStyles.chips}>{statuses.map((value) => <AdminChip key={value} label={userStatusLabel(value)} selected={status === value} onPress={() => setStatus(value)} />)}</View>
      <AdminCard style={adminStyles.gap}><View style={adminStyles.labelValue}><ThemedText type="featureLabel">Đăng nhập gần nhất</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>{formatDateTime(user.data?.lastLoginAt)}</ThemedText></View><View style={adminStyles.labelValue}><ThemedText type="featureLabel">Phiên bản phân quyền</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>v{user.data?.authorizationVersion ?? 0}</ThemedText></View></AdminCard>
      <AdminInfoBanner>Khóa hoặc vô hiệu hóa tài khoản có thể khiến các phiên đăng nhập hiện tại mất quyền truy cập.</AdminInfoBanner>
      <AdminButton label="Lưu thay đổi" disabled={phone.trim().length < 9 || !user.data?.passwordHash} onPress={() => setConfirming(true)} />
      {!user.data?.passwordHash && user.isSuccess ? <AdminInfoBanner tone="warning">API không trả về dữ liệu mật khẩu cần thiết cho hợp đồng cập nhật hiện tại, nên thao tác lưu đã được khóa để tránh ghi đè mật khẩu.</AdminInfoBanner> : null}
      <AdminButton label="Xóa người dùng" variant="text" onPress={() => setConfirmDelete(true)} />
      <AdminConfirmDialog confirming={confirming} title="Lưu thay đổi?" message="Số điện thoại và trạng thái tài khoản sẽ được cập nhật ngay." confirmLabel="Lưu" loading={save.isPending} onCancel={() => setConfirming(false)} onConfirm={() => save.mutate()} />
      <AdminConfirmDialog confirming={confirmDelete} title="Xóa người dùng?" message="Tài khoản và các liên kết liên quan sẽ bị ảnh hưởng. Thao tác này không thể hoàn tác." confirmLabel="Xóa" destructive loading={remove.isPending} onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />
    </StackScreenLayout>
  );
}

export function UserRolesScreen() {
  const router = useRouter();
  const userId = useUserId();
  const user = useUser(userId);
  const roles = useRoles();
  const assignments = useUserRoles();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    // The selection draft is initialized from the separately loaded assignment resource.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(roleCodesForUser(userId ?? '', assignments.data?.content ?? []));
  }, [assignments.data, userId]);
  const save = useMutation({ mutationFn: () => userRoleApi.replaceForUser(userId as string, { roleCodes: selected }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: administrationKeys.userRoles }); toast.show({ message: 'Đã cập nhật vai trò', variant: 'success' }); router.replace(`/admin/users/${userId}` as Href); }, onError: () => toast.show({ message: 'Không thể cập nhật vai trò', variant: 'error' }) });
  const toggle = (code: string) => setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  return (
    <StackScreenLayout title="Gán vai trò" contentContainerStyle={adminStyles.screen}>
      <AdminCard><ThemedText type="title">{user.data?.phoneNumber ?? 'Người dùng'}</ThemedText><ThemedText type="bodySmall" style={adminStyles.muted}>{selected.length} vai trò được chọn</ThemedText></AdminCard>
      {roles.isPending || assignments.isPending ? <AdminLoadingState /> : <View style={styles.list}>{(roles.data?.content ?? []).map((role) => <AdminListRow key={role.code} title={role.name} subtitle={role.code} selected={selected.includes(role.code)} onPress={() => toggle(role.code)} />)}</View>}
      <View style={adminStyles.actions}><AdminButton label="Đặt lại" variant="secondary" onPress={() => setSelected(roleCodesForUser(userId ?? '', assignments.data?.content ?? []))} style={adminStyles.grow} /><AdminButton label="Lưu vai trò" loading={save.isPending} onPress={() => save.mutate()} style={adminStyles.grow} /></View>
    </StackScreenLayout>
  );
}

export function UserProfilesScreen() {
  const userId = useUserId();
  const profiles = useUserPersons();
  const people = usePeople();
  const queryClient = useQueryClient();
  const toast = useToast();
  const linked = (profiles.data?.content ?? []).filter((item) => item.user.userId === userId);
  const [personId, setPersonId] = useState<string>();
  const [relationship, setRelationship] = useState<RelationshipType>('GUARDIAN');
  const [personSheet, setPersonSheet] = useState(false);
  const [relationshipSheet, setRelationshipSheet] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const available = (people.data?.content ?? []).filter((person) => !linked.some((item) => item.person.personId === person.personId));
  const selectedPerson = available.find((person) => person.personId === personId);
  const create = useMutation({ mutationFn: () => userPersonApi.create({ userId: userId as string, personId: personId as string, relationshipType: relationship, active: true }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: administrationKeys.userPersons }); toast.show({ message: 'Đã liên kết hồ sơ', variant: 'success' }); setConfirming(false); setPersonId(undefined); }, onError: () => toast.show({ message: 'Không thể liên kết hồ sơ', variant: 'error' }) });
  return (
    <StackScreenLayout title="Hồ sơ liên kết" contentContainerStyle={adminStyles.screen}>
      <AdminSectionHeader title={`${linked.length} hồ sơ đã liên kết`} />
      {profiles.isPending ? <AdminLoadingState /> : linked.length === 0 ? <AdminEmptyState message="Chưa có hồ sơ liên kết" /> : <View style={styles.list}>{linked.map((profile) => <AdminListRow key={profile.userPersonId} leading={<Avatar name={profile.person.fullName} />} title={profile.person.fullName} subtitle={`${profile.person.personCode} · ${relationshipLabel(profile.relationshipType)}`} meta={<StatusChip status={profile.user.status} />} />)}</View>}
      <AdminSectionHeader title="Thêm liên kết" />
      <AdminPickerField label="Hồ sơ" valueLabel={selectedPerson?.fullName} placeholder="Chọn hồ sơ chưa liên kết" onPress={() => setPersonSheet(true)} />
      <AdminPickerField label="Mối quan hệ" valueLabel={relationshipLabel(relationship)} placeholder="Chọn mối quan hệ" onPress={() => setRelationshipSheet(true)} />
      <AdminButton label="Liên kết hồ sơ" disabled={!personId} onPress={() => setConfirming(true)} />
      <AdminPickerSheet visible={personSheet} title="Chọn hồ sơ" options={available.map((person) => ({ value: person.personId, label: person.fullName, description: person.personCode ?? undefined }))} selectedValue={personId} onSelect={setPersonId} onClose={() => setPersonSheet(false)} />
      <AdminPickerSheet visible={relationshipSheet} title="Chọn mối quan hệ" options={relationships.map((value) => ({ value, label: relationshipLabel(value) }))} selectedValue={relationship} onSelect={(value) => setRelationship(value as RelationshipType)} onClose={() => setRelationshipSheet(false)} />
      <AdminConfirmDialog confirming={confirming} title="Tạo liên kết hồ sơ?" message={`${selectedPerson?.fullName ?? 'Hồ sơ'} sẽ được liên kết với tài khoản theo quan hệ ${relationshipLabel(relationship).toLocaleLowerCase('vi-VN')}.`} confirmLabel="Tạo mới" loading={create.isPending} onCancel={() => setConfirming(false)} onConfirm={() => create.mutate()} />
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { overflow: 'hidden', borderRadius: radii.md },
  zeroPadding: { padding: 0, overflow: 'hidden' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primarySoft },
  avatarText: { color: Colors.light.primary },
});
