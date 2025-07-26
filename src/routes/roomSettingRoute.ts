import { Router } from 'express';
import { updateRoomSettings } from '../controllers/roomSettingController.js';

const router = Router();

/**
 * @swagger
 * /api/rooms/{roomId}/settings:
 *   put:
 *     summary: 방 설정 수정
 *     tags: [Room]
 *     description: 방의 설정을 수정합니다. 방장만 이 작업을 수행할 수 있습니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 설정을 수정할 방의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               maxParticipants: 15
 *               isPrivate: true
 *               autoArchiving: false
 *               invitePermission: "ALL"
 *             properties:
 *               maxParticipants:
 *                 type: integer
 *                 description: 최대 참여 인원
 *                 example: 15
 *               isPrivate:
 *                 type: boolean
 *                 description: 비공개방 여부
 *                 example: true
 *               autoArchiving:
 *                 type: boolean
 *                 description: 자동 아카이빙 여부
 *                 example: false
 *               invitePermission:
 *                 type: string
 *                 description: 초대 권한 (e.g., "ALL")
 *                 example: "ALL"
 *     responses:
 *       200:
 *         description: 방 설정 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "방 설정이 수정되었습니다."
 *       400:
 *         description: 잘못된 요청 (예: 유효하지 않은 방 ID)
 *       401:
 *         description: 인증 실패 (토큰 없음)
 *       403:
 *         description: 권한 없음 (방장이 아님)
 *       404:
 *         description: 방을 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.put('/:roomId/settings', updateRoomSettings);

export default router;
