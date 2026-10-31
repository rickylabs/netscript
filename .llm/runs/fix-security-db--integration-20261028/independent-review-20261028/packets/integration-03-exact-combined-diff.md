# SAME-session integration exact-combined-diff part3
HEAD88ae6fcacd36573b2f2f6244f4bebc31e49fc5e5; ordered full-content fragment.

-    "@better-auth/utils@0.4.2": {
-      "integrity": "sha512-AUxrvu+HaaODsUyzDxFgwd/8RZ1yZaYo42LXKSrU2oGgR38pS1ij8nqQKNgtTWoYGpNevNXtCfgTy6loHveW9A==",
+    "@better-auth/utils@0.5.1": {
+      "integrity": "sha512-WETqw5vQ52uQ/xwWR4E8rTgT6fDEr/wnS+otDNkBCa/69281FCF32OKDdQUcahMCnjsvqXBNiEvAQHFB0EVRRg==",
       "dependencies": [
-        "@noble/hashes@2.2.0"
+        "@noble/hashes@2.4.0"
       ]
     },
-    "@better-fetch/fetch@1.3.1": {
-      "integrity": "sha512-ABkD1WhyfPZprKRQI3bhATjeiFuNWC9PXhfGWqL+sg/gKrM977oFrYkdb4msM3hgUGonr7KlOsOFT5TU2rht9g=="
+    "@better-fetch/fetch@1.3.3": {
+      "integrity": "sha512-U6SlDt/GUWtK2JAxS/NhdoYTEim+EL1G5byz2TUj83KjLZBUpYzb5SmX0aXaCnbGkAjFKnV/o/0+cyXMbEcqqg=="
     },
     "@bundled-es-modules/deepmerge@4.3.2": {
       "integrity": "sha512-q8doe7ndrY2IolUOFIn0A0++JBX38pMhN7kFhTF4cnjIcILf6X6H2yWczInyv8ZFdR0lrE8088X8XS5efxXz8A==",
@@ -1309,14 +1308,14 @@
     "@neophi/sieve-cache@1.5.0": {
       "integrity": "sha512-9T3nD5q51X1d4QYW6vouKW9hBSb2Tb/wB/2XoTr4oP5SCGtp3a7aTHHewQFylred1B21/Bhev6gy4x01FPBcbQ=="
     },
-    "@noble/ciphers@2.2.0": {
-      "integrity": "sha512-Z6pjIZ/8IJcCGzb2S/0Px5J81yij85xASuk1teLNeg75bfT07MV3a/O2Mtn1I2se43k3lkVEcFaR10N4cgQcZA=="
+    "@noble/ciphers@2.4.0": {
+      "integrity": "sha512-AnjFn0Jv92laAkvMrghlFZq4qQCIN/4DxFV/eooqtC2YTjB7kBeLMS2T9KJX4Dn+ZVXLOwK0lSgqDtx9gvxtiw=="
     },
     "@noble/hashes@1.4.0": {
       "integrity": "sha512-V1JJ1WTRUqHHrOSh597hURcMqVKVGL/ea3kv0gSnEdsEZ0/+VyPghM1lMNGc00z7CIQorSvbKpuJkxvuHbvdbg=="
     },
-    "@noble/hashes@2.2.0": {
-      "integrity": "sha512-IYqDGiTXab6FniAgnSdZwgWbomxpy9FtYvLKs7wCUs2a8RkITG+DFGO1DM9cr+E3/RgADRpFjrKVaJ1z6sjtEg=="
+    "@noble/hashes@2.4.0": {
+      "integrity": "sha512-X5XaVWZIBCT7HHZGm5I7ZQXDwLG+bGXuSrMQAW+7Zvl87h1kmc1ZB1VSRJcpUfoUrGQp4Fkoxm5kZ+Ms+aW+eA=="
     },
     "@opentelemetry/api-logs@0.223.0": {
       "integrity": "sha512-Oepm6etVPFCn0VWB1t833iOTgz1eYBDUPxcrOR/XvwzD1+Ag9VzSPSrrKAFNJ/haatj+8CXbG47pZXvdNQKDJw==",
@@ -1382,7 +1381,8 @@
         "@opentelemetry/resources@2.9.0_@opentelemetry+api@1.9.1",
         "@opentelemetry/sdk-trace",
         "@opentelemetry/semantic-conventions@1.43.0"
-      ]
+      ],
+      "deprecated": true
     },
     "@opentelemetry/sdk-trace@2.9.0_@opentelemetry+api@1.9.1": {
       "integrity": "sha512-sGA19HvtrrSKYsseHphluH6j3p6Xa3fqc7c7y8f/7mYWejc1lyDFcpSdD1kYa50HCLUeEo4zA5bW0pniaPszuw==",
@@ -1451,7 +1451,7 @@
         "@orpc/shared",
         "@orpc/standard-server",
         "json-schema-typed",
-        "rou3"
+        "rou3@0.7.12"
       ]
     },
     "@orpc/otel@1.15.5_@opentelemetry+api@1.9.1_@opentelemetry+instrumentation@0.223.0": {
@@ -2170,8 +2170,8 @@
     "base64-js@1.5.1": {
       "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA=="
     },
-    "better-auth@1.6.20_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_typescript@7.0.2": {
-      "integrity": "sha512-fSpGHGRKiGRiYVd3QTQtuVZ8oxpiSe/7ip0Rpvt/Sy8zQbEbVKUPMOhE0gLXg+FjqTUsIo7582hxUYxtEcqUpA==",
+    "better-auth@1.7.14_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_@opentelemetry+api@1.9.1": {
+      "integrity": "sha512-QxDCI0pOCCHDYmruisKhKyrvOJ6Icv9xg0RA6ZUysfKFXENYwhNNpwUlkE/NmViH2nDMgkKcymmLr55pnpR9vw==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/drizzle-adapter",
@@ -2183,7 +2183,7 @@
         "@better-auth/utils",
         "@better-fetch/fetch",
         "@noble/ciphers",
-        "@noble/hashes@2.2.0",
+        "@noble/hashes@2.4.0",
         "@prisma/client",
         "better-call",
         "defu",
@@ -2202,12 +2202,12 @@
         "react"
       ]
     },
-    "better-call@1.3.6_zod@4.6.5": {
-      "integrity": "sha512-no1jI+h6Bkxs1NVBo4rONbVIzsPjZ8IUu7IHaJBiFwVX1XEQGN8KpHots5fSWmXe9nNyLuLIcgx6WEUcE6EDaA==",
+    "better-call@1.4.4_zod@4.6.5": {
+      "integrity": "sha512-Gq4XdGFy4dmUxFEAX2nj0ycFcFbD9ZWh8YROouZoyXeF1M11TpYbplk0pDByTFF8Wz+MYa6W9052c9m7dD+mfw==",
       "dependencies": [
         "@better-auth/utils",
         "@better-fetch/fetch",
-        "rou3",
+        "rou3@0.9.2",
         "set-cookie-parser",
         "zod@4.6.5"
       ],
@@ -2883,8 +2883,8 @@
     "ky@1.14.3": {
       "integrity": "sha512-9zy9lkjac+TR1c2tG+mkNSVlyOpInnWdSMiue4F+kq8TwJSgv6o8jhLRg8Ho6SnZ9wOYUq/yozts9qQCfk7bIw=="
     },
-    "kysely@0.29.2": {
-      "integrity": "sha512-s6WVJyEZrbm6jhBpiKHsGHyePMrVQKJ85wZCFCr9W4QHv6WTjWIrdvTmO9hDEA3bNK0xkrE2DqrHsXMLWuZpQg=="
+    "kysely@0.29.7": {
+      "integrity": "sha512-fmIq+7kv4WbFm2tcfznRzikqB4cuNpgZ40PSU2fAJ2/OO5XhojqnTPrmgrCjYSRJVwBln03XcRXJGnw9H099IQ=="
     },
     "lmdb@3.5.7": {
       "integrity": "sha512-cSXt4RnfRAaGRXVI3hiJS3fQPQebj/c7RCRBvUL2cH5gTLpgvuGFqGJbH+ZkI2sFgvSlzwJw3GTw6ffFmN/uUw==",
@@ -3049,8 +3049,8 @@
       "integrity": "sha512-y7Wygv/7mEOvxTuEQDB8StXdMRBWf1kR/tlhAzBRUFkB2jfcLOAxO/SHmOO2zgz1pVgK29/kyupn059/bCHdjA==",
       "bin": true
     },
-    "nanostores@1.3.0": {
-      "integrity": "sha512-XPUa/jz+P1oJvN9VBxw4L9MtdFfaH3DAryqPssqhb2kXjmb9npz0dly6rCsgFWOPr4Yg9mTfM3MDZgZZ+7A3lA=="
+    "nanostores@1.5.5": {
+      "integrity": "sha512-FixtE239Gl6Gz0ZGCK0WzvNwObNCIwVT+L7zQcf1QgcA6AzBxblzqe9OT88qiucNkhsjSOqiogSaF5jVbJiqSA=="
     },
     "native-duplexpair@1.0.0": {
       "integrity": "sha512-E7QQoM+3jvNtlmyfqRZ0/U75VFgCls+fSkbml2MpgWkWyz3ox8Y58gNhfuziuQYGNNQAbFZJQck55LHCnCK6CA=="
@@ -3400,6 +3400,9 @@
     "rou3@0.7.12": {
       "integrity": "sha512-iFE4hLDuloSWcD7mjdCDhx2bKcIsYbtOTpfH5MHHLSKMOUyjqQXTeZVa289uuwEGEKFoE/BAPbhaU4B774nceg=="
     },
+    "rou3@0.9.2": {
+      "integrity": "sha512-3SOzvaAg8rkHrXtRjpCvCvbyO5to9oOO27Z/XqHEYXfMRVSw/qMIVdmaOk9W2lcRLtR6dlqTjo9hDeJk70QBYQ=="
+    },
     "router@2.2.0": {
       "integrity": "sha512-nLTrUKm2UyiL7rlhapu/Zl45FwNgkZGaCpZbIHajDYgwlJCOzLSk+cIPAnsEqV955GjILJnKbdQC1nVPz+gAYQ==",
       "dependencies": [
@@ -3456,8 +3459,8 @@
         "send"
       ]
     },
-    "set-cookie-parser@3.1.1": {
-      "integrity": "sha512-vM9SUhjsUYs6UeJUmygc5Ofm5eQGe85riob5ju6XCgFGJI5PLV4nrDAQpQjd+LkFBpAkADn5BQQpZ9EUNkyLuA=="
+    "set-cookie-parser@3.2.1": {
+      "integrity": "sha512-Npd1Pt+4zb3BrSZDPd2qFwRpS6b1EUEasRrO8xS0zMJi0fApXXK5YuzP0minyJnxwnFHoVoJwA55q0A0cu63gQ=="
     },
     "set-function-length@1.2.2": {
       "integrity": "sha512-pgRc4hJ4/sNjWCSS9AmnS40x3bNMDTknHgL5UaMBTMyJnU90EgWh1Rz+MC9eFu4BuN/UwZjKQuY/1v3rM7HMfg==",
@@ -3817,7 +3820,7 @@
         ],
         "packageJson": {
           "dependencies": [
-            "npm:better-auth@^1.6.20"
+            "npm:better-auth@^1.7.7"
           ]
         }
       },
diff --git a/plugins/auth/tests/services/better-auth-global-logout-http_test.ts b/plugins/auth/tests/services/better-auth-global-logout-http_test.ts
index f84c4ac2750db3c76e8ec42452b5f9dab34e3d67..c7611ef691a193e168a9fe378f5e6ff6559070b9 100644
--- a/plugins/auth/tests/services/better-auth-global-logout-http_test.ts
+++ b/plugins/auth/tests/services/better-auth-global-logout-http_test.ts
@@ -5,8 +5,8 @@
  */
 
 import { assert, assertEquals } from '@std/assert';
-import { betterAuth } from 'npm:better-auth@^1.6.20';
-import { memoryAdapter } from 'npm:better-auth@^1.6.20/adapters/memory';
+import { betterAuth } from 'npm:better-auth@^1.7.7';
+import { memoryAdapter } from 'npm:better-auth@^1.7.7/adapters/memory';
 import { createBetterAuthBackend } from '@netscript/auth-better-auth';
 import { createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
 import { serveAuthTestService } from '../testing/auth-service-fixture.ts';
diff --git a/plugins/auth/tests/services/unsupported-revocation-http_test.ts b/plugins/auth/tests/services/unsupported-revocation-http_test.ts
index 37ca408609887f6dd6110ce6f04fcc5eae8e485b..3f130bdbf76ae98e4711020de180efc309a0f5c8 100644
--- a/plugins/auth/tests/services/unsupported-revocation-http_test.ts
+++ b/plugins/auth/tests/services/unsupported-revocation-http_test.ts
@@ -1,8 +1,8 @@
 /** Provider capability failures must never masquerade as successful operator revocation. */
 
 import { assert, assertEquals, assertStringIncludes } from '@std/assert';
-import { betterAuth } from 'npm:better-auth@^1.6.20';
-import { memoryAdapter } from 'npm:better-auth@^1.6.20/adapters/memory';
+import { betterAuth } from 'npm:better-auth@^1.7.7';
+import { memoryAdapter } from 'npm:better-auth@^1.7.7/adapters/memory';
 import { createBetterAuthBackend } from '@netscript/auth-better-auth';
 import { createWorkosBackend } from '@netscript/auth-workos';
 import { type AuthBackendPort, createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';


