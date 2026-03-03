/**
 * Playwright global setup: runs the full backend pipeline with nock-mocked
 * HTTP calls, then starts HTTP server for browser tests.
 *
 * This exercises the complete pipeline (status fetch → version resolution →
 * PR collection → change detection → Slack → file writing → site deployment)
 * ensuring integration coverage beyond unit tests.
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateTestData } from './helpers/generate-test-data.js';
import { startServer } from './helpers/server.js';

const SERVER_INFO_PATH = path.resolve('tests/e2e/test-data/.server-info.json');

export default async function globalSetup() {
  const start = Date.now();
  await generateTestData();
  console.log(`[E2E] Pipeline completed in ${Date.now() - start}ms`);

  const server = await startServer();
  fs.writeFileSync(SERVER_INFO_PATH, JSON.stringify({ url: server.url, pid: process.pid }));
  (globalThis as Record<string, unknown>).__e2eServer = server;
  console.log(`[E2E] Server ready at ${server.url}`);
}
