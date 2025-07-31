import { Request, Response, NextFunction } from 'express';
import { ActiveRoomService } from '../services/activeRoomsService.js';
import { GetRoomsQueryDto, SortByOption, SearchTypeOption } from '../dtos/activeRoomsDto.js';
import { sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';

export class ActiveRoomController {
  constructor(private activeRoomService: ActiveRoomService) {}

  /**
   * GET /rooms 요청을 처리하는 핸들러
   */
  public getRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. 요청 쿼리 파라미터 추출 및 유효성 검사
      const { searchType, keyword, sortBy: rawSortBy } = req.query;
      // sortBy 파라미터에 기본값('latest')을 적용합니다.
      const sortBy = (rawSortBy as SortByOption) || 'latest';

      // 런타임 유효성 검사를 위한 값 목록 (DTO와 일치시킴)
      const validSortByOptions: SortByOption[] = ['latest', 'popularity'];
      const validSearchTypeOptions: SearchTypeOption[] = ['videoTitle', 'roomTitle', 'hostNickname'];

      // sortBy 값 유효성 검사
      if (!validSortByOptions.includes(sortBy as SortByOption)) {
        // AppError 생성자 사용법 수정: (에러코드, 커스텀 메시지)
        throw new AppError('GENERAL_001', `'sortBy' 파라미터는 [${validSortByOptions.join(', ')}] 중 하나여야 합니다.`);
      }

      // searchType 및 keyword 조합 유효성 검사
      if (keyword && !searchType) {
        throw new AppError('GENERAL_001', '검색어(keyword)를 사용하려면 검색 타입(searchType)을 지정해야 합니다.');
      }
      if (searchType && !keyword) {
        throw new AppError('GENERAL_001', '검색 타입(searchType)을 지정하려면 검색어(keyword)가 필요합니다.');
      }
      if (searchType && !validSearchTypeOptions.includes(searchType as SearchTypeOption)) {
        throw new AppError('GENERAL_001', `'searchType' 파라미터는 [${validSearchTypeOptions.join(', ')}] 중 하나여야 합니다.`);
      }

      // 2. 서비스에 전달할 DTO 생성
      const query: GetRoomsQueryDto = {
        sortBy,
        searchType: searchType as SearchTypeOption,
        keyword: keyword as string | undefined,
      };

      // 3. 서비스 레이어의 비즈니스 로직 호출
      const roomsData = await this.activeRoomService.findAll(query);

      // 4. 성공 응답 반환
      sendSuccess(res, roomsData);
    } catch (error) {
      console.error('활성화된 방 목록 조회 중 오류 발생:', error);
      // AppError가 아닌 경우, 더 구체적인 서버 오류로 처리
      if (!(error instanceof AppError)) {
        // ROOM_007: 방 목록 조회 실패 (errorCodes.ts에 추가 필요)
        return next(new AppError('ROOM_007', '방 목록을 조회하는 중 예상치 못한 오류가 발생했습니다.'));
      }
      next(error);
    }
  };
}
