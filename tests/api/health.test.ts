import assert from 'node:assert/strict';

const baseUrl = process.env['API_URL'] ?? 'http://localhost:3001';

async function probe(path: string): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`);
  const body = (await response.json()) as {
    success: boolean;
    data?: { status: string; database: string; service: string };
    code?: string;
    message?: string;
  };

  assert.equal(
    response.status,
    200,
    `${path} should return HTTP 200 when the database is up`,
  );
  assert.equal(body.success, true);
  assert.equal(body.data?.service, 'sp2036-api');
  assert.equal(body.data?.database, 'connected');
  assert.equal(body.data?.status, 'ok');
}

async function main(): Promise<void> {
  await probe('/health');
  await probe('/api/v1/health');
  console.log('Health Check API passed.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
