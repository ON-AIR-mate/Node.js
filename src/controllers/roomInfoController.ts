import { Request, Response, NextFunction } from 'express';
import { roomInfoService } from '../services/roomInfoService';

const getRoomInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId: roomIdStr } = req.params;
    const roomId = parseInt(roomIdStr, 10);

    // roomId가 유효한 숫자인지 확인
    if (isNaN(roomId)) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: '유효하지 않은 방 ID입니다.',
      });
    }

    const roomInfo = await roomInfoService.getRoomInfoById(roomId);

    return res.status(200).json({
      success: true,
      data: roomInfo,
    });
  } catch (error) {
    // 발생한 에러를 다음 에러 처리 미들웨어로 전달
    next(error);
  }
};

export const roomInfoController = {
  getRoomInfo,
};

