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
 * Recorded `docker inspect` output (trimmed to the fields read) for two Aspire-provisioned
 * containers: the AppHost's database, published on loopback as DCP does, and a container from an
 * unrelated AppHost on the same daemon.
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
        "Name": "/other-cache-qwertyui",
        "Config": {
            "Labels": {
                "com.microsoft.developer.usvc-dev.creatorProcessId": "5151"
            }
        },
        "NetworkSettings": {
            "Ports": {
                "6379/tcp": [
                    {
                        "HostIp": "127.0.0.1",
                        "HostPort": "55002"
                    }
                ]
            }
        }
    }
]`;
