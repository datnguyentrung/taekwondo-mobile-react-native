export interface ApiResponse<T> {
  data: T;
  error: string | null;
  message: string;
  statusCode: number;
}

/** Platform-neutral representation of a multipart upload. */
export type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
