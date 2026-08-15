import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'

/**
 * Shell for the 3 tab screens (Check-in / Entries / Patterns). The tab bar
 * lives here, not in each screen — task-flow routes use `FlowLayout`
 * instead, which has no `BottomNav` at all, so navigating into a flow
 * genuinely unmounts the tab bar (a route-level layout swap) rather than
 * hiding it with CSS.
 */
export function TabLayout() {
  return (
    <div className="mx-auto flex h-screen w-full max-w-[393px] flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
