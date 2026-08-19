import { javaApi } from '@/infrastructure/http/httpClient';

import type { ScheduleStatus } from '../constants/class-schedule.constants';
import type {
  ClassScheduleCreateRequest,
  ClassScheduleDetail,
  ClassScheduleUpdateRequest,
  GetClassSchedulesParams,
} from './class-schedule.dto';

export const classScheduleApi = {
  async getList(params?: GetClassSchedulesParams): Promise<ClassScheduleDetail[]> {
    const response = await javaApi.get<ClassScheduleDetail[]>('/class-schedules', { params });
    return response.data;
  },

  async getDetail(scheduleId: string): Promise<ClassScheduleDetail> {
    const response = await javaApi.get<ClassScheduleDetail>(`/class-schedules/${scheduleId}`);
    return response.data;
  },

  async create(request: ClassScheduleCreateRequest): Promise<ClassScheduleDetail> {
    const response = await javaApi.post<ClassScheduleDetail>('/class-schedules', request);
    return response.data;
  },

  async update(scheduleId: string, request: ClassScheduleUpdateRequest): Promise<ClassScheduleDetail> {
    const response = await javaApi.put<ClassScheduleDetail>(`/class-schedules/${scheduleId}`, request);
    return response.data;
  },

  async remove(scheduleId: string): Promise<void> {
    await javaApi.delete(`/class-schedules/${scheduleId}`);
  },

  async updateStatus(scheduleId: string, status: ScheduleStatus): Promise<void> {
    await javaApi.patch(`/class-schedules/${scheduleId}/status`, undefined, { params: { status } });
  },
};
