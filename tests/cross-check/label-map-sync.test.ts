import * as fs from 'fs';
import * as path from 'path';
import { SLACK_LABEL_MAP } from '../../src/config/label-map';

/**
 * Cross-check test: ensures the backend SLACK_LABEL_MAP stays in sync
 * with the frontend LABEL_MAP in site/js/components/pr-list.js.
 *
 * If this test fails, it means someone updated one mapping without the other.
 */
describe('label map sync between backend and frontend', () => {
  let frontendLabelMap: Record<string, string>;

  beforeAll(() => {
    const prListPath = path.resolve(__dirname, '../../site/js/components/pr-list.js');
    const content = fs.readFileSync(prListPath, 'utf-8');

    // Extract LABEL_MAP from the frontend JS file
    // Format: key: { text: 'Value', cssClass: '...' }
    const mapMatch = content.match(/const LABEL_MAP\s*=\s*\{([\s\S]*?)\};/);
    if (!mapMatch) {
      throw new Error('Could not find LABEL_MAP in pr-list.js');
    }

    frontendLabelMap = {};
    const entryRegex = /(\w+):\s*\{\s*text:\s*'([^']+)'/g;
    let match;
    while ((match = entryRegex.exec(mapMatch[1])) !== null) {
      frontendLabelMap[match[1]] = match[2];
    }
  });

  it('backend has the same keys as frontend', () => {
    const backendKeys = Object.keys(SLACK_LABEL_MAP).sort();
    const frontendKeys = Object.keys(frontendLabelMap).sort();
    expect(backendKeys).toEqual(frontendKeys);
  });

  it('backend text values match frontend text values for every key', () => {
    for (const [key, backendText] of Object.entries(SLACK_LABEL_MAP)) {
      expect(frontendLabelMap[key]).toBe(backendText);
    }
  });
});
