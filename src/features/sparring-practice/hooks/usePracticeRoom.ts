import { useCallback, useEffect, useRef, useState } from 'react';
import { practiceApi } from '../data/practiceApi';
import { EMPTY_PRACTICE, type PracticeCommand, type PracticeSnapshot } from '../domain/practice.types';
import { PracticeSocketClient } from '../infrastructure/PracticeSocketClient';

export function usePracticeRoom(roomCode: string) {
  const client = useRef(new PracticeSocketClient());
  const [snapshot, setSnapshot] = useState<PracticeSnapshot>(EMPTY_PRACTICE);
  const [operator, setOperator] = useState(false); const [error, setError] = useState<string | null>(null); const [connecting, setConnecting] = useState(true);
  useEffect(() => { let mounted = true; const unsubscribe = client.current.subscribe(event => { if (event.type === 'snapshot') { setSnapshot(event.data.snapshot); setConnecting(false); } else setError(event.data.message); });
    void practiceApi.ticket(roomCode).then(ticket => { if (!mounted) return; setOperator(ticket.operator); client.current.connect(ticket.ticket); }).catch(() => { if(mounted){setError('Không thể vào phòng luyện tập');setConnecting(false);} });
    return () => { mounted=false; unsubscribe(); client.current.disconnect(); };
  }, [roomCode]);
  return { snapshot, operator, error, connecting, send: useCallback((command: PracticeCommand) => client.current.send(command), []) };
}
