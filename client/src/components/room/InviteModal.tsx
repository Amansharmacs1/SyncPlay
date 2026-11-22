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
        <p className="text-xs sm:text-sm text-[#86868B]">
          Share this link or room code with friends so they can join and watch together in real time.
        </p>

        {/* Copy Invite Link */}
        <div>
          <label className="block text-xs font-semibold text-[#86868B] mb-1.5 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Shareable Room Link</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs font-mono text-[#1D1D1F] select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="apple-btn-primary px-4 py-2 text-xs font-medium flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Copy Room Code */}
        <div>
          <label className="block text-xs font-semibold text-[#86868B] mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Room Code</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-base font-mono font-bold tracking-widest text-[#0071E3]">
              {room.roomId}
            </div>
            <button
              onClick={handleCopyCode}
              className="apple-btn-secondary px-4 py-2 text-xs font-medium flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
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
            className="w-full apple-btn-secondary py-2.5 px-4 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#0071E3]" />
            <span>Share via Share Sheet / Apps</span>
          </button>
        </div>

        {room.hasPassword && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E8F2FE] border border-[#0071E3]/20 text-xs text-[#0071E3]">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>This room is password-protected. Make sure to share the password too.</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
