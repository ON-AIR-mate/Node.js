import { Request, Response, NextFunction } from 'express';
import { ActiveRoomService } from '../services/activeRoomsService.js';
import { GetRoomsQueryDto, SortByOption, SearchTypeOption } from '../dtos/activeRoomsDto.js';
import { sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';

export class ActiveRoomController {
  // 서비스 의존성 주입 (생성자를 통해)
  constructor(private activeRoomService: ActiveRoomService) {}

  /**
   * GET /rooms 요청을 처리하는 핸들러
   */
  public getRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. 요청 쿼리 파라미터를 DTO로 변환
      const query: GetRoomsQueryDto = {
        sortBy: req.query.sortBy as SortByOption,
        searchType: req.query.searchType as SearchTypeOption,
        keyword: req.query.keyword as string,
      };

      // 2. 서비스 레이어의 비즈니스 로직 호출
      const roomsData = await this.activeRoomService.findAll(query);

      // 3. API 명세서에 맞는 성공 응답 반환 (프로젝트의 sendSuccess 유틸 사용)
      sendSuccess(res, roomsData);
    } catch (error) {
      console.error('활성화된 방 목록 조회 중 오류 발생:', error);
      next(new AppError(500, '방 목록 조회 중 오류가 발생했습니다.'));
    }
  };
}
