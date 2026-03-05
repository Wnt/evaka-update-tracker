# Quickstart: Show Empty Sections

**Feature**: 014-show-empty-sections

## What to change

**Single file**: `site/js/components/city-detail.js`

## Current behavior

In `renderCityDetail()`, three PR sections are conditionally rendered:
- **Production** (lines 102-117): Only rendered if `wrapperProdList || coreProdList` is truthy
- **Staging** (lines 120-131): Only rendered if `mergedStaging.length > 0`
- **Pending** (lines 133-145): Only rendered if `mergedPending.length > 0`

When the arrays are empty, the entire section (including heading) is omitted from the DOM.

## Target behavior

Always render all three section containers with their `<h4>` headings. When a section has no PRs, show an empty-state message inside the section div.

## Key patterns to follow

1. **Empty-state div**: `<div class="empty-state">Message here</div>` (already used in `pr-list.js`)
2. **Finnish messages**:
   - Production: "Ei viimeaikaisia tuotantomuutoksia"
   - Staging: "Ei muutoksia testauksessa"
   - Pending: "Ei odottavia muutoksia"
3. **Section CSS classes**: Keep existing `production-section`, `staging-section`, `pending-section` classes

## How to verify

1. Run `npm run build` to generate `dist/`
2. Open `dist/index.html` in a browser
3. Navigate to a city detail page
4. Confirm all three sections are visible even when empty
5. Confirm sections with data still render PR lists normally
