import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'

/**
 * Shell for the 3 tab screens (Check-in / Entries / Patterns). The tab bar
 * lives here, not in each screen — task-flow routes use `FlowLayout`
 * instead, which has no `BottomNav` at all, so navigating into a flow
 * genuinely unmounts the tab bar (a route-level layout swap) rather than
 * hiding it with CSS.
 *
 * `h-dvh`, not `h-screen` (review fix, same reasoning as OnboardingScreen's
 * own doc comment): `100vh` is fixed to iOS Safari's largest possible
 * viewport (toolbar fully collapsed) even while the toolbar is currently
 * showing, so this container could render taller than what's really
 * visible — pushing `BottomNav`, pinned at the bottom of this flex column,
 * partly behind the toolbar. `100dvh` tracks the actually-visible
 * viewport, so the tab bar stays fully on-screen without needing a scroll
 * to reach it.
 */
export function TabLayout() {
  return (
    <div className="mx-auto flex h-dvh w-full sm:max-w-[393px] flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
