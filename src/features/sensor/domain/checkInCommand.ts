export type CheckInCameraCommand = {
  type: 'CHECK_IN_OPEN' | 'CHECK_IN_CLOSE';
  deviceId: string;
  eventId?: string;
  occurredAt?: string;
};

export function parseCheckInCameraCommand(
  rawPayload: string,
  expectedDeviceId: string,
): CheckInCameraCommand | null {
  try {
    const parsed: unknown = JSON.parse(rawPayload);
    if (!parsed || typeof parsed !== 'object') return null;

    const command = parsed as Record<string, unknown>;
    if (
      (command.type !== 'CHECK_IN_OPEN' && command.type !== 'CHECK_IN_CLOSE') ||
      command.deviceId !== expectedDeviceId
    ) {
      return null;
    }

    return {
      type: command.type,
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
