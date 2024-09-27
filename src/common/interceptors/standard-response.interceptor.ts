import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export class ResponseTemplateInterceptor<T> implements NestInterceptor<T, any> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = context.switchToHttp().getResponse();

        if (data['message']) {
          response.message = data['message'];
          delete data['message'];
        } else response.message = 'Success!';

        return {
          message: response.message,
          data,
          status: response.statusCode,
        };
      }),
    );
  }
}
