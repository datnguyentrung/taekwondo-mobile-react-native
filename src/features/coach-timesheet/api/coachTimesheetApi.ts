import { javaApi } from '@/infrastructure/http/httpClient';

import type {
  CoachTimesheetAdjustRequest,
  CoachTimesheetCheckInRequest,
  CoachTimesheetFilterRequest,
  CoachTimesheetListResponse,
  CoachTimesheetResponse,
  MyCoachTimesheetsParams,
} from './coach-timesheet.dto';

export const coachTimesheetApi = {
  async checkIn(request: CoachTimesheetCheckInRequest): Promise<CoachTimesheetResponse> {
    const response = await javaApi.post<CoachTimesheetResponse>('/coach-timesheets/check-in', request);
    return response.data;
  },
  async getDetail(timesheetId: string): Promise<CoachTimesheetResponse> {
    const response = await javaApi.get<CoachTimesheetResponse>(`/coach-timesheets/${timesheetId}`);
    return response.data;
  },
  async getList(params?: CoachTimesheetFilterRequest): Promise<CoachTimesheetListResponse> {
    const response = await javaApi.get<CoachTimesheetListResponse>('/coach-timesheets', { params });
    return response.data;
  },
  async getMine(params?: MyCoachTimesheetsParams): Promise<CoachTimesheetListResponse> {
    const response = await javaApi.get<CoachTimesheetListResponse>('/coach-timesheets/me', { params });
    return response.data;
  },
  async adjust(timesheetId: string, request: CoachTimesheetAdjustRequest): Promise<CoachTimesheetResponse> {
    const response = await javaApi.patch<CoachTimesheetResponse>(`/coach-timesheets/${timesheetId}`, request);
    return response.data;
  },
  async remove(timesheetId: string): Promise<void> {
    await javaApi.delete(`/coach-timesheets/${timesheetId}`);
  },
};
