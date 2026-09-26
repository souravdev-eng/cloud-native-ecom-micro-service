import { NextFunction, Request, Response } from 'express';
import { activeTraceIds } from '../observability/traceContext';

export const TRACE_ID_HEADER = 'x-trace-id';

/**
 * Puts the request's trace ID on the response as `x-trace-id`, so a bug
 * report or a browser devtools capture can be pasted straight into Tempo.
 * Mount it before the routes. It does nothing when telemetry isn't started.
 *
 * The header is set as the request arrives, not when the response is sent,
 * because by then the trace context of an async handler may no longer be active.
 */
export const traceIdHeader = (_req: Request, res: Response, next: NextFunction): void => {
  const ids = activeTraceIds();
  if (ids) res.setHeader(TRACE_ID_HEADER, ids.traceId);
  next();
};
