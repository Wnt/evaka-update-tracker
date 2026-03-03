/**
 * Playwright global setup: copies static fixture data and starts HTTP server.
 *
 * Uses pre-built fixture JSON instead of running the full backend pipeline.
 * To regenerate fixtures after backend changes: npm start, then copy
 * data/current.json and data/history.json to tests/e2e/fixtures/data/.
 */

import * as fs from 'fs';
import * as path from 'path';
import { startServer } from './helpers/server.js';

const TEST_DATA_DIR = path.resolve('tests/e2e/test-data');
const FIXTURE_DATA_DIR = path.resolve('tests/e2e/fixtures/data');
const SERVER_INFO_PATH = path.resolve('tests/e2e/test-data/.server-info.json');

export default async function globalSetup() {
  // Copy fixture data to test-data directory
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  fs.copyFileSync(
    path.join(FIXTURE_DATA_DIR, 'current.json'),
    path.join(TEST_DATA_DIR, 'current.json')
  );
  fs.copyFileSync(
    path.join(FIXTURE_DATA_DIR, 'history.json'),
    path.join(TEST_DATA_DIR, 'history.json')
  );

  const server = await startServer();
  fs.writeFileSync(SERVER_INFO_PATH, JSON.stringify({ url: server.url, pid: process.pid }));
  (globalThis as Record<string, unknown>).__e2eServer = server;
  console.log(`[E2E] Server ready at ${server.url}`);
}
