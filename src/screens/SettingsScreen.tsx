import { useNavigate } from 'react-router-dom'
import { TaskFlowHeader } from '../components/TaskFlowHeader'

/** Placeholder only — cutoff time and logout (per the brief) are a later stage. */
export function SettingsScreen() {
  const navigate = useNavigate()

  return (
    <>
      <TaskFlowHeader title="Settings" exit="close" onExit={() => navigate('/checkin')} />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-sans text-base text-ink/60">Settings content (cutoff time, logout) comes in a later stage.</p>
      </div>
    </>
  )
}
