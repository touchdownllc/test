import { USAGE_STATUSES, UsageStatus } from 'edfi-profile-core';

interface Props {
  value?: UsageStatus;
  /** Restrict the choices — e.g. properties should not offer not-implemented. */
  options?: readonly UsageStatus[];
  includeUnset?: boolean;
  onChange: (value: UsageStatus | undefined) => void;
}

export function UsagePicker({ value, options = USAGE_STATUSES, includeUnset, onChange }: Props) {
  return (
    <select
      className="usage"
      value={value ?? ''}
      aria-label="usage status"
      onChange={(e) => onChange(e.target.value === '' ? undefined : (e.target.value as UsageStatus))}
    >
      {includeUnset && <option value="">— unmarked —</option>}
      {options.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}
