import { Outlet } from 'react-router';
import { MusicProvider } from '../../context/music-context';

export function QuickEditLayout() {
  return (
    <MusicProvider>
      <Outlet />
    </MusicProvider>
  );
}
