export type CheckInOpenCommand = {
  type: 'CHECK_IN_OPEN';
  deviceId: string;
  eventId?: string;
  occurredAt?: string;
};

export function parseCheckInOpenCommand(
  rawPayload: string,
  expectedDeviceId: string,
): CheckInOpenCommand | null {
  try {
    const parsed: unknown = JSON.parse(rawPayload);
    if (!parsed || typeof parsed !== 'object') return null;

    const command = parsed as Record<string, unknown>;
    if (
      command.type !== 'CHECK_IN_OPEN' ||
      command.deviceId !== expectedDeviceId
    ) {
      return null;
    }

    return {
      type: 'CHECK_IN_OPEN',
      deviceId: expectedDeviceId,
      eventId:
        typeof command.eventId === 'string' ? command.eventId : undefined,
      occurredAt:
        typeof command.occurredAt === 'string' ? command.occurredAt : undefined,
    };
  } catch {
    return null;
  }
}
