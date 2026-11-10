# Glossary

## Managed Device

A fog gateway, kiosk, or ESP32 sensor registered by the central service. It has
an identity, credential, lifecycle state, desired configuration, and latest
reported operational state.

## Provisioning

The one-time claim of an administrator-generated code that gives a device its
credential. Provisioning does not activate the device.

## Lifecycle State

Administrative state: `REGISTERED`, `PROVISIONED`, `ACTIVE`, `MAINTENANCE`,
`SUSPENDED`, or terminal `DECOMMISSIONED`. It is not a connectivity signal.

## Connectivity State

Derived `UNKNOWN`, `ONLINE`, or `OFFLINE` state based on the most recent
heartbeat; it never changes lifecycle state by itself.

## Fog Registry

The atomically persisted local fog snapshot used to authenticate and route
devices without an HTTP request on the MQTT data path.

## Device Alert

An auditable operational incident, such as `DEVICE_OFFLINE`, with independent
`OPEN`, `ACKNOWLEDGED`, and `RESOLVED` status.
