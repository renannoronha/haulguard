export type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, any>; // paginação, requestId, etc.
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string; // ex.: USER_NOT_FOUND, VALIDATION_ERROR
    message: string;
    details?: any; // fields invalid, stack em dev, etc.
  };
  meta?: Record<string, any>;
};
