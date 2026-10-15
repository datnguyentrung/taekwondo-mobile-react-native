import { fireEvent, render } from '@testing-library/react-native';

import { useSparringRoom } from '../hooks/useSparringRoom';
import { SparringRoomScreen } from './SparringRoomScreen.web';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ roomCode: '1234' }),
}));

jest.mock('../hooks/useSparringRoom');

jest.mock('@/shared/ui/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

const mockedUseSparringRoom = jest.mocked(useSparringRoom);

describe('SparringRoomScreen web operator controls', () => {
  const send = jest.fn();

  beforeEach(() => {
    send.mockReset();
    mockedUseSparringRoom.mockReturnValue({
      snapshot: {
        roomCode: '1234',
        redName: 'RED',
        blueName: 'BLUE',
        round: 1,
        remainingSeconds: 120,
        redScore: 0,
        blueScore: 0,
        redPenalties: 0,
        bluePenalties: 0,
        running: false,
        ended: false,
      },
      operator: true,
      error: null,
      connecting: false,
      send,
    });
  });

  it('updates competitor names on submit and blur', async () => {
    const screen = await render(<SparringRoomScreen />);

    await fireEvent.press(screen.getByText('RED'));
    await fireEvent.changeText(screen.getByLabelText('Tên võ sĩ đỏ'), '  Nguyen Van A  ');
    await fireEvent(screen.getByLabelText('Tên võ sĩ đỏ'), 'submitEditing');
    expect(send).toHaveBeenCalledWith({
      type: 'setCompetitorName',
      side: 'red',
      name: 'Nguyen Van A',
    });

    await fireEvent.press(screen.getByText('BLUE'));
    await fireEvent.changeText(screen.getByLabelText('Tên võ sĩ xanh'), 'Tran Van B');
    await fireEvent(screen.getByLabelText('Tên võ sĩ xanh'), 'blur');
    expect(send).toHaveBeenCalledWith({
      type: 'setCompetitorName',
      side: 'blue',
      name: 'Tran Van B',
    });
  });

  it('uses independent editable steps for time, points, and penalties', async () => {
    const screen = await render(<SparringRoomScreen />);

    await fireEvent.changeText(screen.getByLabelText('Bước điều chỉnh thời gian'), '99');
    await fireEvent(screen.getByLabelText('Bước điều chỉnh thời gian'), 'blur');
    await fireEvent.press(screen.getByLabelText('Tăng thời gian'));

    await fireEvent.changeText(screen.getByLabelText('Bước điều chỉnh điểm đỏ'), '7');
    await fireEvent.press(screen.getByLabelText('Tăng điểm đỏ'));
    await fireEvent.press(screen.getByLabelText('Tăng điểm xanh'));

    await fireEvent.changeText(screen.getByLabelText('Bước điều chỉnh điểm phạt xanh'), '12');
    await fireEvent.press(screen.getByLabelText('Giảm điểm phạt xanh'));

    expect(send).toHaveBeenCalledWith({ type: 'setDuration', seconds: 180 });
    expect(send).toHaveBeenCalledWith({
      type: 'operatorAdjustScore',
      side: 'red',
      delta: 7,
    });
    expect(send).toHaveBeenCalledWith({
      type: 'operatorAdjustScore',
      side: 'blue',
      delta: 1,
    });
    expect(send).toHaveBeenCalledWith({
      type: 'operatorAdjustPenalty',
      side: 'blue',
      delta: -12,
    });
  });
});
