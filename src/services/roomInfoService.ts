import { RoomInfoResponseDto } from '../dtos/roomInfoDto';

// 리소스를 찾지 못했을 때 사용할 커스텀 에러
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * ID를 기반으로 특정 방의 상세 정보를 조회합니다.
 * @param roomId 조회할 방의 ID
 * @returns 방의 상세 정보
 * @throws {NotFoundError} 해당 ID의 방을 찾을 수 없는 경우
 */
const getRoomInfoById = async (roomId: number): Promise<RoomInfoResponseDto> => {
  console.log(`[Service] Fetching room with ID: ${roomId}`);

  // --- 실제 데이터베이스 조회 로직 ---
  // 이곳에 Prisma, TypeORM 등을 사용하여 데이터베이스를 조회하는 코드를 작성합니다.
  // 예: const room = await db.room.findUnique({ where: { id: roomId } });
  // if (!room) {
  //   throw new NotFoundError(`Room with ID ${roomId} not found.`);
  // }
  // return room;
  // ---------------------------------

  // 데모를 위한 목(Mock) 데이터 생성
  // 특정 ID(예: 404)에 대해 '찾을 수 없음' 에러를 시뮬레이션합니다.
  if (roomId === 404) {
    throw new NotFoundError(`Room with ID ${roomId} not found.`);
  }

  // 성공 시 반환될 목 데이터
  const mockRoomData: RoomInfoResponseDto = {
    roomId: roomId,
    roomTitle: '같이 즐겁게 코딩해요!',
    videoTitle: 'TypeScript 완벽 가이드',
    videoThumbnail: 'https://i.ytimg.com/vi/example/hqdefault.jpg',
    hostNickname: '코딩천재',
    hostProfileImage: 'https://example.com/profiles/host.png',
    hostPopularity: 95,
    currentParticipants: 5,
    maxParticipants: 8,
    duration: '01:23:45',
    isPrivate: false,
    isActive: true,
    autoArchiving: true,
    invitePermission: 'HOST_ONLY',
    createdAt: '2025-01-01T12:00:00Z',
  };

  return mockRoomData;
};

export const roomInfoService = {
  getRoomInfoById,
};

