import { GetRoomsQueryDto, RoomDto, RoomsDataDto } from '../dtos/activeRoomsDto.js';

// --- Mock Database ---
// 실제 애플리케이션에서는 데이터베이스에서 데이터를 조회합니다.
const allRooms: RoomDto[] = [
  {
    roomId: 123,
    roomTitle: '같이 명작 영화 봐요',
    videoTitle: '쇼생크 탈출',
    videoThumbnail: 'url1',
    hostNickname: '영화광',
    hostProfileImage: 'url_profile1',
    hostPopularity: 95,
    currentParticipants: 5,
    maxParticipants: 8,
    duration: '01:23:45',
    isPrivate: false,
  },
  {
    roomId: 124,
    roomTitle: '리액트 강의 같이 완주!',
    videoTitle: 'React 완벽 가이드',
    videoThumbnail: 'url2',
    hostNickname: '개발자',
    hostProfileImage: 'url_profile2',
    hostPopularity: 88,
    currentParticipants: 12,
    maxParticipants: 15,
    duration: '00:45:20',
    isPrivate: false,
  },
  {
    roomId: 125,
    roomTitle: '신나는 게임 방송',
    videoTitle: '리그 오브 레전드',
    videoThumbnail: 'url3',
    hostNickname: '페이커팬',
    hostProfileImage: 'url_profile3',
    hostPopularity: 99,
    currentParticipants: 20,
    maxParticipants: 20,
    duration: '02:10:05',
    isPrivate: false,
  },
  {
    roomId: 126,
    roomTitle: '조용히 코딩하실 분',
    videoTitle: '코딩 ASMR',
    videoThumbnail: 'url4',
    hostNickname: '코딩봇',
    hostProfileImage: 'url_profile4',
    hostPopularity: 70,
    currentParticipants: 3,
    maxParticipants: 10,
    duration: '05:30:10',
    isPrivate: true,
  },
];
// --- End Mock Database ---

export class ActiveRoomService {
  /**
   * 활성화된 모든 방 목록을 비즈니스 로직에 따라 조회합니다.
   * @param query - 필터링 및 정렬을 위한 쿼리 파라미터
   */
  public async findAll(query: GetRoomsQueryDto): Promise<RoomsDataDto> {
    console.log('Service: Finding rooms with query:', query);

    let filteredRooms = [...allRooms];

    // 1. 검색 (Filtering)
    if (query.searchType && query.keyword) {
      filteredRooms = filteredRooms.filter(room => {
        const targetField = room[query.searchType as keyof RoomDto];
        if (typeof targetField === 'string') {
          return targetField.toLowerCase().includes(query.keyword!.toLowerCase());
        }
        return false;
      });
    }

    // 2. 정렬 (Sorting)
    if (query.sortBy === 'popularity') {
      filteredRooms.sort((a, b) => b.hostPopularity - a.hostPopularity);
    } else {
      // 'latest' or default
      filteredRooms.sort((a, b) => b.roomId - a.roomId); // roomId를 최신 기준으로 가정
    }

    // 3. 데이터 분리 (continueWatching / onAirRooms)
    // 실제 로직은 사용자의 시청 기록 등을 기반으로 해야 합니다.
    const continueWatching: RoomDto[] = [];
    const onAirRooms: RoomDto[] = [];

    // 예시: 사용자가 참여했던 방 ID가 123이라고 가정 (실제로는 accessToken을 통해 사용자 식별)
    const userHistoryRoomId = 123;
    const historyIndex = filteredRooms.findIndex(r => r.roomId === userHistoryRoomId);
    if (historyIndex > -1) {
      continueWatching.push(filteredRooms.splice(historyIndex, 1)[0]);
    }
    onAirRooms.push(...filteredRooms);

    return {
      continueWatching,
      onAirRooms,
    };
  }
}
