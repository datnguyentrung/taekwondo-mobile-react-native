export interface CoursePurchaseCreateRequest {
  studentPersonId: string;
  coursePriceId: string;
  debitTransactionId: string;
}

export type CoursePurchaseUpdateRequest = CoursePurchaseCreateRequest;

export interface CoursePurchaseResponse {
  coursePurchaseId: string;
  studentPersonId: string;
  coursePriceId: string;
  debitTransactionId: string;
}

export interface CoursePurchaseListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
