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
      // 1. 요청 쿼리 파라미터 추출 및 유효성 검사
      const { searchType, keyword } = req.query;
      // sortBy 파라미터에 기본값(LATEST)을 적용합니다.
      // SortByOption이 타입이므로, 기본값은 문자열 리터럴로 설정합니다.
      const sortBy = (req.query.sortBy as SortByOption) || 'LATEST';

      // 런타임 유효성 검사를 위한 값 목록
      const validSortByOptions: string[] = ['LATEST', 'POPULARITY'];
      const validSearchTypeOptions: string[] = ['TITLE', 'NICKNAME'];

      // sortBy 값 유효성 검사
      if (!validSortByOptions.includes(sortBy)) {
        throw new AppError(`'sortBy' 파라미터는 [${validSortByOptions.join(', ')}] 중 하나여야 합니다.`);
      }

      // searchType 및 keyword 조합 유효성 검사
      if (keyword && !searchType) {
        throw new AppError('검색어(keyword)를 사용하려면 검색 타입(searchType)을 지정해야 합니다.');
      }
      if (searchType && !keyword) {
        throw new AppError('검색 타입(searchType)을 지정하려면 검색어(keyword)가 필요합니다.');
      }
      if (searchType && !validSearchTypeOptions.includes(searchType as string)) {
        throw new AppError(`'searchType' 파라미터는 [${validSearchTypeOptions.join(', ')}] 중 하나여야 합니다.`);
      }

      // 2. 서비스에 전달할 DTO 생성
      const query: GetRoomsQueryDto = {
        sortBy,
        searchType: searchType as SearchTypeOption | undefined,
        keyword: keyword as string | undefined,
      };

      // 3. 서비스 레이어의 비즈니스 로직 호출
      const roomsData = await this.activeRoomService.findAll(query);

      // 4. 성공 응답 반환
      sendSuccess(res, roomsData);
    } catch (error) {
      console.error('활성화된 방 목록 조회 중 오류 발생:', error);
      // 유효성 검사에서 발생한 AppError는 그대로 전달하고, 그 외의 에러는 새로운 AppError로 감싸서 전달합니다.
      next(error instanceof AppError ? error : new AppError('방 목록 조회 중 오류가 발생했습니다.'));
    }
  };
}
