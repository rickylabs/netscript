import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import {
  AndFilter,
  EqualityFilter,
  ExtensibleFilter,
  Filter,
  OrFilter,
  PresenceFilter,
  SubstringFilter,
} from 'ldapts';
import {
  encodeAdObjectGuid,
  LDAP_MATCHING_RULE_IN_CHAIN_OID,
  resolveLdapConfig,
} from '../domain/mod.ts';
import {
  buildBoundedMembershipFilter,
  buildGroupSearchFilter,
  buildHealthProbeFilter,
  buildPrimaryGroupBySidFilter,
  buildUserLookupFilter,
  buildUserSearchFilter,
} from './ldap-filters.ts';

const DEFAULT_ATTRS = resolveLdapConfig({
  directoryInstance: 'corp-example',
  urls: ['ldaps://dc1.example.test:636'],
  baseDn: 'DC=example,DC=test',
  bindDn: 'CN=svc-dir,DC=example,DC=test',
  bindPasswordFile: '/run/secrets/ldap_bind_password',
}).attributes;

Deno.test('search filters use ldapts filter AST classes and escape hostile characters', () => {
  const hostile = '*)(|(objectClass=*)\\admin\0tail';
  const userFilter = buildUserSearchFilter(hostile, DEFAULT_ATTRS);
  assertInstanceOf(userFilter, AndFilter);
  const orClause = userFilter.filters[1];
  assertInstanceOf(orClause, OrFilter);
  for (const sub of orClause.filters) {
    assertInstanceOf(sub, SubstringFilter);
    assertEquals(sub.any, [hostile]);
  }
  const rendered = userFilter.toString();
  assert(rendered.includes('\\2a\\29\\28|\\28objectClass=\\2a\\29\\5cadmin\\00tail'));
  assert(!rendered.includes('(objectClass=*)'));

  const groupFilter = buildGroupSearchFilter('(O*Connor)', DEFAULT_ATTRS);
  assertInstanceOf(groupFilter, AndFilter);
  assert(groupFilter.toString().includes('\\28O\\2aConnor\\29'));
});

Deno.test('user lookup and primary-group filters pass binary Buffers via EqualityFilter', () => {
  const guid = '20000000-0000-4000-8000-000000000001';
  const filter = buildUserLookupFilter(
    { directoryInstance: 'corp-example', immutableId: guid },
    DEFAULT_ATTRS,
  );
  assertInstanceOf(filter, AndFilter);
  const guidClause = filter.filters[1];
  assertInstanceOf(guidClause, EqualityFilter);
  assert(guidClause.value instanceof Uint8Array);
  assertEquals(new Uint8Array(guidClause.value), encodeAdObjectGuid(guid));

  const badGuid = buildUserLookupFilter(
    { directoryInstance: 'corp-example', immutableId: 'not-a-valid-guid' },
    DEFAULT_ATTRS,
  );
  assertEquals(badGuid, undefined);

  const fakeSid = new Uint8Array([1, 2, 0, 0, 0, 0, 0, 5, 21, 0, 0, 0, 1, 2, 0, 0]);
  const sidFilter = buildPrimaryGroupBySidFilter(fakeSid, DEFAULT_ATTRS);
  assertInstanceOf(sidFilter, AndFilter);
  const sidClause = sidFilter.filters[1];
  assertInstanceOf(sidClause, EqualityFilter);
  assert(sidClause.value instanceof Uint8Array);
  assertEquals(new Uint8Array(sidClause.value), fakeSid);
});

Deno.test('bounded membership filter uses LDAP_MATCHING_RULE_IN_CHAIN or direct member equality', () => {
  const g1 = encodeAdObjectGuid('10000000-0000-4000-8000-000000000002');
  const g2 = encodeAdObjectGuid('10000000-0000-4000-8000-000000000003');
  const userDn = 'CN=Alice Example,OU=Users,DC=example,DC=test';
  const primaryGroupDn = 'CN=Domain Users,OU=Groups,DC=example,DC=test';

  const transitive = buildBoundedMembershipFilter({
    userDn,
    primaryGroupDn,
    candidateGroupGuids: [g1, g2],
    supportsInChainMatching: true,
    attributes: DEFAULT_ATTRS,
  });
  assertInstanceOf(transitive, AndFilter);
  const pred = transitive.filters[2];
  assertInstanceOf(pred, OrFilter);
  assertInstanceOf(pred.filters[0], ExtensibleFilter);
  assertEquals(pred.filters[0].rule, LDAP_MATCHING_RULE_IN_CHAIN_OID);
  assertEquals(pred.filters[0].matchType, 'member');
  assertEquals(pred.filters[0].value, userDn);
  assertInstanceOf(pred.filters[1], ExtensibleFilter);
  assertEquals(pred.filters[1].value, primaryGroupDn);

  const direct = buildBoundedMembershipFilter({
    userDn,
    candidateGroupGuids: [g1],
    supportsInChainMatching: false,
    attributes: DEFAULT_ATTRS,
  });
  assertInstanceOf(direct, AndFilter);
  assertInstanceOf(direct.filters[2], EqualityFilter);
  assertEquals(direct.filters[2].attribute, 'member');
  assertEquals(direct.filters[2].value, userDn);

  const probe = buildHealthProbeFilter();
  assertInstanceOf(probe, PresenceFilter);
  assert(probe instanceof Filter);
});
