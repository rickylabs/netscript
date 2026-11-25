# Throwaway Samba AD DC test fixture (`example.test`)

Provisions an unprivileged Alpine Linux `samba-dc` container on `DC=example,DC=test` with strict
LDAPS/StartTLS certificates, nested and cyclic groups, `All Staff` nesting `Domain Users`, duplicate
`mail` accounts (`alice` + `adm-alice`), disabled/expired users, hostile display-name characters,
and 320 bulk users for verifying bounded RFC 2696 paging.

## Usage

1. Generate a throwaway CA and server certificate for `dc1.example.test` plus temporary password
   files (`admin_password`, `svc_password`, `user_password`) in a scratch directory `$FIXTURE_DIR`.
2. Start the container (takes ~45 s to provision):

   ```bash
   docker run --rm -d --name netscript-samba-ad-test \
     -p 127.0.0.1:6360:636 -p 127.0.0.1:3890:389 \
     -v "$FIXTURE_DIR:/fixture:ro" \
     -v "$(pwd)/packages/directory-ldap/tests/fixtures/samba-ad/entrypoint.sh:/entrypoint.sh:ro" \
     alpine:3.22 sh /entrypoint.sh
   ```

3. Wait for `[samba-ad-fixture] READY` in `docker logs netscript-samba-ad-test`, then run:

   ```bash
   NETSCRIPT_LDAP_INTEGRATION_URL=ldaps://127.0.0.1:6360 \
   NETSCRIPT_LDAP_INTEGRATION_SERVERNAME=dc1.example.test \
   NETSCRIPT_LDAP_INTEGRATION_BASE_DN=DC=example,DC=test \
   NETSCRIPT_LDAP_INTEGRATION_BIND_DN=CN=svc-dir,CN=Users,DC=example,DC=test \
   NETSCRIPT_LDAP_INTEGRATION_BIND_PASSWORD_FILE="$FIXTURE_DIR/svc_password" \
   NETSCRIPT_LDAP_INTEGRATION_CA_FILE="$FIXTURE_DIR/tls/ca.pem" \
   deno test --allow-read --allow-env --allow-net packages/directory-ldap/tests/samba_integration_test.ts
   ```

4. Tear down with `docker rm -f netscript-samba-ad-test`.
