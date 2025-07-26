import { Router } from 'express';
import { ActiveRoomController } from '../controllers/activeRoomsController.js';
import { ActiveRoomService } from '../services/activeRoomsService.js';

const router = Router();

// 의존성 인스턴스 생성 및 주입
const activeRoomService = new ActiveRoomService();
const activeRoomController = new ActiveRoomController(activeRoomService);

// 라우트 정의: GET / -> activeRoomController.getRooms
router.get('/', activeRoomController.getRooms);

export default router;