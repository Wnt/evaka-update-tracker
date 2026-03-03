/**
 * Shared Playwright fixtures for E2E tests.
 * Reads the server URL once and provides it to all tests.
 */

import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SERVER_INFO_PATH = path.resolve('tests/e2e/test-data/.server-info.json');

let cachedBaseUrl: string | null = null;

function getBaseUrl(): string {
  if (!cachedBaseUrl) {
    const info = JSON.parse(fs.readFileSync(SERVER_INFO_PATH, 'utf-8'));
    cachedBaseUrl = info.url;
  }
  return cachedBaseUrl;
}

export const test = base.extend<{ baseUrl: string }>({
  baseUrl: async ({}, use) => {
    await use(getBaseUrl());
  },
});

export { expect } from '@playwright/test';
