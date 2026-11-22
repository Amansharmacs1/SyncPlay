import { Router } from 'express';
import { WebRtcController } from '../controllers/webrtcController.js';

const router = Router();

router.get('/ice-servers', WebRtcController.getIceServers);

export default router;
