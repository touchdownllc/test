import { useState } from 'react';
import { useProfileStore } from '../state/profileStore';

export function ValidationBanner() {
  const validation = useProfileStore((s) => s.validation);
  const [open, setOpen] = useState(false);

  if (validation.issues.length === 0) return null;

  return (
    <div className="val-panel">
      <div className="head" onClick={() => setOpen((o) => !o)}>
        {validation.errorCount} error(s), {validation.warningCount} warning(s){' '}
        {open ? '▾' : '▸'}
      </div>
      {open &&
        validation.issues.map((i, idx) => (
          <div key={idx} className={`val-issue ${i.severity}`}>
            <div>{i.message}</div>
            <div className="path">{i.path}</div>
          </div>
        ))}
    </div>
  );
}
