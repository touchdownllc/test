import { useMemo, useState } from 'react';
import { useProfileStore } from '../state/profileStore';
import { CoverageBadge } from './CoverageBadge';

export function ResourceList() {
  const spec = useProfileStore((s) => s.spec);
  const profile = useProfileStore((s) => s.profile);
  const selected = useProfileStore((s) => s.selectedResource);
  const selectResource = useProfileStore((s) => s.selectResource);

  const [filter, setFilter] = useState('');
  const [onlyMarked, setOnlyMarked] = useState(false);

  const resources = useMemo(() => {
    if (!spec) return [];
    return spec.resources.filter((r) => {
      if (filter && !r.resourceName.toLowerCase().includes(filter.toLowerCase())) return false;
      if (onlyMarked && !profile.resources[r.resourceName]) return false;
      return true;
    });
  }, [spec, filter, onlyMarked, profile]);

  if (!spec) return null;

  return (
    <div className="rail">
      <div className="rail-header">
        <input
          type="text"
          placeholder={`Filter ${spec.resources.length} resources…`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <label className="toggle">
          <input type="checkbox" checked={onlyMarked} onChange={(e) => setOnlyMarked(e.target.checked)} />
          Show only marked
        </label>
      </div>
      {resources.map((r) => (
        <div
          key={r.resourceName}
          className={`resource-item ${selected === r.resourceName ? 'active' : ''}`}
          onClick={() => selectResource(r.resourceName)}
        >
          <span className="name">{r.resourceName}</span>
          <CoverageBadge status={profile.resources[r.resourceName]?.usage} />
        </div>
      ))}
    </div>
  );
}
