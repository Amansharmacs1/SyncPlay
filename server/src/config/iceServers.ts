import { IceServerConfig } from '../types/index.js';

export function getIceServers(): IceServerConfig[] {
  const iceServers: IceServerConfig[] = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ];

  // Optional custom STUN servers from env
  if (process.env.STUN_SERVERS) {
    const customStuns = process.env.STUN_SERVERS.split(',').map((s) => s.trim()).filter(Boolean);
    if (customStuns.length > 0) {
      iceServers.push({ urls: customStuns });
    }
  }

  // Production TURN Server support (Coturn, Twilio, Metered, Xirsys, Cloudflare Calls)
  if (process.env.TURN_URL) {
    const turnUrls = process.env.TURN_URL.split(',').map((u) => u.trim()).filter(Boolean);
    const turnConfig: IceServerConfig = {
      urls: turnUrls,
    };

    if (process.env.TURN_USERNAME) {
      turnConfig.username = process.env.TURN_USERNAME;
    }
    if (process.env.TURN_CREDENTIAL) {
      turnConfig.credential = process.env.TURN_CREDENTIAL;
    }

    iceServers.push(turnConfig);
  }

  return iceServers;
}
