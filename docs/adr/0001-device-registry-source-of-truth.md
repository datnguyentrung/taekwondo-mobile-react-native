# ADR 0001: Java owns devices; fog caches the registry

## Decision

Java is the source of truth for managed-device lifecycle, credentials,
assignments and alert history. Each fogserver periodically pulls a scoped
registry snapshot, persists it atomically, and uses it locally while processing
MQTT messages.

## Consequences

The MQTT data path remains available during transient cloud outages and never
blocks on Java. Registry changes can take up to one sync interval to take
effect. The fog cache contains credential hashes only; production transport
must use TLS.
