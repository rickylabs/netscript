/**
 * Pure `ldapts` filter AST builders for Active Directory / Samba AD queries.
 *
 * Every filter is constructed strictly from `ldapts` filter classes (`AndFilter`, `OrFilter`,
 * `NotFilter`, `EqualityFilter`, `SubstringFilter`, `PresenceFilter`, `ExtensibleFilter`).
 * Raw LDAP filter string concatenation is never used anywhere in this package.
 *
 * @module
 */

import { Buffer } from 'node:buffer';
import {
  AndFilter,
  EqualityFilter,
  ExtensibleFilter,
  type Filter,
  NotFilter,
  OrFilter,
  PresenceFilter,
  SubstringFilter,
} from 'ldapts';
import type { UserLookup } from '@netscript/plugin-directory-core';
import {
  LDAP_MATCHING_RULE_IN_CHAIN_OID,
  type ResolvedLdapAttributeMap,
  tryEncodeAdObjectGuid,
} from '../domain/mod.ts';

function buildUserClassFilter(
  attributes: ResolvedLdapAttributeMap,
  excludeServiceBuiltins: boolean,
): Filter {
  const filters: Filter[] = [
    new EqualityFilter({ attribute: 'objectClass', value: attributes.userObjectClass }),
    new PresenceFilter({ attribute: attributes.immutableId }),
  ];
  for (const excluded of attributes.excludeUserObjectClasses) {
    filters.push(
      new NotFilter({
        filter: new EqualityFilter({ attribute: 'objectClass', value: excluded }),
      }),
    );
  }
  if (excludeServiceBuiltins && attributes.userObjectClass.toLowerCase() === 'user') {
    filters.push(
      new NotFilter({
        filter: new EqualityFilter({ attribute: attributes.username, value: 'krbtgt' }),
      }),
    );
  }
  return new AndFilter({ filters });
}

function buildGroupClassFilter(attributes: ResolvedLdapAttributeMap): Filter {
  return new AndFilter({
    filters: [
      new EqualityFilter({ attribute: 'objectClass', value: attributes.groupObjectClass }),
      new PresenceFilter({ attribute: attributes.immutableId }),
    ],
  });
}

