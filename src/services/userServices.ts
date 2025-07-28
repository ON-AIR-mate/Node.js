import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 사용자 프로필 조회
export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      nickname: true,
      profileImage: true,
      popularity: true,
      isVerified: true,
      createdAt: true,
    },
  });
  
  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
  
  return {
    ...user,
    verified: user.isVerified,
  };
};

// 사용자 프로필 수정
export const updateUserProfile = async (
  userId: number,
  data: { nickname?: string; profileImage?: string }
) => {
  // 닉네임 변경 시 중복 체크
  if (data.nickname) {
    const existingUser = await prisma.user.findFirst({
      where: {
        nickname: data.nickname,
        NOT: { userId },
      },
    });
    
    if (existingUser) {
      throw new Error('이미 사용 중인 닉네임입니다.');
    }
  }
  
  return await prisma.user.update({
    where: { userId },
    data: {
      ...(data.nickname && { nickname: data.nickname }),
      ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
    },
  });
};

// 알림 설정 조회
export const getNotificationSettings = async (userId: number) => {
  const settings = await prisma.userAgreement.findUnique({
    where: { userId },
    select: {
      serviceNotification: true,
      advertisingNotification: true,
      nightNotification: true,
    },
  });
  
  if (!settings) {
    throw new Error('알림 설정을 찾을 수 없습니다.');
  }
  
  return {
    serviceNotification: settings.serviceNotification,
    advertisementNotification: settings.advertisingNotification,
    nightNotification: settings.nightNotification,
  };
};

// 알림 설정 수정
export const updateNotificationSettings = async (
  userId: number,
  settings: {
    serviceNotification?: boolean;
    advertisementNotification?: boolean;
    nightNotification?: boolean;
  }
) => {
  return await prisma.userAgreement.update({
    where: { userId },
    data: {
      ...(settings.serviceNotification !== undefined && {
        serviceNotification: settings.serviceNotification,
      }),
      ...(settings.advertisementNotification !== undefined && {
        advertisingNotification: settings.advertisementNotification,
      }),
      ...(settings.nightNotification !== undefined && {
        nightNotification: settings.nightNotification,
      }),
    },
  });
};

// 참여한 방 목록 조회
export const getParticipatedRooms = async (userId: number) => {
  const participations = await prisma.roomParticipant.findMany({
    where: {
      userId,
      // 퇴장한 방만 조회 (leftAt이 null이 아닌 경우)
      leftAt: {
        not: null,
      },
    },
    include: {
      room: {
        include: {
          video: {
            select: {
              title: true,
              thumbnail: true,
            },
          },
          bookmarks: {
            where: { userId },
            select: {
              bookmarkId: true,
              content: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });
  
  // 30초 이상 체류한 방만 필터링
  const filteredParticipations = participations.filter(p => {
    if (p.leftAt && p.joinedAt) {
      const durationMs = p.leftAt.getTime() - p.joinedAt.getTime();
      const durationSeconds = durationMs / 1000;
      return durationSeconds >= 30;
    }
    return false;
  });
  
  return filteredParticipations.map(p => ({
    roomId: p.room.roomId,
    roomTitle: p.room.roomName,
    videoTitle: p.room.video.title || '',
    videoThumbnail: p.room.video.thumbnail || '',
    participatedAt: p.joinedAt,
    bookmarks: p.room.bookmarks.map(b => ({
      bookmarkId: b.bookmarkId,
      message: b.content || '',
    })),
  }));
};

// 검색 기록 조회
export const getSearchHistory = async (userId: number) => {
  const history = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: 'desc' },
    take: 10, // 최근 10개만
  });
  
  return history.map(h => ({
    keyword: h.searchKeyword,
    searchedAt: h.searchedAt,
  }));
};

// 의견 보내기
export const sendUserFeedback = async (userId: number, content: string) => {
  if (!content || content.trim().length === 0) {
    throw new Error('의견 내용을 입력해주세요.');
  }
  
  return await prisma.userFeedback.create({
    data: {
      userId,
      content: content.trim(),
    },
  });
};