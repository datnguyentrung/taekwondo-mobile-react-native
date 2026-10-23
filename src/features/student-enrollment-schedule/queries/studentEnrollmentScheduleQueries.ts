import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentEnrollmentScheduleApi } from '../api/studentEnrollmentScheduleApi';
import type { StudentEnrollmentScheduleCreateRequest, StudentEnrollmentScheduleUpdateRequest } from '../api/studentEnrollmentSchedule.dto';
export const studentEnrollmentScheduleKeys={all:['student-enrollment-schedules'] as const,list:(id?:string)=>[...studentEnrollmentScheduleKeys.all,'list',id??''] as const,detail:(id?:string)=>[...studentEnrollmentScheduleKeys.all,'detail',id??''] as const};
export function useStudentEnrollmentSchedules(enrollmentId?:string){return useQuery({queryKey:studentEnrollmentScheduleKeys.list(enrollmentId),queryFn:()=>studentEnrollmentScheduleApi.list(enrollmentId!),enabled:Boolean(enrollmentId),staleTime:30_000});}
export function useStudentEnrollmentSchedule(id?:string){return useQuery({queryKey:studentEnrollmentScheduleKeys.detail(id),queryFn:()=>studentEnrollmentScheduleApi.get(id!),enabled:Boolean(id),staleTime:30_000});}
function useInvalidate(){const c=useQueryClient();return()=>c.invalidateQueries({queryKey:studentEnrollmentScheduleKeys.all});}
export function useCreateStudentEnrollmentSchedule(){const done=useInvalidate();return useMutation({mutationFn:(r:StudentEnrollmentScheduleCreateRequest)=>studentEnrollmentScheduleApi.create(r),onSuccess:done});}
export function useUpdateStudentEnrollmentSchedule(){const done=useInvalidate();return useMutation({mutationFn:({id,request}:{id:string;request:StudentEnrollmentScheduleUpdateRequest})=>studentEnrollmentScheduleApi.update(id,request),onSuccess:done});}
export function useDeleteStudentEnrollmentSchedule(){const done=useInvalidate();return useMutation({mutationFn:(id:string)=>studentEnrollmentScheduleApi.remove(id),onSuccess:done});}
