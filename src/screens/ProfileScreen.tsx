import { useNavigate } from 'react-router-dom'
import { TaskFlowHeader } from '../components/TaskFlowHeader'

/** Placeholder only — the profile button (Fix 19, node 117:5748) has no real destination content yet. */
export function ProfileScreen() {
  const navigate = useNavigate()

  return (
    <>
      <TaskFlowHeader title="Profile" exit="close" onExit={() => navigate('/checkin')} />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-sans text-base text-ink/60">Profile content comes in a later stage.</p>
      </div>
    </>
  )
}
