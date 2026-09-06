import type { CoursePriceStatus } from '../constants/course-price.constants';

export interface CoursePriceCreateRequest {
  courseId: string;
  durationMonths: number;
  sessionCount: number;
  basePrice: number;
  finalPrice: number;
  status: CoursePriceStatus;
}

export type CoursePriceUpdateRequest = CoursePriceCreateRequest;

export interface CoursePriceResponse {
  coursePriceId: string;
  courseId: string;
  durationMonths: number;
  sessionCount: number;
  basePrice: number;
  finalPrice: number;
  status: CoursePriceStatus;
}

export interface CoursePriceListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
