import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { LogIn, KeyRound, Loader2 } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  initialRoomId = '',
}) => {
  const navigate = useNavigate();
  const { displayName, setDisplayName } = useRoomStore();

  const [name, setName] = useState(displayName);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanRoomId = roomId.trim().toUpperCase();

    if (!cleanName) {
      setError('Please enter your display name.');
      return;
    }
    if (!cleanRoomId) {
      setError('Please enter a valid 6-character Room ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setDisplayName(cleanName);

      // Verify room exists
      const roomInfo = await api.getRoom(cleanRoomId);

      if (roomInfo.hasPassword && !requiresPassword) {
        setRequiresPassword(true);
        setLoading(false);
        return;
      }

      if (roomInfo.hasPassword) {
        const isValid = await api.verifyPassword(cleanRoomId, password);
        if (!isValid) {
          setError('Incorrect room password. Please try again.');
          setLoading(false);
          return;
        }
      }

      onClose();
      navigate(`/room/${cleanRoomId}${password ? `?pwd=${encodeURIComponent(password)}` : ''}`);
    } catch (err: any) {
      setError(err.message || 'Room not found. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join a Watch Room">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-status-error bg-status-error/10 border border-status-error/20 rounded-xl">
            {error}
          </div>
        )}

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Your Display Name <span className="text-status-error">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={30}
            placeholder="e.g. Jordan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:bg-white transition-all"
          />
        </div>

        {/* Room Code */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Room Code <span className="text-status-error">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={10}
            placeholder="e.g. AB12CD"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            className="w-full uppercase font-mono tracking-wider bg-slate-50 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:bg-white transition-all"
          />
        </div>

        {/* Password input (if room is protected) */}
        {requiresPassword && (
          <div className="animate-in fade-in slide-in-from-top-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-accent-secondary mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Room Password Required</span>
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-accent-primary/50 rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:bg-white transition-all"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full accent-gradient-btn py-3 px-4 rounded-xl text-sm font-semibold text-white shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Room...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{requiresPassword ? 'Unlock & Join Room' : 'Join Room'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
