import { EMPTY_SPARRING_SNAPSHOT, formatSparringTime, isSparringRoomCode } from './sparringRoom';

describe('sparring room domain', () => {
  it('accepts only a four digit ring code', () => {
    expect(isSparringRoomCode('5437')).toBe(true);
    expect(isSparringRoomCode('537')).toBe(false);
    expect(isSparringRoomCode('54A7')).toBe(false);
  });

  it('formats authoritative timer values', () => {
    expect(formatSparringTime(120)).toBe('2:00');
    expect(formatSparringTime(-1)).toBe('0:00');
    expect(EMPTY_SPARRING_SNAPSHOT.round).toBe(1);
  });
});
