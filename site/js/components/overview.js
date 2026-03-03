/**
 * Overview component: renders all 4 city groups as cards.
 */

import { renderStatusBadge } from './status-badge.js';
import { renderPRList } from './pr-list.js';
import { navigate } from '../router.js';

export function renderOverview(data, historyEvents = []) {
  if (!data || !data.cityGroups) {
    return '<div class="empty-state">Muutostietoja ei saatavilla</div>';
  }

  const cards = data.cityGroups.map((city) => renderCityCard(city, historyEvents));
  return `<div class="city-grid">${cards.join('')}</div>`;
}

function findEnvInfo(city, env, historyEvents) {
  const commitSha = env.version?.coreCommit?.sha || env.version?.wrapperCommit?.sha;

  if (env.type === 'production') {
    // Production: find detectedAt and PR title from history events
    const prodEnvIds = city.environments
      .filter((e) => e.type === 'production')
      .map((e) => e.id);
    const prodEvents = historyEvents
      .filter((e) => e.cityGroupId === city.id && prodEnvIds.includes(e.environmentId))
      .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));

    // detectedAt: find the event that deployed this specific commit
    const commitEvent = commitSha
      ? prodEvents.find((e) => e.newCommit?.sha === commitSha)
      : null;
    const detectedAt = commitEvent?.detectedAt || null;

    // PR title: prefer core PRs
    let title = null;
    for (const event of prodEvents) {
      const corePR = (event.includedPRs || []).find((pr) => !pr.isBot && pr.repoType === 'core');
      if (corePR) { title = corePR.title; break; }
    }
    if (!title) {
      for (const event of prodEvents) {
        const anyPR = (event.includedPRs || []).find((pr) => !pr.isBot);
        if (anyPR) { title = anyPR.title; break; }
      }
    }
    return { latestPRTitle: title, detectedAt };
  }

  // Staging: detectedAt from history, PR title from current data
  const stagingEnvIds = city.environments
    .filter((e) => e.type === 'staging')
    .map((e) => e.id);
  const stagingEvent = commitSha
    ? historyEvents.find((e) => e.cityGroupId === city.id && stagingEnvIds.includes(e.environmentId) && e.newCommit?.sha === commitSha)
    : null;

  const coreInStaging = (city.prTracks?.core?.inStaging || []).find((pr) => !pr.isBot);
  const wrapperInStaging = (city.prTracks?.wrapper?.inStaging || []).find((pr) => !pr.isBot);
  let stagingTitle = (coreInStaging || wrapperInStaging)?.title || null;

  // Fall back to history events when inStaging is empty
  if (!stagingTitle) {
    const stagingEvents = historyEvents
      .filter((e) => e.cityGroupId === city.id && stagingEnvIds.includes(e.environmentId))
      .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    for (const event of stagingEvents) {
      const corePR = (event.includedPRs || []).find((pr) => !pr.isBot && pr.repoType === 'core');
      if (corePR) { stagingTitle = corePR.title; break; }
    }
    if (!stagingTitle) {
      for (const event of stagingEvents) {
        const anyPR = (event.includedPRs || []).find((pr) => !pr.isBot);
        if (anyPR) { stagingTitle = anyPR.title; break; }
      }
    }
  }

  return {
    latestPRTitle: stagingTitle,
    detectedAt: stagingEvent?.detectedAt || null,
  };
}

function renderCityCard(city, historyEvents) {
  const envSections = city.environments.map((env) => {
    const label = env.type === 'production' ? 'Tuotanto' : 'Testaus';
    const { latestPRTitle, detectedAt } = findEnvInfo(city, env, historyEvents);
    const badge = renderStatusBadge(env.version, { latestPRTitle, detectedAt });
    const mismatch = env.versionMismatch
      ? '<div class="mismatch-warning">Versioero havaittu instanssien välillä</div>'
      : '';

    return `
      <div class="env-section">
        <div class="env-header">
          <span class="env-label">${label}</span>
          ${badge}
        </div>
        ${mismatch}
      </div>
    `;
  });

  // Show core PRs (last 5 deployed to production)
  const corePRs = city.prTracks?.core?.deployed || [];
  const coreSection = corePRs.length > 0
    ? `<div class="pr-track">
        <div class="pr-track-header">Ydin — Tuotannossa</div>
        ${renderPRList(corePRs)}
      </div>`
    : '';

  // Show wrapper PRs if applicable
  const wrapperPRs = city.prTracks?.wrapper?.deployed || [];
  const wrapperSection = wrapperPRs.length > 0
    ? `<div class="pr-track">
        <div class="pr-track-header">Kuntaimplementaatio — Tuotannossa</div>
        ${renderPRList(wrapperPRs)}
      </div>`
    : '';

  return `
    <div class="city-card" data-city-id="${city.id}">
      <h2>${escapeHtml(city.name)}</h2>
      ${envSections.join('')}
      ${wrapperSection}
      ${coreSection}
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function bindOverviewEvents() {
  document.querySelectorAll('.city-card').forEach((card) => {
    card.addEventListener('click', () => {
      const cityId = card.dataset.cityId;
      if (cityId) navigate(`/city/${cityId}`);
    });
  });
}
