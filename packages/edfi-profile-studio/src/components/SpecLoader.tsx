import { useState } from 'react';
import { useProfileStore } from '../state/profileStore';
import sampleSpec from '../samples/ed-fi-5.2.yaml?raw';

export function SpecLoader() {
  const loadSpec = useProfileStore((s) => s.loadSpec);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function fetchUrl() {
    if (!url) return;
    setBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      loadSpec(await res.text());
    } catch (e) {
      // CORS is the common failure here; nudge the user toward file upload.
      useProfileStore.setState({
        error: `Could not fetch "${url}" (${(e as Error).message}). If this is a CORS error, download the spec and upload the file instead.`,
      });
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(loadSpec);
  }

  return (
    <div className="loader-row">
      <button onClick={() => loadSpec(sampleSpec)}>Load bundled Ed-Fi 5.2 sample</button>
      <input
        type="text"
        placeholder="…or paste a Swagger/OpenAPI URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button className="secondary" onClick={fetchUrl} disabled={busy}>
        {busy ? 'Fetching…' : 'Fetch URL'}
      </button>
      <label className="secondary" style={{ padding: '7px 14px', border: '1px solid #888', borderRadius: 4, cursor: 'pointer', background: '#fff', fontWeight: 600, fontSize: 13 }}>
        Upload file
        <input type="file" accept=".yaml,.yml,.json" onChange={onFile} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
