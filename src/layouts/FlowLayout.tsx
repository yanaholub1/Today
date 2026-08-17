import { Outlet } from 'react-router-dom'

/**
 * Shell for full-screen task flows (`/checkin/intention`, `/checkin/mood`,
 * `/settings`) — no `BottomNav`, so the tab bar recedes for the duration
 * of the flow and reappears automatically once the route lands back under
 * `TabLayout`. This is a real navigable screen, not a modal overlay, per
 * the brief — implemented as a plain route-level layout swap.
 *
 * `h-dvh`, not `h-screen` (review fix, matching `TabLayout`'s own already-
 * applied fix, same reasoning): `100vh` is fixed to iOS Safari's largest
 * possible viewport even while its toolbar is currently showing, so this
 * container could render taller than what's really visible. Brought in
 * line while investigating a reported bottom-nav visibility issue on a
 * real device — this layout doesn't render `BottomNav` itself, but a
 * mismatched height unit between the two sibling layouts a user
 * routinely bounces between (a flow screen back to a tab screen) is a
 * plausible contributor to real-device viewport-height inconsistencies.
 */
export function FlowLayout() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[393px] flex-col bg-white">
      <Outlet />
    </div>
  )
}
