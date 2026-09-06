import { authApi } from './authentication/api/authApi';
import { authSessionApi } from './authentication/api/authSessionApi';
import { beltExamApi } from './belt-exam/api/beltExamApi';
import { branchApi } from './branch/api/branchApi';
import { classScheduleApi } from './class-schedule/api/classScheduleApi';
import { classSessionApi } from './class-session/api/classSessionApi';
import { coachAssignmentApi } from './coach-assignment/api/coachAssignmentApi';
import { coachTimesheetApi } from './coach-timesheet/api/coachTimesheetApi';
import { courseApi } from './course/api/courseApi';
import { coursePriceApi } from './course-price/api/coursePriceApi';
import { coursePurchaseApi } from './course-purchase/api/coursePurchaseApi';
import { facebookApi } from './facebook/api/facebookApi';
import { fitnessApi } from './fitness/api/fitnessApi';
import { fitnessRecordApi } from './fitness/api/fitnessRecordApi';
import { leaveRequestApi } from './leave-request/api/leaveRequestApi';
import { notificationApi } from './notification/api/notificationApi';
import { notificationRecipientApi } from './notification/api/notificationRecipientApi';
import { personApi } from './person/api/personApi';
import { userPersonApi } from './person/api/userPersonApi';
import { permissionApi } from './roles/api/permissionApi';
import { roleApi } from './roles/api/roleApi';
import { rolePermissionApi } from './roles/api/rolePermissionApi';
import { userRoleApi } from './roles/api/userRoleApi';
import { studentAttendanceApi } from './student-attendance/api/studentAttendanceApi';
import { studentEnrollmentApi } from './student-enrollment/api/studentEnrollmentApi';
import { userApi } from './user/api/userApi';
import { walletApi } from './wallet/api/walletApi';
import { walletTransactionApi } from './wallet-transaction/api/walletTransactionApi';

const contracts = [
  [classScheduleApi, ['list', 'getDetail', 'create', 'update', 'remove']],
  [courseApi, ['list', 'get', 'create', 'update', 'changeSchedule', 'cancelPendingScheduleChange', 'remove']],
  [coursePriceApi, ['list', 'get', 'create', 'update', 'remove']],
  [branchApi, ['list', 'get', 'create', 'update', 'remove']],
  [personApi, ['list', 'get', 'create', 'update', 'remove']],
  [userPersonApi, ['list', 'get', 'create', 'update', 'remove']],
  [coursePurchaseApi, ['list', 'get', 'create', 'update', 'remove']],
  [walletApi, ['list', 'get', 'create', 'update', 'remove', 'topUp', 'purchaseCourse', 'refund']],
  [walletTransactionApi, ['list', 'get', 'create', 'update', 'remove']],
  [notificationApi, ['list', 'get', 'create', 'update', 'remove']],
  [notificationRecipientApi, ['list', 'get', 'create', 'update', 'remove']],
  [facebookApi, ['verifyWebhook', 'getVideoInsights', 'getPostInsights', 'receiveWebhook']],
  [authApi, ['login', 'refresh', 'getAccount', 'getContexts', 'switchContext', 'getSessions', 'logout', 'logoutAll', 'updateFcm']],
  [authSessionApi, ['list', 'get', 'create', 'update', 'remove']],
  [permissionApi, ['list', 'get', 'create', 'update', 'remove']],
  [roleApi, ['list', 'get', 'create', 'update', 'remove']],
  [rolePermissionApi, ['list', 'get', 'create', 'remove', 'replaceForRole']],
  [userApi, ['list', 'get', 'create', 'update', 'remove']],
  [userRoleApi, ['list', 'get', 'assign', 'replaceForUser', 'remove']],
  [fitnessApi, ['list', 'get', 'create', 'update', 'remove', 'getBySkillLevel']],
  [fitnessRecordApi, ['getList', 'get', 'create', 'update', 'remove']],
  [beltExamApi, ['list', 'get', 'create', 'update', 'remove']],
  [classSessionApi, ['list', 'get', 'create', 'update', 'remove']],
  [coachAssignmentApi, ['list', 'get', 'create', 'update', 'remove']],
  [coachTimesheetApi, ['list', 'get', 'create', 'update', 'remove']],
  [leaveRequestApi, ['list', 'get', 'create', 'approve', 'reject', 'cancel']],
  [studentAttendanceApi, ['list', 'get', 'create', 'update', 'remove']],
  [studentEnrollmentApi, ['list', 'get', 'create', 'update', 'remove']],
] as const;

it('exposes mobile API functions for every imported Java controller', () => {
  for (const [moduleApi, methods] of contracts) {
    for (const method of methods) {
      expect((moduleApi as Record<string, unknown>)[method]).toEqual(expect.any(Function));
    }
  }
});
