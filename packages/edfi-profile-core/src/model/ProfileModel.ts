import { UnannotatedPropertyStatus, UsageStatus } from './UsageStatus';

/**
 * Internal representation of an implementation usage profile.
 *
 * This is the single source of truth for profile semantics, shared by the
 * MetaEd plugin generators (Track A) and the Profile Studio (Track B). The
 * YAML parser produces this shape; the serializer round-trips it back.
 */

export interface ProfilePublisher {
  name?: string;
  contact?: string;
}

export interface ProfileExtends {
  /** Data Standard the profile is written against, e.g. "Ed-Fi-Model". */
  dataStandard: string;
  /** Data Standard version, e.g. "5.2.0". */
  version: string;
}

export interface ProfileMeta {
  name: string;
  version: string;
  description?: string;
  extends?: ProfileExtends;
  publisher?: ProfilePublisher;
}

export interface ProfileDefaults {
  unannotatedPropertyStatus: UnannotatedPropertyStatus;
}

export interface PropertyUsage {
  usage: UsageStatus;
  /** Fraction of records where the field is populated (0..1). */
  coverage?: number;
  /** Specific source field, e.g. "SIS.Student.DOB". */
  source?: string;
  /** Field is optional in the spec but mandatory in this implementation. */
  requiredByImplementation?: boolean;
  notes?: string;
  /** Why a field is not-populated / not-implemented. */
  reason?: string;
}

export interface ResourceUsage {
  usage: UsageStatus;
  /** Source systems populating the resource. */
  populatedBy?: string[];
  /** Free text refresh cadence: realtime, hourly, nightly, weekly, etc. */
  refreshCadence?: string;
  coverage?: number;
  notes?: string;
  reason?: string;
  /** Property-level annotations keyed by property name. */
  properties?: Record<string, PropertyUsage>;
}

export interface ProfileModel {
  profile: ProfileMeta;
  defaults: ProfileDefaults;
  /** Resource annotations keyed by resource name (e.g. "Student"). */
  resources: Record<string, ResourceUsage>;
}

export const DEFAULT_UNANNOTATED_PROPERTY_STATUS: UnannotatedPropertyStatus = 'unknown';

export function emptyProfile(name = 'NewProfile', version = '0.1.0'): ProfileModel {
  return {
    profile: { name, version },
    defaults: { unannotatedPropertyStatus: DEFAULT_UNANNOTATED_PROPERTY_STATUS },
    resources: {},
  };
}
