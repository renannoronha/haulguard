import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { SKIP_WRAP_KEY } from "./skip-wrap.decorator";
import { Request } from "express";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_WRAP_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (skip) return next.handle();
    const req = ctx.switchToHttp().getRequest<Request>();
    const requestId = req.headers["x-request-id"];

    return next.handle().pipe(
      map((body: unknown) => {
        // Se o controller já devolveu { data, meta }, preserve:
        if (
          body &&
          typeof body === "object" &&
          "data" in body &&
          Object.prototype.hasOwnProperty.call(body, "meta")
        ) {
          const meta =
            typeof (body as { meta?: unknown }).meta === "object" &&
            (body as { meta?: unknown }).meta !== null
              ? { ...(body as unknown as { meta: object }).meta }
              : {};
          return {
            success: true,
            ...(body as object),
            meta: { requestId, ...meta },
          };
        }
        return { success: true, data: body, meta: { requestId } };
      }),
    );
  }
}
