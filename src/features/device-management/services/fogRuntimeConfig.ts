const FOG_MQTT_TCP_PORT = 1883;
const FOG_MQTT_WEBSOCKET_PORT = 9001;

/** Builds the Fog runtime contract that Java returns to every assigned Kiosk. */
export function buildFogRuntimeConfig(ipAddress: string, httpPort: number): string {
  const ip = ipAddress.trim();
  return JSON.stringify({
    fogHttpUrl: `http://${ip}:${httpPort}`,
    mqttTcpHost: ip,
    mqttTcpPort: FOG_MQTT_TCP_PORT,
    mqttWsUrl: `ws://${ip}:${FOG_MQTT_WEBSOCKET_PORT}`,
    heartbeatSeconds: 30,
  });
}
