import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { useToastStore } from '../../stores/useToastStore.js';
import { Lock, Globe, Shield, Sparkles, Loader2 } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { displayName, setDisplayName } = useRoomStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState(displayName);
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter your display name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setDisplayName(cleanName);
      const res = await api.createRoom({
        displayName: cleanName,
        roomName: roomName.trim() || undefined,
        password: password.trim() || undefined,
        visibility,
      });

      // Save session info
      localStorage.setItem('syncplay_participant_id', res.hostId);
      useRoomStore.setState({ participantId: res.hostId });

      addToast(`Room ${res.roomId} created successfully!`, 'success');
      onClose();
      navigate(`/room/${res.roomId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Watch Room">
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
            placeholder="e.g. Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:bg-white transition-all"
          />
        </div>

        {/* Room Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Room Name <span className="text-text-dim text-[11px] normal-case">(optional)</span>
          </label>
          <input
            type="text"
            maxLength={50}
            placeholder="e.g. Movie Night with Friends"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:bg-white transition-all"
          />
        </div>

        {/* Visibility Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Room Visibility
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                visibility === 'public'
                  ? 'border-accent-primary bg-accent-light text-accent-secondary shadow-xs'
                  : 'border-surface-border bg-slate-50 text-text-muted hover:border-slate-300'
              }`}
            >
              <Globe className="w-4 h-4 text-accent-primary flex-shrink-0" />
              <div>
                <div className="font-semibold text-text-main">Public</div>
                <div className="text-[11px] text-text-muted">Anyone with link</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                visibility === 'private'
                  ? 'border-accent-primary bg-accent-light text-accent-secondary shadow-xs'
                  : 'border-surface-border bg-slate-50 text-text-muted hover:border-slate-300'
              }`}
            >
              <Lock className="w-4 h-4 text-accent-primary flex-shrink-0" />
              <div>
                <div className="font-semibold text-text-main">Private</div>
                <div className="text-[11px] text-text-muted">Direct invites only</div>
              </div>
            </button>
          </div>
        </div>

        {/* Room Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center justify-between">
            <span>Room Password</span>
            <span className="text-text-dim text-[11px] normal-case">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="password"
              maxLength={32}
              placeholder="Leave blank for open access"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:bg-white transition-all"
            />
            <Shield className="w-4 h-4 text-text-dim absolute right-3.5 top-3" />
          </div>
        </div>

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
                <span>Creating Room...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Launch Watch Room</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
