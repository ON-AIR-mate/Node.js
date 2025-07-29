import { Router } from 'express';
import { ActiveRoomController } from '../controllers/activeRoomsController.js';
import { ActiveRoomService } from '../services/activeRoomsService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// 의존성 인스턴스 생성 및 주입
const activeRoomService = new ActiveRoomService();
const activeRoomController = new ActiveRoomController(activeRoomService);
/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: 활성화된 방 목록 조회
 *     description: 현재 활성화된 방 목록을 검색 및 정렬 조건에 따라 조회합니다.
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latest, popularity]
 *         description: '정렬 기준 (latest: 최신순, popularity: 방장 인기순)'
 *       - in: query
 *         name: searchType
 *         schema:
 *           type: string
 *           enum: [videoTitle, roomTitle, hostNickname]
 *         description: '검색 기준 (영상제목, 방제목, 방장닉네임)'
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: '검색어 (searchType이 지정된 경우에만 유효)'
 *     responses:
 *       200:
 *         description: 활성화된 방 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActiveRoomsResponse'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/', requireAuth, activeRoomController.getRooms);

export default router;
