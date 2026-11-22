import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal.js';
import { useCallStore } from '../../stores/useCallStore.js';
import { webrtcManager } from '../../services/webrtc/WebRTCManager.js';
import { CallJoinOption } from '../../services/webrtc/types.js';
import {
  Video,
  Mic,
  Headphones,
  VideoOff,
  MicOff,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const PreJoinCallModal: React.FC = () => {
  const { preJoinModalOpen, setPreJoinModalOpen, isJoining } = useCallStore();

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaManager = webrtcManager.getMediaManager();

  // Test preview when modal opens
  useEffect(() => {
    let active = true;

    async function startPreview() {
      if (!preJoinModalOpen) {
        if (previewStream) {
          previewStream.getTracks().forEach((t) => t.stop());
          setPreviewStream(null);
        }
        mediaManager.stopAudioLevelMonitoring();
        return;
      }

      setIsLoadingPreview(true);
      setErrorMsg(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setPreviewStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Test audio level
        mediaManager.startAudioLevelMonitoring(stream, (lvl) => {
          if (active) setAudioLevel(lvl);
        });
      } catch (err: any) {
        console.warn('[PreJoinCallModal] Preview stream error:', err);
        if (active) {
          setErrorMsg(err.message || 'Camera or microphone access was restricted.');
        }
      } finally {
        if (active) setIsLoadingPreview(false);
      }
    }

    startPreview();

    return () => {
      active = false;
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
      mediaManager.stopAudioLevelMonitoring();
    };
  }, [preJoinModalOpen]);

  // Clean up video tag source
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const togglePreviewCamera = () => {
    if (!previewStream) return;
    const vTrack = previewStream.getVideoTracks()[0];
    if (vTrack) {
      vTrack.enabled = !cameraEnabled;
      setCameraEnabled(!cameraEnabled);
    }
  };

  const togglePreviewMic = () => {
    if (!previewStream) return;
    const aTrack = previewStream.getAudioTracks()[0];
    if (aTrack) {
      aTrack.enabled = !micEnabled;
      setMicEnabled(!micEnabled);
    }
  };

  const handleJoin = async (option: CallJoinOption) => {
    // Stop local preview tracks so real call manager can take over devices cleanly
    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);
    }
    mediaManager.stopAudioLevelMonitoring();
    setPreJoinModalOpen(false);

    await webrtcManager.joinCall(option);
  };

  return (
    <Modal
      isOpen={preJoinModalOpen}
      onClose={() => {
        if (previewStream) {
          previewStream.getTracks().forEach((t) => t.stop());
          setPreviewStream(null);
        }
        mediaManager.stopAudioLevelMonitoring();
        setPreJoinModalOpen(false);
      }}
      title="Join Video & Voice Call"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Live Device Preview Viewport */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-surface-border flex items-center justify-center">
          {previewStream && cameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-text-dim p-6 text-center">
              <VideoOff className="w-10 h-10 mb-2 opacity-60 text-accent-secondary" />
              <span className="text-xs font-medium">Camera is turned off</span>
            </div>
          )}

          {isLoadingPreview && (
            <div className="absolute inset-0 bg-background-primary/80 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin text-accent-secondary" />
              <span>Starting device preview...</span>
            </div>
          )}

          {/* Preview overlay toggles */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePreviewMic}
              className={`p-2 rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-md border ${
                micEnabled
                  ? 'bg-black/60 border-white/10 text-white'
                  : 'bg-status-error border-status-error text-white'
              }`}
            >
              {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={togglePreviewCamera}
              className={`p-2 rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-md border ${
                cameraEnabled
                  ? 'bg-black/60 border-white/10 text-white'
                  : 'bg-black/60 border-white/10 text-slate-400'
              }`}
            >
              {cameraEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Audio level meter */}
          {micEnabled && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 border border-white/10 px-2.5 py-1 rounded-xl backdrop-blur-md">
              <Mic className="w-3 h-3 text-status-success" />
              <div className="w-16 h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-success transition-all duration-75"
                  style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-status-warning/10 border border-status-warning/20 text-xs text-status-warning">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg} You can still join in listen-only mode.</span>
          </div>
        )}

        {/* Join Options */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-[#86868B]">
            Choose how to join:
          </label>

          {/* Option 1: Full Camera & Microphone */}
          <button
            type="button"
            disabled={isJoining}
            onClick={() => handleJoin('camera-and-mic')}
            className="w-full apple-btn-primary p-3.5 rounded-2xl text-left flex items-center justify-between text-white group disabled:opacity-50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold">Join with Camera & Microphone</div>
                <div className="text-[11px] text-white/80">Full audio and video communication</div>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-white/80 group-hover:scale-110 transition-transform" />
          </button>

          {/* Option 2: Microphone Only */}
          <button
            type="button"
            disabled={isJoining}
            onClick={() => handleJoin('mic-only')}
            className="w-full p-3.5 rounded-2xl text-left flex items-center justify-between bg-[#F5F5F7] hover:bg-[#E8E8ED] border border-[#E5E5E7] text-[#1D1D1F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E8F2FE] flex items-center justify-center flex-shrink-0 text-[#0071E3]">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#1D1D1F]">Join with Microphone Only</div>
                <div className="text-[11px] text-[#86868B]">Voice chat without webcam video</div>
              </div>
            </div>
          </button>

          {/* Option 3: Listen Only */}
          <button
            type="button"
            disabled={isJoining}
            onClick={() => handleJoin('no-media')}
            className="w-full p-3.5 rounded-2xl text-left flex items-center justify-between bg-[#F5F5F7] hover:bg-[#E8E8ED] border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-[#D2D2D7]/50 flex items-center justify-center flex-shrink-0 text-[#86868B]">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#1D1D1F]">Join Without Audio or Video</div>
                <div className="text-[11px] text-[#86868B]">Listen-only mode (you can unmute anytime)</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};
