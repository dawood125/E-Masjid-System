import { useUI } from '../../hooks/useUI.js'

export default function Toast() {
  const { toast, closeToast } = useUI()

  if (!toast) return null

  const toastStyles = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    warning: 'bg-warning text-white',
    info: 'bg-info text-white',
  }

  return (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50 ${toastStyles[toast.type] || toastStyles.info} max-w-sm`}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium">{toast.message}</span>
        <button
          onClick={closeToast}
          className="text-lg leading-none hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  )
}