function uniqueAttributes(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

/**
 * Builds an injection-safe `ldapts` filter AST for searching users by substring across
 * `displayName`, `userPrincipalName`, `mail`, and `username` (`sAMAccountName`).
 *
 * Excludes AD computer accounts and the built-in `krbtgt` account and requires a present
 * `immutableId` (`objectGUID`). `SubstringFilter` encodes every character (including `*`, `(`,
 * `)`, `\`, and `\0`) literally via BER octet strings.
 */
export function buildUserSearchFilter(
  searchText: string,
  attributes: ResolvedLdapAttributeMap,
): Filter {
  const searchFields = uniqueAttributes([
    attributes.displayName,
    attributes.userPrincipalName,
    attributes.mail,
    attributes.username,
  ]);
  const matchAnyField = new OrFilter({
    filters: searchFields.map((attribute) =>
      new SubstringFilter({
        attribute,
        any: [searchText],
      })
    ),
  });
  return new AndFilter({
    filters: [buildUserClassFilter(attributes, true), matchAnyField],
  });
}

/**
 * Builds an injection-safe `ldapts` filter AST for searching groups by substring across
 * group display name (`cn`), `displayName`, `description`, and `mail`.
 */
export function buildGroupSearchFilter(
  searchText: string,
  attributes: ResolvedLdapAttributeMap,
): Filter {
  const searchFields = uniqueAttributes([
    attributes.groupDisplayName,
    attributes.displayName,
    attributes.groupDescription,
    attributes.mail,
  ]);
  const matchAnyField = new OrFilter({
    filters: searchFields.map((attribute) =>
      new SubstringFilter({
        attribute,
        any: [searchText],
      })
    ),
  });
  return new AndFilter({
    filters: [buildGroupClassFilter(attributes), matchAnyField],
  });
}

/**
 * Builds an injection-safe `ldapts` filter AST for looking up a single user by immutable
 * `objectGUID` (binary) or by secondary attribute (`userPrincipalName`, `mail`, or `username`).
 *
 * Returns `undefined` when looking up by an invalid UUID `immutableId` or a blank secondary value.
 */
export function buildUserLookupFilter(
  lookup: UserLookup,
  attributes: ResolvedLdapAttributeMap,
): Filter | undefined {
  let selector: Filter;
  if ('immutableId' in lookup && lookup.immutableId !== undefined) {
    const guidBytes = tryEncodeAdObjectGuid(lookup.immutableId);
    if (!guidBytes) {
      return undefined;
    }
    selector = new EqualityFilter({
      attribute: attributes.immutableId,
      value: Buffer.from(guidBytes),
    });
  } else if ('userPrincipalName' in lookup && lookup.userPrincipalName !== undefined) {
    if (lookup.userPrincipalName.trim().length === 0) {
      return undefined;
    }
    selector = new EqualityFilter({
      attribute: attributes.userPrincipalName,
      value: lookup.userPrincipalName,
    });
  } else if ('mail' in lookup && lookup.mail !== undefined) {
    if (lookup.mail.trim().length === 0) {
      return undefined;
    }
    selector = new EqualityFilter({
      attribute: attributes.mail,
      value: lookup.mail,
    });
  } else if ('username' in lookup && lookup.username !== undefined) {
    if (lookup.username.trim().length === 0) {
      return undefined;
    }
    selector = new EqualityFilter({
      attribute: attributes.username,
      value: lookup.username,
    });
  } else {
    return undefined;
  }
  return new AndFilter({
    filters: [buildUserClassFilter(attributes, false), selector],
  });
}

/**
 * Builds a bounded `ldapts` filter AST for locating a user's AD primary group by binary `objectSid`.
 */
export function buildPrimaryGroupBySidFilter(
  primaryGroupSid: Uint8Array,
  attributes: ResolvedLdapAttributeMap,
): Filter {
  return new AndFilter({
    filters: [
      buildGroupClassFilter(attributes),
      new EqualityFilter({
        attribute: attributes.objectSid,
        value: Buffer.from(primaryGroupSid),
      }),
    ],
  });
}

/**
 * Builds a bounded `ldapts` filter AST testing membership in an explicit batch of candidate group
 * GUIDs using `LDAP_MATCHING_RULE_IN_CHAIN` (`1.2.840.113556.1.4.1941`) when supported, or direct
 * `member` equality otherwise.
 *
 * When `primaryGroupDn` is provided and `supportsInChainMatching` is enabled, the filter also
 * matches candidate groups that transitively contain the user's primary group.
 */
export function buildBoundedMembershipFilter(
  params: Readonly<{
    userDn: string;
    primaryGroupDn?: string;
    candidateGroupGuids: readonly Uint8Array[];
    supportsInChainMatching: boolean;
    attributes: ResolvedLdapAttributeMap;
  }>,
): Filter {
  const { userDn, primaryGroupDn, candidateGroupGuids, supportsInChainMatching, attributes } =
    params;

  const candidateFilters: Filter[] = candidateGroupGuids.map((guidBytes) =>
    new EqualityFilter({
      attribute: attributes.immutableId,
      value: Buffer.from(guidBytes),
    })
  );
  const candidateSelector: Filter = candidateFilters.length === 1
    ? candidateFilters[0]!
    : new OrFilter({ filters: candidateFilters });

  let membershipPredicate: Filter;
  if (supportsInChainMatching) {
    const userInChain = new ExtensibleFilter({
      matchType: attributes.member,
      rule: LDAP_MATCHING_RULE_IN_CHAIN_OID,
      value: userDn,
    });
    if (primaryGroupDn !== undefined && primaryGroupDn.length > 0) {
      membershipPredicate = new OrFilter({
        filters: [
          userInChain,
          new ExtensibleFilter({
            matchType: attributes.member,
            rule: LDAP_MATCHING_RULE_IN_CHAIN_OID,
            value: primaryGroupDn,
          }),
        ],
      });
    } else {
      membershipPredicate = userInChain;
    }
  } else {
    membershipPredicate = new EqualityFilter({
      attribute: attributes.member,
      value: userDn,
    });
  }

  return new AndFilter({
    filters: [buildGroupClassFilter(attributes), candidateSelector, membershipPredicate],
  });
}

/**
 * Builds a minimal `(objectClass=*)` presence filter for RootDSE and base-DN health probes.
 */
export function buildHealthProbeFilter(): Filter {
  return new PresenceFilter({ attribute: 'objectClass' });
}
