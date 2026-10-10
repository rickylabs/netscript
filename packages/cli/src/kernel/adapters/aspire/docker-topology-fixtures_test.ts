/**
 * Recorded Docker CLI output for Docker-topology tests (hostnames, ids and ports anonymized).
 * Excluded from publish by the `*_test.ts` pattern.
 */

/** Recorded `docker context inspect` output for an SSH context (hostname anonymized). */
export const REMOTE_CONTEXT_JSON = `[
    {
        "Name": "remote-daemon",
        "Metadata": {},
        "Endpoints": {
            "docker": {
                "Host": "ssh://ops@daemon-host.example",
                "SkipTLSVerify": false
            }
        },
        "TLSMaterial": {},
        "Storage": {
            "MetadataPath": "<metadata>",
            "TLSPath": "<tls>"
        }
    }
]`;

/** Recorded `docker context inspect` output for the default local context. */
export const LOCAL_CONTEXT_JSON = `[
    {
        "Name": "default",
        "Metadata": {},
        "Endpoints": {
            "docker": {
                "Host": "unix:///var/run/docker.sock",
                "SkipTLSVerify": false
            }
        },
        "TLSMaterial": {},
        "Storage": {
            "MetadataPath": "\\u003cIN MEMORY\\u003e",
            "TLSPath": "\\u003cIN MEMORY\\u003e"
        }
    }
]`;

/**
 * Recorded `docker inspect` output (trimmed to the fields read) for two AppHosts on one daemon
 * that both declare a `main-db` resource: this AppHost's instance `main-db-xkcdabcd`, published on
 * loopback as DCP does, and another AppHost's `main-db-qwertyui` from a different creator.
 */
export const ASPIRE_CONTAINERS_INSPECT_JSON = `[
    {
        "Id": "3f1c0e9a",
        "Name": "/main-db-xkcdabcd",
        "Config": {
            "Labels": {
                "com.microsoft.developer.usvc-dev.creatorProcessId": "4242"
            }
        },
        "NetworkSettings": {
            "Ports": {
                "5432/tcp": [
                    {
                        "HostIp": "127.0.0.1",
                        "HostPort": "55001"
                    }
                ],
                "8080/tcp": null
            }
        }
    },
    {
        "Id": "9b2d7c41",
        "Name": "/main-db-qwertyui",
        "Config": {
            "Labels": {
                "com.microsoft.developer.usvc-dev.creatorProcessId": "5151"
            }
        },
        "NetworkSettings": {
            "Ports": {
                "5432/tcp": [
                    {
                        "HostIp": "127.0.0.1",
                        "HostPort": "55002"
                    }
                ]
            }
        }
    }
]`;

/** Recorded `aspire describe` resource fields for this AppHost (shape of the 13.5.3 fixture). */
export const THIS_APPHOST_DB_INSTANCE = 'main-db-xkcdabcd';

/** Instance name of the same-named database owned by another AppHost on the daemon. */
export const OTHER_APPHOST_DB_INSTANCE = 'main-db-qwertyui';
