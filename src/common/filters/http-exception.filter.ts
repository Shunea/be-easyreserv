import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    if (typeof exceptionResponse === 'string') {
      response
        .status(status || 500)
        .json({
          statusCode: status || 500,
          message: exceptionResponse
        });
      return;
    }
    
    response
      .status(status || 500)
      .json({
        statusCode: status || 500,
        code: exceptionResponse.code || 'UNKNOWN',
        message: exceptionResponse.message || 'Internal server error',
        details: exceptionResponse.details || null,
        timestamp: new Date().toISOString(),
        fullResponse: exceptionResponse || null,
      });
  }
}