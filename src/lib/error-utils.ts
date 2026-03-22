import { TRPCClientError } from "@trpc/client";

type TRPCErrorLike = {
  data?: {
    code?: string;
  };
  message?: string;
};

export const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown error";
};

const getTRPCCode = (error: unknown) => {
  if (error instanceof TRPCClientError) {
    return error.data?.code;
  }

  if (error && typeof error === "object") {
    const maybe = error as TRPCErrorLike;
    return maybe.data?.code;
  }

  return undefined;
};

export const isNotFoundError = (error: unknown) => {
  const code = getTRPCCode(error);
  if (code === "NOT_FOUND") return true;

  const message = getErrorMessage(error);
  return /not found|no record was found|required but not found/i.test(message);
};

export const isUnauthorizedError = (error: unknown) => {
  const code = getTRPCCode(error);
  if (code === "UNAUTHORIZED" || code === "FORBIDDEN") return true;

  const message = getErrorMessage(error);
  return /unauthorized|forbidden|active subscription required|subscription required/i.test(message);
};
