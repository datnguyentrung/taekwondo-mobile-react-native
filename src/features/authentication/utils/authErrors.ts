import axios from "axios";

type ValidationErrorBody = {
  errors?: unknown;
  message?: unknown;
  error?: unknown;
};

const extractValidationErrors = (errors: unknown): string | null => {
  if (!errors) return null;

  if (Array.isArray(errors)) {
    const values = errors
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "message" in item) {
          const message = (item as { message?: unknown }).message;
          return typeof message === "string" ? message : null;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));

    return values.length > 0 ? values.join("\n") : null;
  }

  if (typeof errors === "object") {
    const values = Object.values(errors as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === "string");

    return values.length > 0 ? values.join("\n") : null;
  }

  return null;
};

export const normalizeAuthError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.";
    }

    const status = error.response.status;
    const data = error.response.data as ValidationErrorBody | string | unknown;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const body = data as ValidationErrorBody;
      const validationMessage = extractValidationErrors(body.errors);
      if (validationMessage) return validationMessage;

      if (typeof body.message === "string" && body.message.trim()) {
        return body.message;
      }

      if (typeof body.error === "string" && body.error.trim()) {
        return body.error;
      }
    }

    if (status === 401) return "Thông tin đăng nhập không chính xác.";
    if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";

    return "Đăng nhập thất bại. Vui lòng thử lại.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
};
