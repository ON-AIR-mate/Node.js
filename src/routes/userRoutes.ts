import express from 'express';
import {
  getProfile,
  updateProfile,
  getNotificationSettings,
  updateNotificationSettings,
  getParticipatedRooms,
  getSearchHistory,
  sendFeedback,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// 모든 User API는 인증이 필요합니다
router.use(requireAuth);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: 프로필 정보 조회
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: number
 *                       example: 123
 *                     nickname:
 *                       type: string
 *                       example: 사용자닉네임
 *                     profileImage:
 *                       type: string
 *                       nullable: true
 *                       example: 프로필이미지URL
 *                     popularity:
 *                       type: number
 *                       example: 85
 *                     verified:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-01-01T00:00:00Z
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-01-27T12:00:00Z
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: 프로필 정보 수정
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: 새 닉네임
 *                 example: 새닉네임
 *               profileImage:
 *                 type: string
 *                 nullable: true
 *                 description: 새 프로필 이미지 URL
 *                 example: 새프로필이미지URL
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 프로필이 수정되었습니다.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       409:
 *         description: 중복된 닉네임
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /api/users/notification-settings:
 *   get:
 *     summary: 알림 설정 조회
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 설정 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     serviceNotification:
 *                       type: boolean
 *                       example: true
 *                     advertisementNotification:
 *                       type: boolean
 *                       example: false
 *                     nightNotification:
 *                       type: boolean
 *                       example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/notification-settings', getNotificationSettings);

/**
 * @swagger
 * /api/users/notification-settings:
 *   put:
 *     summary: 알림 설정 수정
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceNotification:
 *                 type: boolean
 *                 description: 서비스 알림
 *                 example: true
 *               advertisementNotification:
 *                 type: boolean
 *                 description: 광고성 알림
 *                 example: false
 *               nightNotification:
 *                 type: boolean
 *                 description: 야간 알림
 *                 example: true
 *     responses:
 *       200:
 *         description: 알림 설정 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 알림 설정이 수정되었습니다.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.put('/notification-settings', updateNotificationSettings);

/**
 * @swagger
 * /api/users/participated-rooms:
 *   get:
 *     summary: 참여한 방 목록 조회
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: 사용자가 참여했던 방 목록 조회 (30초 이상 체류한 방)
 *     responses:
 *       200:
 *         description: 참여한 방 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       roomId:
 *                         type: number
 *                         example: 123
 *                       roomTitle:
 *                         type: string
 *                         example: 방제목
 *                       videoTitle:
 *                         type: string
 *                         example: 영상제목
 *                       videoThumbnail:
 *                         type: string
 *                         example: 썸네일URL
 *                       participatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-01-01T12:00:00Z
 *                       bookmarks:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             bookmarkId:
 *                               type: number
 *                               example: 456
 *                             message:
 *                               type: string
 *                               example: 00:15:30 재밌는 장면
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/participated-rooms', getParticipatedRooms);

/**
 * @swagger
 * /api/users/search-history:
 *   get:
 *     summary: 검색 기록 조회
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 검색 기록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       keyword:
 *                         type: string
 *                         example: 검색어
 *                       searchedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-01-01T12:00:00Z
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/search-history', getSearchHistory);

/**
 * @swagger
 * /api/users/feedback:
 *   post:
 *     summary: 의견 보내기
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 의견 내용
 *                 example: 의견 내용
 *     responses:
 *       200:
 *         description: 의견 전송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 의견을 보냈습니다. 소중한 의견 감사합니다.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.post('/feedback', sendFeedback);

export default router;