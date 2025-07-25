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

  const room = await prisma.room.findUnique({
    where: { roomId: roomId },
    include: {
      host: true,
      video: true,
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!room) {
    throw new AppError(404, `ID가 ${roomId}인 방을 찾을 수 없습니다.`);
  }

  const roomInfo: RoomInfoResponseDto = {
    roomId: room.roomId,
    roomTitle: room.roomName,

    videoTitle: room.video.title,
    videoThumbnail: room.video.thumbnail ?? '',
    duration: room.video.duration ?? 'PT0S',

    hostNickname: room.host.nickname,
    hostProfileImage: room.host.profileImage || '',
    hostPopularity: room.host.popularity,
    currentParticipants: room._count.participants,
    maxParticipants: room.maxParticipants,
    isPrivate: !room.isPublic,
    isActive: room.isActive,
    autoArchiving: room.autoArchive,
    invitePermission: room.inviteAuth,
    createdAt: room.createdAt.toISOString(),
  };

  return roomInfo;
};

export const roomInfoService = {
  getRoomInfoById,
};
