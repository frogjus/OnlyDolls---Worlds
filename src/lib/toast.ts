import { toast } from 'sonner'

export function showSuccess(message: string) { toast.success(message) }
export function showError(message: string) { toast.error(message) }
export function showInfo(message: string) { toast.info(message) }
export function showWarning(message: string) { toast.warning(message) }
export function showUndo(message: string, undoFn: () => void | Promise<void>) {
  toast(message, { action: { label: 'Undo', onClick: () => undoFn() } })
}
export function showLoading(message: string) { return toast.loading(message) }
export function dismissToast(toastId: string | number) { toast.dismiss(toastId) }
