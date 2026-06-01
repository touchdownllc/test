import { useProfileStore } from './state/profileStore';
import { SpecLoader } from './components/SpecLoader';
import { ProfileLoader } from './components/ProfileLoader';
import { ResourceList } from './components/ResourceList';
import { ResourceDetail } from './components/ResourceDetail';
import { ProfileExporter } from './components/ProfileExporter';
import { ValidationBanner } from './components/ValidationBanner';

export function App() {
  const spec = useProfileStore((s) => s.spec);
  const profile = useProfileStore((s) => s.profile);
  const error = useProfileStore((s) => s.error);

  function setProfileMeta(patch: Partial<{ name: string; version: string }>) {
    useProfileStore.setState((s) => ({
      profile: { ...s.profile, profile: { ...s.profile.profile, ...patch } },
    }));
  }

  return (
    <div>
      <div className="topbar">
        <h1>Ed-Fi Profile Studio</h1>
        {spec && (
          <span className="meta">
            {spec.title} · {spec.version} · {spec.resources.length} resources
          </span>
        )}
        <div className="spacer" />
        <input
          type="text"
          aria-label="profile name"
          value={profile.profile.name}
          onChange={(e) => setProfileMeta({ name: e.target.value })}
          style={{ width: 160 }}
        />
        <input
          type="text"
          aria-label="profile version"
          value={profile.profile.version}
          onChange={(e) => setProfileMeta({ version: e.target.value })}
          style={{ width: 110 }}
        />
        <ProfileExporter />
      </div>

      <div style={{ padding: '10px 18px', display: 'flex', gap: 24, flexWrap: 'wrap', borderBottom: '1px solid var(--line)', background: '#fff' }}>
        <SpecLoader />
        <ProfileLoader />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="layout">
        <ResourceList />
        <div className="detail">
          <ResourceDetail />
        </div>
      </div>

      <ValidationBanner />
    </div>
  );
}
