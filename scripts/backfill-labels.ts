/**
 * Backfill PR labels from GitHub API into existing data files.
 * Reads data/history.json and data/current.json, fetches labels for all PRs,
 * and writes updated files back.
 *
 * Usage: npm run backfill-labels
 * Requires: GH_TOKEN environment variable (or .env file)
 */

import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { initGitHubClient, getPullRequest } from '../src/api/github.js';
import { HistoryData, CurrentData, PullRequest } from '../src/types.js';

interface PRKey {
  owner: string;
  repo: string;
  number: number;
}

function collectPRs(prs: PullRequest[]): PRKey[] {
  return prs.map((pr) => {
    const [owner, repo] = pr.repository.split('/');
    return { owner, repo, number: pr.number };
  });
}

function deduplicatePRKeys(keys: PRKey[]): PRKey[] {
  const seen = new Set<string>();
  return keys.filter((k) => {
    const id = `${k.owner}/${k.repo}#${k.number}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function collectAllPRKeys(historyData: HistoryData, currentData: CurrentData): PRKey[] {
  const keys: PRKey[] = [];

  // From history events
  for (const event of historyData.events) {
    keys.push(...collectPRs(event.includedPRs || []));
  }

  // From current data
  for (const cityGroup of currentData.cityGroups) {
    for (const trackType of ['core', 'wrapper'] as const) {
      const track = cityGroup.prTracks[trackType];
      if (!track) continue;
      keys.push(...collectPRs(track.deployed));
      keys.push(...collectPRs(track.inStaging));
      keys.push(...collectPRs(track.pendingDeployment));
    }
  }

  return deduplicatePRKeys(keys);
}

function updatePRLabels(pr: PullRequest, labelsMap: Map<string, string[]>): void {
  const key = `${pr.repository}#${pr.number}`;
  const labels = labelsMap.get(key);
  if (labels !== undefined) {
    pr.labels = labels;
  } else if (!pr.labels) {
    pr.labels = [];
  }
}

function updateAllPRs(historyData: HistoryData, currentData: CurrentData, labelsMap: Map<string, string[]>): void {
  for (const event of historyData.events) {
    for (const pr of event.includedPRs || []) {
      updatePRLabels(pr, labelsMap);
    }
  }

  for (const cityGroup of currentData.cityGroups) {
    for (const trackType of ['core', 'wrapper'] as const) {
      const track = cityGroup.prTracks[trackType];
      if (!track) continue;
      for (const pr of [...track.deployed, ...track.inStaging, ...track.pendingDeployment]) {
        updatePRLabels(pr, labelsMap);
      }
    }
  }
}

async function main() {
  const token = process.env.GH_TOKEN;
  if (!token) {
    console.error('GH_TOKEN environment variable is required');
    process.exit(1);
  }

  initGitHubClient(token);

  const dataDir = path.resolve(import.meta.dirname, '..', 'data');
  const historyPath = path.join(dataDir, 'history.json');
  const currentPath = path.join(dataDir, 'current.json');

  console.log('[Backfill] Reading data files...');
  const historyData: HistoryData = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  const currentData: CurrentData = JSON.parse(fs.readFileSync(currentPath, 'utf-8'));

  const prKeys = collectAllPRKeys(historyData, currentData);
  console.log(`[Backfill] Found ${prKeys.length} unique PRs to fetch labels for`);

  const labelsMap = new Map<string, string[]>();
  let fetched = 0;
  let errors = 0;

  for (const { owner, repo, number } of prKeys) {
    fetched++;
    try {
      const ghPR = await getPullRequest(owner, repo, number);
      const labels = (ghPR.labels || []).map((l) => l.name);
      labelsMap.set(`${owner}/${repo}#${number}`, labels);
      if (fetched % 50 === 0 || fetched === prKeys.length) {
        console.log(`[Backfill] Fetched ${fetched}/${prKeys.length} PRs (${errors} errors)`);
      }
    } catch {
      errors++;
      labelsMap.set(`${owner}/${repo}#${number}`, []);
      if (errors <= 5) {
        console.warn(`[Backfill] Failed to fetch #${number} from ${owner}/${repo}, using empty labels`);
      }
    }
  }

  console.log('[Backfill] Updating PR objects...');
  updateAllPRs(historyData, currentData, labelsMap);

  console.log('[Backfill] Writing updated files...');
  fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2) + '\n');
  fs.writeFileSync(currentPath, JSON.stringify(currentData, null, 2) + '\n');

  console.log(`[Backfill] Done! Updated ${labelsMap.size} PRs (${errors} errors)`);
}

main().catch((err) => {
  console.error('[Backfill] Fatal error:', err);
  process.exit(1);
});
