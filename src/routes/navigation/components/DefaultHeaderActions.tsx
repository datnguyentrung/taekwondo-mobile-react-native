import { HomeHeaderButton } from './HomeHeaderButton';

export function DefaultHeaderActions({ color }: { color?: string }) {
  return (
    <>
      <HomeHeaderButton color={color} />
    </>
  );
}
