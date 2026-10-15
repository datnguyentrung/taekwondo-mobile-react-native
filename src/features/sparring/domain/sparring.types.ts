export type SparringSide = 'red' | 'blue';

export type SparringSnapshot = {
  roomCode: string;
  round: number;
  remainingSeconds: number;
  redScore: number;
  blueScore: number;
  redPenalties: number;
  bluePenalties: number;
  running: boolean;
  ended: boolean;
};

export type SparringCommand =
  | { type: 'judgeScore'; side: SparringSide; points: 2 | 3 }
  | { type: 'operatorAdjustScore'; side: SparringSide; delta: -1 | 1 }
  | { type: 'operatorAdjustPenalty'; side: SparringSide; delta: -1 | 1 }
  | { type: 'setRound'; round: 1 | 2 | 3 }
  | { type: 'setDuration'; seconds: number }
  | { type: 'start' | 'pause' | 'end' };

export type SparringRoomEnvelope = { roomCode: string; snapshot: SparringSnapshot };
