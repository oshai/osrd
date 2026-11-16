import type {
  PostTimetableByIdStdcmApiArg,
  PostTimetableByIdStdcmApiResponseWithTraceId,
} from 'common/api/osrdEditoastApi';

export default async function* postTimetableByIdStdcm(
  args: PostTimetableByIdStdcmApiArg,
  signal: AbortSignal
): AsyncGenerator<PostTimetableByIdStdcmApiResponseWithTraceId> {
  const response = await fetch(`/api/timetable/${args.id}/stdcm?infra=${args.infra}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-osrd-stdcm-fallback': String(args['x-osrd-stdcm-fallback'] ?? false),
    },
    body: JSON.stringify(args.body),
    signal: signal,
  });
  if (!response.ok) {
    throw new Error(
      `Bad response from stdcm stream endpoint: ${response.status} ${response.statusText}`
    );
  }
  const traceparent = response.headers.get('traceparent');
  const traceId = traceparent?.split('-')[1];

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer: string = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        yield { ...data, traceId };
      } catch (e) {
        throw new Error(`Error while JSON parse ${line}`, { cause: e });
      }
    }
  }
}
