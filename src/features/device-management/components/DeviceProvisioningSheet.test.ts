import { buildFogRuntimeConfig } from '../services/fogRuntimeConfig';

describe('buildFogRuntimeConfig', () => {
  it('derives the Fog HTTP and MQTT endpoints from the IP entered during registration', () => {
    expect(JSON.parse(buildFogRuntimeConfig('172.20.10.3', 8000))).toEqual({
      fogHttpUrl: 'http://172.20.10.3:8000',
      mqttTcpHost: '172.20.10.3',
      mqttTcpPort: 1883,
      mqttWsUrl: 'ws://172.20.10.3:9001',
      heartbeatSeconds: 30,
    });
  });
});
