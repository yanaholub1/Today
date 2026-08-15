import { Outlet } from 'react-router-dom'

/**
 * Shell for full-screen task flows (`/checkin/intention`, `/checkin/mood`,
 * `/settings`) — no `BottomNav`, so the tab bar recedes for the duration
 * of the flow and reappears automatically once the route lands back under
 * `TabLayout`. This is a real navigable screen, not a modal overlay, per
 * the brief — implemented as a plain route-level layout swap.
 */
export function FlowLayout() {
  return (
    <div className="mx-auto flex h-screen w-full max-w-[393px] flex-col bg-white">
      <Outlet />
    </div>
  )
}
