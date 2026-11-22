import { Request, Response } from 'express';
import { getIceServers } from '../config/iceServers.js';

export class WebRtcController {
  public static getIceServers(_req: Request, res: Response): void {
    try {
      const iceServers = getIceServers();
      res.json({
        success: true,
        data: {
          iceServers,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve ICE server configuration',
      });
    }
  }
}
