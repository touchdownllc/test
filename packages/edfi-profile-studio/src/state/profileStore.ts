import { create } from 'zustand';
import {
  emptyProfile,
  parseProfile,
  ProfileModel,
  PropertyUsage,
  ResourceUsage,
  serializeProfile,
  SpecIndex,
  UsageStatus,
  validateProfile,
  ValidationResult,
} from 'edfi-profile-core';
import { adaptSpec, LoadedSpec } from '../lib/specAdapter';

interface ProfileState {
  spec: LoadedSpec | null;
  profile: ProfileModel;
  selectedResource: string | null;
  validation: ValidationResult;
  error: string | null;

  loadSpec: (text: string) => void;
  importProfile: (text: string) => void;
  selectResource: (name: string | null) => void;
  setResourceField: (name: string, patch: Partial<ResourceUsage>) => void;
  setPropertyField: (resource: string, property: string, patch: Partial<PropertyUsage>) => void;
  clearPropertyAnnotation: (resource: string, property: string) => void;
  exportYaml: () => string;
}

const EMPTY_VALIDATION: ValidationResult = { issues: [], errorCount: 0, warningCount: 0 };

function recompute(spec: LoadedSpec | null, profile: ProfileModel): ValidationResult {
  if (!spec) return EMPTY_VALIDATION;
  return validateProfile(profile, new SpecIndex(spec.doc));
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  spec: null,
  profile: emptyProfile('NewProfile', '0.1.0'),
  selectedResource: null,
  validation: EMPTY_VALIDATION,
  error: null,

  loadSpec: (text) => {
    try {
      const spec = adaptSpec(text);
      set((s) => ({
        spec,
        error: null,
        selectedResource: spec.resources[0]?.resourceName ?? null,
        validation: recompute(spec, s.profile),
      }));
    } catch (e) {
      set({ error: `Could not load spec: ${(e as Error).message}` });
    }
  },

  importProfile: (text) => {
    try {
      const profile = parseProfile(text);
      set((s) => ({ profile, error: null, validation: recompute(s.spec, profile) }));
    } catch (e) {
      set({ error: `Could not import profile: ${(e as Error).message}` });
    }
  },

  selectResource: (name) => set({ selectedResource: name }),

  setResourceField: (name, patch) => {
    const profile = structuredClone(get().profile);
    const existing = profile.resources[name] ?? { usage: 'in-use' as UsageStatus };
    profile.resources[name] = { ...existing, ...patch };
    set((s) => ({ profile, validation: recompute(s.spec, profile) }));
  },

  setPropertyField: (resource, property, patch) => {
    const profile = structuredClone(get().profile);
    const res = profile.resources[resource] ?? { usage: 'in-use' as UsageStatus };
    res.properties = res.properties ?? {};
    const existing = res.properties[property] ?? { usage: 'in-use' as UsageStatus };
    res.properties[property] = { ...existing, ...patch };
    profile.resources[resource] = res;
    set((s) => ({ profile, validation: recompute(s.spec, profile) }));
  },

  clearPropertyAnnotation: (resource, property) => {
    const profile = structuredClone(get().profile);
    const res = profile.resources[resource];
    if (res?.properties) {
      delete res.properties[property];
      if (Object.keys(res.properties).length === 0) delete res.properties;
    }
    set((s) => ({ profile, validation: recompute(s.spec, profile) }));
  },

  exportYaml: () => serializeProfile(get().profile),
}));
