export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiError {
  statusCode: number;
  errorCode: string;
  message: string;
  errors?: Record<string, string[]>;
  traceId: string;
}

export type QueryValue = string | number | boolean | readonly string[] | null | undefined;
