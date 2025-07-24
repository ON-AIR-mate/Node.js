import { Router } from 'express';
import { roomInfoController } from '../controllers/roomInfoController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const roomInfoRouter = Router();

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: 특정 방의 상세 정보 조회
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방의 고유 ID
 *     responses:
 *       200:
 *         description: 방 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomInfoSuccessResponse'
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 방을 찾을 수 없음
 */
roomInfoRouter.get(
  '/:roomId',
  requireAuth,
  roomInfoController.getRoomInfo
);

export default roomInfoRouter;
