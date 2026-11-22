import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { socketService } from '../../services/socket.js';
import { useToastStore } from '../../stores/useToastStore.js';
import {
  Settings,
  Lock,
  Unlock,
  Sliders,
  Shield,
  KeyRound,
  Globe,
  Check,
} from 'lucide-react';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({ isOpen, onClose }) => {
  const { room, isHost } = useRoomStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [allowParticipantControl, setAllowParticipantControl] = useState(false);
  const [password, setPassword] = useState('');
  const [removePassword, setRemovePassword] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  useEffect(() => {
    if (room && isOpen) {
      setName(room.roomName || '');
      setIsLocked(!!room.isLocked);
      setAllowParticipantControl(!!room.allowParticipantControl);
      setVisibility(room.visibility || 'public');
      setPassword('');
      setRemovePassword(false);
    }
  }, [room, isOpen]);

  if (!isHost || !room) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    socketService.updateRoomSettings({
      roomName: cleanName,
      isLocked,
      allowParticipantControl,
      visibility,
      password: password.trim() ? password.trim() : undefined,
      removePassword,
    });

    addToast('Room settings updated successfully', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Settings (Host Controls)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Room Name
          </label>
          <input
            type="text"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded-xl px-3.5 py-2 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:bg-white transition-all"
          />
        </div>

        {/* Room Lock Toggle */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLocked ? 'bg-rose-100 text-rose-600' : 'bg-accent-light text-accent-primary'}`}>
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-text-main">Lock Room</div>
              <div className="text-[11px] text-text-muted">
                {isLocked ? 'New participants cannot join' : 'Anyone with link can join'}
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
            className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
          />
        </div>

        {/* Participant Playback Control Permissions */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-light text-accent-primary flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-main">Open Playback Controls</div>
              <div className="text-[11px] text-text-muted">
                {allowParticipantControl ? 'Anyone can play, pause, or seek' : 'Only Host can control playback'}
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={allowParticipantControl}
            onChange={(e) => setAllowParticipantControl(e.target.checked)}
            className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
          />
        </div>

        {/* Password Management */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center justify-between">
            <span>Room Password</span>
            {room.hasPassword && (
              <span className="text-[10px] text-accent-secondary flex items-center gap-1 font-mono font-semibold">
                <Shield className="w-3 h-3 text-accent-primary" /> Password Active
              </span>
            )}
          </label>

          {room.hasPassword ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Set new password (optional)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setRemovePassword(false);
                  }}
                  className="flex-1 bg-slate-50 border border-surface-border rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-accent-primary focus:bg-white transition-all"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={removePassword}
                  onChange={(e) => {
                    setRemovePassword(e.target.checked);
                    if (e.target.checked) setPassword('');
                  }}
                  className="accent-accent-primary"
                />
                <span>Remove room password completely</span>
              </label>
            </div>
          ) : (
            <input
              type="password"
              placeholder="Enter new password (optional)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-surface-border rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-accent-primary focus:bg-white transition-all"
            />
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full accent-gradient-btn py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-glow flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
