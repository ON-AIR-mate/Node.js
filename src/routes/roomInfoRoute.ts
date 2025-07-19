import { Router } from 'express';
import { roomInfoController } from '../controllers/roomInfoController';
// import { authMiddleware } from '../../middlewares/authMiddleware'; // 인증 미들웨어 (가정)

const roomInfoRouter = Router();

/**
 * @api {get} /rooms/:roomId 방 정보 조회
 * @apiName GetRoomInfo
 * @apiGroup Rooms
 */
roomInfoRouter.get(
  '/:roomId',
  // authMiddleware, // 명세서에 따라 인증 미들웨어 추가
  roomInfoController.getRoomInfo
);

export default roomInfoRouter;

