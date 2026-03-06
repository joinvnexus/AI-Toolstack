# Dependency Governance Policy

## Scope

This policy applies to all runtime and development dependencies in `package.json` and `package-lock.json`.

## Automation

The repository runs `.github/workflows/dependency-governance.yml` on:

- Weekly schedule: every Monday at 03:00 UTC
- Manual trigger (`workflow_dispatch`)

The workflow performs:

1. `npm audit --omit=dev --audit-level=high` (production risk gate)
2. `npm audit --audit-level=moderate` (full tree visibility)
3. `npm outdated --long` report upload as CI artifact

## Upgrade Cadence

1. Weekly triage:
   - Review audit results and outdated report
   - Classify changes as patch/minor/major
2. Monthly maintenance batch:
   - Apply safe patch/minor upgrades
   - Run `lint`, `typecheck`, `test`, and `build`
3. Major upgrades:
   - Plan in dedicated PR with rollback notes
   - Validate critical auth, admin, and write-route flows

## Vulnerability SLA

1. Critical or High in production dependencies:
   - Patch or mitigate within 24 hours
2. Moderate:
   - Patch within 7 days
3. Low:
   - Include in next monthly maintenance batch

## Pull Request Requirements

Dependency upgrade PRs must include:

1. Security/maintenance reason
2. Affected package list and versions
3. Verification evidence (`lint`, `typecheck`, `test`, `build`)
