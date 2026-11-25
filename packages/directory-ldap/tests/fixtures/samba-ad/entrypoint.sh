#!/bin/sh
# Throwaway unprivileged Alpine Samba AD DC fixture for @netscript/directory-ldap integration tests.
# Uses strictly invented example.test identities and test-only secrets mounted at /fixture.
set -eu

log() { echo "[samba-ad-fixture] $*"; }

apk add --no-cache samba-dc krb5 ldb-tools py3-cryptography py3-dnspython py3-markdown py3-setproctitle >/dev/null 2>&1
log "samba version: $(samba --version)"

rm -f /etc/samba/smb.conf
samba-tool domain provision \
  --server-role=dc --use-rfc2307 --dns-backend=SAMBA_INTERNAL \
  --realm=EXAMPLE.TEST --domain=EXAMPLE --host-name=dc1 \
  --adminpass="$(cat /fixture/admin_password)" \
  --option="posix:eadb = /var/lib/samba/private/eadb.tdb" \
  --option="acl_xattr:security_acl_name = user.NTACL" >/tmp/provision.log 2>&1 || {
    log "PROVISION FAILED"; tail -40 /tmp/provision.log; exit 1; }

cat > /tmp/extra.conf <<'EOF'
	tls enabled = yes
	tls keyfile = /etc/samba/tls/key.pem
	tls certfile = /etc/samba/tls/cert.pem
	tls cafile = /etc/samba/tls/ca.pem
	posix:eadb = /var/lib/samba/private/eadb.tdb
	acl_xattr:security_acl_name = user.NTACL
	log level = 1
EOF
sed -i '/^\[global\]/r /tmp/extra.conf' /etc/samba/smb.conf
mkdir -p /etc/samba/tls && cp /fixture/tls/*.pem /etc/samba/tls/ && chmod 600 /etc/samba/tls/key.pem

SVC_PW="$(cat /fixture/svc_password)"
USER_PW="$(cat /fixture/user_password)"

mkuser() {
  samba-tool user create "$1" "$USER_PW" --given-name="$2" --surname="$3" --mail-address="$4" >/dev/null
}

samba-tool user create svc-dir "$SVC_PW" >/dev/null
samba-tool user setexpiry svc-dir --noexpiry >/dev/null

mkuser alice Alice Example alice@example.test
mkuser adm-alice Alice Admin alice@example.test
mkuser bob Bob Disabled bob@example.test
mkuser carol Carol Expired carol@example.test
mkuser dana Dana Example dana@example.test
mkuser erin Erin OConnor erin@example.test
mkuser frank Frank Example frank@example.test
mkuser zero Zero Expiry zero@example.test

samba-tool user disable bob >/dev/null
samba-tool computer create WORKSTATION01 >/dev/null 2>&1 || true

for g in "Eng Parent" "Eng Child" "Eng Leaf" "Finance" "Cycle A" "Cycle B" "All Staff" "Ops Alpha" "Ops Beta" "Ops Gamma" "Ops Delta"; do
  samba-tool group add "$g" >/dev/null
done
samba-tool group addmembers "Eng Leaf" alice >/dev/null
samba-tool group addmembers "Eng Child" "Eng Leaf" >/dev/null
samba-tool group addmembers "Eng Parent" "Eng Child" >/dev/null
samba-tool group addmembers "Eng Parent" bob,carol >/dev/null
samba-tool group addmembers "Finance" bob,carol,dana >/dev/null
samba-tool group addmembers "Cycle B" alice >/dev/null
samba-tool group addmembers "Cycle A" "Cycle B" >/dev/null
samba-tool group addmembers "Cycle B" "Cycle A" >/dev/null
samba-tool group addmembers "All Staff" "Domain Users" >/dev/null

SAM=/var/lib/samba/private/sam.ldb
export LDB_MODULES_PATH="${LDB_MODULES_PATH:-/usr/lib/samba/ldb}"
cat > /tmp/mod.ldif <<'EOF'
dn: CN=Carol Expired,CN=Users,DC=example,DC=test
changetype: modify
replace: accountExpires
accountExpires: 134220672000000000

dn: CN=Dana Example,CN=Users,DC=example,DC=test
changetype: modify
replace: accountExpires
accountExpires: 134432352000000000

dn: CN=Zero Expiry,CN=Users,DC=example,DC=test
changetype: modify
replace: accountExpires
accountExpires: 0

dn: CN=Erin OConnor,CN=Users,DC=example,DC=test
changetype: modify
replace: displayName
displayName: Erin 'O*Connor' "Ops" \ (Test)
EOF
ldbmodify -H "$SAM" /tmp/mod.ldif >/dev/null

# Seed bulk users (> default page size) to exercise bounded RFC 2696 paging on the wire.
{
  echo "dn: OU=Bulk,DC=example,DC=test"
  echo "objectClass: organizationalUnit"
  echo
  i=1
  while [ "$i" -le "${BULK_USERS:-320}" ]; do
    n=$(printf '%04d' "$i")
    echo "dn: CN=bulk$n,OU=Bulk,DC=example,DC=test"
    echo "objectClass: user"
    echo "sAMAccountName: bulk$n"
    echo "displayName: Bulk Staff $n"
    echo "userPrincipalName: bulk$n@example.test"
    echo
    i=$((i + 1))
  done
} > /tmp/bulk.ldif
ldbadd -H "$SAM" /tmp/bulk.ldif >/dev/null

log "READY"
exec samba --interactive --debug-stdout --no-process-group
