import { parseCheckInOpenCommand } from './checkInCommand';

describe('parseCheckInOpenCommand', () => {
  it('accepts a CHECK_IN_OPEN command addressed to this kiosk', () => {
    expect(
      parseCheckInOpenCommand(
        JSON.stringify({
          type: 'CHECK_IN_OPEN',
          deviceId: 'kiosk-01',
          eventId: 'event-1',
        }),
        'kiosk-01',
      ),
    ).toEqual({
      type: 'CHECK_IN_OPEN',
      deviceId: 'kiosk-01',
      eventId: 'event-1',
      occurredAt: undefined,
    });
  });

  it.each([
    ['another kiosk', { type: 'CHECK_IN_OPEN', deviceId: 'kiosk-02' }],
    ['another event', { type: 'SENSOR_UPDATE', deviceId: 'kiosk-01' }],
  ])('rejects %s', (_name, payload) => {
    expect(
      parseCheckInOpenCommand(JSON.stringify(payload), 'kiosk-01'),
    ).toBeNull();
  });
});
