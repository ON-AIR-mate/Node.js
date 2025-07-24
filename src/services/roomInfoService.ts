import { PrismaClient } from '@prisma/client';
import { RoomInfoResponseDto } from '../dtos/roomInfoDto.js';
import AppError from '../middleware/errors/AppError.js';

const prisma = new PrismaClient();

/**
 * ID를 기반으로 특정 방의 상세 정보를 조회합니다.
 * @param roomId 조회할 방의 ID
 * @returns 방의 상세 정보
 * @throws {AppError} 해당 ID의 방을 찾을 수 없는 경우
 */
const getRoomInfoById = async (roomId: number): Promise<RoomInfoResponseDto> => {
  console.log(`[Service] Fetching room with ID: ${roomId}`);

  // --- 실제 데이터베이스 조회 로직 ---
  // 이곳에 Prisma, TypeORM 등을 사용하여 데이터베이스를 조회하는 코드를 작성합니다.
  // 예: const room = await db.room.findUnique({ where: { id: roomId } });
  const room = await prisma.room.findUnique({
    where: { roomId: roomId }, // 버그 수정: 올바른 기본 키 'roomId' 사용
    include: {
      host: true, // 방장 정보 포함
      video: true, // 관계가 설정된 비디오 정보 포함
      _count: {
        select: { participants: true }, // 참여자 수 계산
      },
    },
  });

  if (!room) {
    throw new AppError(404, `ID가 ${roomId}인 방을 찾을 수 없습니다.`);
  }

  // DB 조회 결과를 API 응답 DTO 형식에 맞게 변환
  const roomInfo: RoomInfoResponseDto = {
    roomId: room.roomId, // Prisma 모델의 'roomId' 필드
    roomTitle: room.roomName, // Prisma 모델의 'roomName' 필드

    // 관계 설정된 비디오에서 데이터를 가져오고, 데이터가 없을 경우 대체값 사용
    videoTitle: room.video.title, // 'video'와 'title'은 필수이므로 방어 코드 제거
    videoThumbnail: room.video.thumbnail ?? '', // 썸네일은 null일 수 있으므로 유지
    duration: room.video.duration ?? 'PT0S', // duration은 null일 수 있으므로 유지

    hostNickname: room.host.nickname, // User 관계를 통해 가져옴
    hostProfileImage: room.host.profileImage || '', // User 관계를 통해 가져옴
    hostPopularity: room.host.popularity, // 버그 수정: 방장의 인기도 사용
    currentParticipants: room._count.participants, // 관계 카운트로 현재 참여자 수 계산
    maxParticipants: room.maxParticipants, // Prisma 모델의 'maxParticipants' 필드
    isPrivate: !room.isPublic, // Prisma 모델의 'isPublic' 필드를 반전
    isActive: room.isActive, // Prisma 모델의 'isActive' 필드
    autoArchiving: room.autoArchive, // Prisma 모델의 'autoArchive' 필드
    invitePermission: room.inviteAuth, // Prisma 모델의 'inviteAuth' 필드
    createdAt: room.createdAt.toISOString(), // 생성일
  };

  return roomInfo;
};

export const roomInfoService = {
  getRoomInfoById,
};
