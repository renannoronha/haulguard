import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const requestId = req.header("x-request-id");
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "Unexpected error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      // Nest/ValidationPipe costuma vir com { message, error }
      if (typeof resp === "string") {
        message = resp;
      } else if (resp && typeof resp === "object") {
        const obj = resp as Record<string, unknown>;
        const respMessage = obj.message;
        if (typeof respMessage === "string") {
          message = respMessage;
        } else if (Array.isArray(respMessage)) {
          message = respMessage.join(", ");
        } else {
          message = exception.message;
        }

        const candidateCode = obj.code ?? obj.error;
        if (typeof candidateCode === "string") {
          code = candidateCode;
        }
      } else {
        message = exception.message;
      }
    }

    // Em dev, você pode anexar stack/details
    const payload = {
      success: false,
      error: { code, message },
      meta: { requestId },
    };

    res.status(status).json(payload);
  }
}
