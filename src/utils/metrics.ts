import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Histogram, register } from 'prom-client';
import { Aggregate, Query, Schema } from 'mongoose';

const mongoQueryDuration = new Histogram({
  name: 'mongodb_query_duration_seconds',
  help: 'Duration of MongoDB queries in seconds',
  labelNames: ['operation', 'collection'],
  registers: [register],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5],
});

const mongoQueryTotal = new Histogram({
  name: 'mongodb_query_total',
  help: 'Total number of MongoDB queries',
  labelNames: ['operation', 'collection', 'status'],
  registers: [register],
});

type TimedContext = {
  _startTime?: number;
  op?: string;
  mongooseCollection?: { name?: string };
  model?: { collection?: { name?: string } };
};
export function mongooseMetricsPlugin(schema: Schema) {
  // Query middleware
  schema.pre(/^find|^count|^update|^delete/, function (this: Query<any, any> & TimedContext) {
    this._startTime = Date.now();
  });

  schema.post(
    /^find|^count|^update|^delete/,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function (this: Query<any, any> & TimedContext, _result: any) {
      const duration = (Date.now() - (this._startTime ?? Date.now())) / 1000;
      const operation = this.op ?? 'unknown';
      const collection = this.mongooseCollection?.name ?? this.model?.collection?.name ?? 'unknown';

      mongoQueryDuration.observe({ operation, collection }, duration);
      mongoQueryTotal.observe({ operation, collection, status: 'success' }, 1);
    },
  );

  // Aggregate middleware (different `this` type)
  schema.pre('aggregate', function (this: Aggregate<any[]> & TimedContext) {
    this._startTime = Date.now();
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schema.post('aggregate', function (this: Aggregate<any[]> & TimedContext, _result: any) {
    const duration = (Date.now() - (this._startTime ?? Date.now())) / 1000;
    const operation = 'aggregate';
    const collection = this.model()?.collection?.name ?? 'unknown';

    mongoQueryDuration.observe({ operation, collection }, duration);
    mongoQueryTotal.observe({ operation, collection, status: 'success' }, 1);
  });
}

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = (Date.now() - startTime) / 1000;

          httpRequestDuration.observe(
            {
              method: request.method,
              route: request.route?.path || request.url,
              status_code: response.statusCode,
            },
            duration,
          );
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;

          httpRequestDuration.observe(
            {
              method: request.method,
              route: request.route?.path || request.url,
              status_code: error.status || 500,
            },
            duration,
          );
        },
      }),
    );
  }
}
