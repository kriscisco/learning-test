import { useState } from 'react'
import './AdminAuthModal.css'

export default function AdminAuthModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const targetPin = import.meta.env.VITE_ADMIN_PIN || '123456'

    if (pin.trim() === targetPin) {
      setError('')
      setPin('')
      sessionStorage.setItem('admin_auth', 'true')
      onSuccess()
    } else {
      setError('Kode PIN salah. Silakan coba lagi.')
      setPin('')
    }
  }

  const handleClose = () => {
    setError('')
    setPin('')
    onClose()
  }

  return (
    <div className="admin-modal-overlay" onClick={handleClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-icon">🔒</div>
          <h2>Akses Admin</h2>
          <p>Masukkan kode PIN keamanan untuk masuk ke Admin Panel.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              autoFocus
              placeholder="Masukkan PIN Admin"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                if (error) setError('')
              }}
              className="admin-pin-input"
            />
            {error && <div className="admin-pin-error">{error}</div>}
          </div>

          <div className="admin-modal-actions">
            <button
              type="button"
              className="admin-modal-cancel"
              onClick={handleClose}
            >
              Batal
            </button>
            <button
              type="submit"
              className="admin-modal-submit"
              disabled={!pin.trim()}
            >
              Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
