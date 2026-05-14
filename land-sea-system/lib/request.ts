export async function parseJsonBody<T = Record<string, unknown>>(req: Request) {
  const rawBody = await req.text();

  if (!rawBody.trim()) {
    return {} as T;
  }

  return JSON.parse(rawBody) as T;
}
