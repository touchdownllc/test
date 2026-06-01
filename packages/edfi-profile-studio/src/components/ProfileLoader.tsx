import { useProfileStore } from '../state/profileStore';
import sampleProfile from '../samples/sample-lea.profile.yaml?raw';

export function ProfileLoader() {
  const importProfile = useProfileStore((s) => s.importProfile);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(importProfile);
  }

  return (
    <div className="loader-row">
      <button className="secondary" onClick={() => importProfile(sampleProfile)}>
        Load Sample LEA profile
      </button>
      <label className="secondary" style={{ padding: '7px 14px', border: '1px solid #888', borderRadius: 4, cursor: 'pointer', background: '#fff', fontWeight: 600, fontSize: 13 }}>
        Import profile.yaml
        <input type="file" accept=".yaml,.yml" onChange={onFile} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
