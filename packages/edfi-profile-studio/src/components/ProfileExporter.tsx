import { useProfileStore } from '../state/profileStore';

export function ProfileExporter() {
  const exportYaml = useProfileStore((s) => s.exportYaml);
  const profileName = useProfileStore((s) => s.profile.profile.name);

  function download() {
    const yaml = exportYaml();
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileName || 'profile'}.profile.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return <button onClick={download}>Export profile.yaml</button>;
}
