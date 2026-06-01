import { UsageStatus } from 'edfi-profile-core';
import { useProfileStore } from '../state/profileStore';
import { UsagePicker } from './UsagePicker';

// Properties can be in-use / partial / not-populated / planned, but never
// "not-implemented" — that status only makes sense for a whole resource.
const PROPERTY_STATUSES: readonly UsageStatus[] = ['in-use', 'partial', 'not-populated', 'planned'];

export function ResourceDetail() {
  const spec = useProfileStore((s) => s.spec);
  const profile = useProfileStore((s) => s.profile);
  const selected = useProfileStore((s) => s.selectedResource);
  const validation = useProfileStore((s) => s.validation);
  const setResourceField = useProfileStore((s) => s.setResourceField);
  const setPropertyField = useProfileStore((s) => s.setPropertyField);
  const clearPropertyAnnotation = useProfileStore((s) => s.clearPropertyAnnotation);

  if (!spec) return <div className="empty">Load a Swagger spec to begin.</div>;
  const node = spec.resources.find((r) => r.resourceName === selected);
  if (!node) return <div className="empty">Select a resource from the list.</div>;

  const resource = profile.resources[node.resourceName];
  const resourceIssues = validation.issues.filter((i) =>
    i.path.startsWith(`resources.${node.resourceName}`),
  );

  return (
    <div>
      <div className="panel">
        <h2>{node.resourceName}</h2>
        <div className="body">
          {node.description && <p className="hint">{node.description}</p>}
          <div className="field-row">
            <div className="field">
              <label>Usage status</label>
              <UsagePicker
                value={resource?.usage}
                includeUnset
                onChange={(usage) =>
                  usage
                    ? setResourceField(node.resourceName, { usage })
                    : useProfileStore.setState((s) => {
                        const p = structuredClone(s.profile);
                        delete p.resources[node.resourceName];
                        return { profile: p };
                      })
                }
              />
            </div>
            <div className="field">
              <label>Coverage (0–1)</label>
              <input
                type="text"
                className="coverage-input"
                value={resource?.coverage ?? ''}
                onChange={(e) =>
                  setResourceField(node.resourceName, {
                    coverage: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="field">
              <label>Refresh cadence</label>
              <input
                type="text"
                value={resource?.refreshCadence ?? ''}
                placeholder="nightly"
                onChange={(e) =>
                  setResourceField(node.resourceName, { refreshCadence: e.target.value || undefined })
                }
              />
            </div>
          </div>
          <div className="field">
            <label>Populated by (comma-separated source systems)</label>
            <input
              type="text"
              value={resource?.populatedBy?.join(', ') ?? ''}
              placeholder="Infinite Campus SIS"
              onChange={(e) =>
                setResourceField(node.resourceName, {
                  populatedBy: e.target.value
                    ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    : undefined,
                })
              }
            />
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea
              rows={2}
              value={resource?.notes ?? ''}
              onChange={(e) => setResourceField(node.resourceName, { notes: e.target.value || undefined })}
            />
          </div>
          {resource?.usage === 'not-implemented' && (
            <div className="field">
              <label>Reason (why this resource is not implemented)</label>
              <input
                type="text"
                value={resource?.reason ?? ''}
                onChange={(e) => setResourceField(node.resourceName, { reason: e.target.value || undefined })}
              />
            </div>
          )}

          {resourceIssues.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {resourceIssues.map((i, idx) => (
                <div key={idx} className={`val-issue ${i.severity}`}>
                  <strong>{i.severity}:</strong> {i.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {resource?.usage !== 'not-implemented' && (
        <div className="panel">
          <h2>Properties ({node.properties.length})</h2>
          <div className="body">
            <table className="props">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Req</th>
                  <th>Status</th>
                  <th>Coverage</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {node.properties.map((p) => {
                  const ann = resource?.properties?.[p.name];
                  return (
                    <tr key={p.name}>
                      <td>
                        <code>{p.name}</code>
                      </td>
                      <td>{p.type}</td>
                      <td>{p.requiredInSpec ? <span className="req-dot" title="Required in spec">●</span> : ''}</td>
                      <td>
                        <UsagePicker
                          value={ann?.usage}
                          includeUnset
                          options={PROPERTY_STATUSES}
                          onChange={(usage) =>
                            usage
                              ? setPropertyField(node.resourceName, p.name, { usage })
                              : clearPropertyAnnotation(node.resourceName, p.name)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="coverage-input"
                          value={ann?.coverage ?? ''}
                          onChange={(e) =>
                            setPropertyField(node.resourceName, p.name, {
                              coverage: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={ann?.source ?? ''}
                          onChange={(e) =>
                            setPropertyField(node.resourceName, p.name, {
                              source: e.target.value || undefined,
                            })
                          }
                        />
                      </td>
                      <td>
                        <label style={{ fontSize: 11, whiteSpace: 'nowrap' }} title="Required by this implementation">
                          <input
                            type="checkbox"
                            checked={ann?.requiredByImplementation ?? false}
                            onChange={(e) =>
                              setPropertyField(node.resourceName, p.name, {
                                requiredByImplementation: e.target.checked || undefined,
                              })
                            }
                          />{' '}
                          req-impl
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
