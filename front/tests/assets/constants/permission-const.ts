import type { Role } from 'common/api/osrdEditoastApi';

import { readJsonFile } from '../../utils/file-utils';

/** Group whose only member is E2E_USERS.groupMember, created during the global setup */
export const E2E_GROUP = 'e2e-group';

/**
 * An e2e test user: `name` is searched in the front, `identity` is sent in the `x-impersonate`
 * header of the API requests. `roles` and `groups` are given at creation.
 */
export type E2EUser = {
  name: string;
  identity: string;
  roles: readonly Role[];
  groups?: readonly string[];
};

/**
 * E2e test users, created through the editoast API during the global setup.
 * Names must not match each other's search, so they are prefixed with `E2E` and use distinct words.
 */
export const E2E_USERS = {
  /** OperationalStudies role only */
  projectOutsider: {
    name: 'E2E Project Outsider',
    identity: 'e2e/project-outsider',
    roles: ['OperationalStudies'],
  },
  /** Stdcm role only */
  stdcmOnly: {
    name: 'E2E Stdcm Only',
    identity: 'e2e/stdcm-only',
    roles: ['Stdcm'],
  },
  /** No role */
  noRole: { name: 'E2E No Role', identity: 'e2e/no-role', roles: [] },
  /** OperationalStudies and Stdcm roles, creates the infrastructures and rolling stocks */
  owner: {
    name: 'E2E Owner',
    identity: 'e2e/owner',
    roles: ['OperationalStudies', 'Stdcm'],
  },
  /** OperationalStudies and Stdcm roles, receives the write grant */
  writer: {
    name: 'E2E Writer',
    identity: 'e2e/writer',
    roles: ['OperationalStudies', 'Stdcm'],
  },
  /** OperationalStudies and Stdcm roles, receives the read grant */
  reader: {
    name: 'E2E Reader',
    identity: 'e2e/reader',
    roles: ['OperationalStudies', 'Stdcm'],
  },
  /**
   * OperationalStudies and Stdcm roles, receives the restricted read grant on the rolling stocks.
   * Also keeps a restricted read grant on the e2e infra once the rolling stock permissions spec ran
   */
  limited: {
    name: 'E2E Limited',
    identity: 'e2e/limited',
    roles: ['OperationalStudies', 'Stdcm'],
  },
  /**
   * OperationalStudies and Stdcm roles, receives no grant on the rolling stocks.
   * Keeps a restricted read grant on the e2e infra once the rolling stock permissions spec ran
   */
  stranger: {
    name: 'E2E Stranger',
    identity: 'e2e/stranger',
    roles: ['OperationalStudies', 'Stdcm'],
  },
  /** OperationalStudies role, only gets access through E2E_GROUP */
  groupMember: {
    name: 'E2E Group Member',
    identity: 'e2e/group-member',
    roles: ['OperationalStudies'],
    groups: [E2E_GROUP],
  },
} as const satisfies Record<string, E2EUser>;

const {
  authorization: { grants, yourGrant },
} = readJsonFile<{
  authorization: { grants: Record<string, string>; yourGrant: string };
}>('public/locales/fr/translation.json');

/** Labels of the grants, as displayed by the grant manager */
export const GRANT_LABELS = {
  restrictedRead: grants.restricted_read,
  read: grants.read,
  write: grants.edit,
  full: grants.full,
};

export const getUserGrantText = (grantLabel: string) => yourGrant.replace('{{grant}}', grantLabel);
