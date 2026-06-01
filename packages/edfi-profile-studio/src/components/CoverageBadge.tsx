import { UsageStatus } from 'edfi-profile-core';

export function CoverageBadge({ status }: { status?: UsageStatus }) {
  if (!status) return <span className="badge unset">unmarked</span>;
  return <span className={`badge ${status}`}>{status}</span>;
}
