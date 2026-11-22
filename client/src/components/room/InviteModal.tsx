import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { useRoomStore } from '../../stores/useRoomStore.js';
import { useToastStore } from '../../stores/useToastStore.js';
import { Copy, Check, Shield, Link2, Hash, Share2 } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const { room } = useRoomStore();
  const { addToast } = useToastStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!room) return null;

  const inviteUrl = `${window.location.origin}/room/${room.roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    addToast('Invite link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomId);
    setCopiedCode(true);
    addToast('Room code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room.roomName} on SyncPlay`,
          text: `Hey, come watch videos together with me on SyncPlay! Room code: ${room.roomId}`,
          url: inviteUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Friends to Watch">
      <div className="space-y-5">
        <p className="text-sm text-text-muted">
          Share this link or room code with friends so they can join and watch together in real time.
        </p>

        {/* Copy Invite Link */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-accent-primary" />
            <span>Shareable Room Link</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-slate-50 border border-surface-border rounded-xl px-3.5 py-2 text-xs font-mono text-text-main select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="accent-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-glow flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Copy Room Code */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-accent-primary" />
            <span>Room Code</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-surface-border rounded-xl px-3.5 py-2 text-base font-mono font-bold tracking-widest text-accent-secondary">
              {room.roomId}
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-surface-border text-text-main text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Native Web Share Button */}
        <div>
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-surface-border text-text-main text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-accent-primary" />
            <span>Share via Mobile / Messaging Apps</span>
          </button>
        </div>

        {room.hasPassword && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-light border border-accent-primary/20 text-xs text-accent-secondary">
            <Shield className="w-4 h-4 flex-shrink-0 text-accent-primary" />
            <span>This room is password-protected. Make sure to share the password too.</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
