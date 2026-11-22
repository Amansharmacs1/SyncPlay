import { Router } from 'express';
import { RoomController } from '../controllers/roomController.js';

const router = Router();

router.post('/', RoomController.createRoom);
router.get('/:roomId', RoomController.getRoom);
router.post('/:roomId/verify', RoomController.verifyPassword);

export default router;
