import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.js';
import { useCallStore } from '../../stores/useCallStore.js';
import { webrtcManager } from '../../services/webrtc/WebRTCManager.js';
import { MediaQualityPreset } from '../../services/webrtc/types.js';
import { Video, Mic, Volume2, Gauge, Check } from 'lucide-react';

export const DeviceSettingsModal: React.FC = () => {
  const {
    deviceSettingsModalOpen,
    setDeviceSettingsModalOpen,
    availableDevices,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    qualityPreset,
    setAvailableDevices,
    setSelectedAudioOutput,
  } = useCallStore();

  const [activePreset, setActivePreset] = useState<MediaQualityPreset>(qualityPreset);

  const mediaManager = webrtcManager.getMediaManager();

  // Refresh devices when modal opens
  useEffect(() => {
    if (deviceSettingsModalOpen) {
      mediaManager.enumerateDevices().then((devices) => {
        setAvailableDevices(devices);
      });
      setActivePreset(qualityPreset);
    }
  }, [deviceSettingsModalOpen]);

  const handleAudioInputChange = (deviceId: string) => {
    webrtcManager.switchAudioDevice(deviceId);
  };

  const handleVideoInputChange = (deviceId: string) => {
    webrtcManager.switchVideoDevice(deviceId);
  };

  const handleAudioOutputChange = async (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    // Find all audio tags on the page and update sinkId
    const audioTags = document.querySelectorAll('audio');
    audioTags.forEach((audio) => {
      mediaManager.setAudioOutput(audio, deviceId);
    });
  };

  const handlePresetSelect = (preset: MediaQualityPreset) => {
    setActivePreset(preset);
    webrtcManager.setQualityPreset(preset);
  };

  return (
    <Modal
      isOpen={deviceSettingsModalOpen}
      onClose={() => setDeviceSettingsModalOpen(false)}
      title="Audio & Video Settings"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Camera Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-accent-primary" />
            <span>Camera</span>
          </label>
          <select
            value={selectedVideoInput}
            onChange={(e) => handleVideoInputChange(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-accent-primary focus:bg-white transition-colors"
          >
            {availableDevices.videoInputs.length === 0 ? (
              <option value="">Default System Camera</option>
            ) : (
              availableDevices.videoInputs.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Microphone Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-accent-primary" />
            <span>Microphone</span>
          </label>
          <select
            value={selectedAudioInput}
            onChange={(e) => handleAudioInputChange(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-accent-primary focus:bg-white transition-colors"
          >
            {availableDevices.audioInputs.length === 0 ? (
              <option value="">Default System Microphone</option>
            ) : (
              availableDevices.audioInputs.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Audio Output (Speaker) Selector */}
        {availableDevices.audioOutputs.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-accent-primary" />
              <span>Speaker / Audio Output</span>
            </label>
            <select
              value={selectedAudioOutput}
              onChange={(e) => handleAudioOutputChange(e.target.value)}
              className="w-full bg-slate-50 border border-surface-border rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-accent-primary focus:bg-white transition-colors"
            >
              {availableDevices.audioOutputs.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Speaker ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quality Preset */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-accent-primary" />
            <span>Video Quality Preset</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low' as const, label: 'Low Bandwidth', spec: '240p 15fps' },
              { id: 'balanced' as const, label: 'Balanced', spec: '480p 24fps' },
              { id: 'high' as const, label: 'High Quality', spec: '720p 30fps' },
            ].map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-accent-primary bg-accent-light text-accent-secondary shadow-sm'
                      : 'border-surface-border bg-slate-50 text-text-muted hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${isSelected ? 'text-accent-secondary' : 'text-text-main'}`}>{p.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-accent-primary" />}
                  </div>
                  <span className="text-[10px] text-text-muted">{p.spec}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
