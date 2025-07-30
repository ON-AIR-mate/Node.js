// src/services/friendService.ts
import { FriendshipStatus } from '@prisma/client';
import AppError from '../middleware/errors/AppError.js';
import { prisma } from '../lib/prisma.js';

// 타입 정의
interface Friend {
  userId: number;
  nickname: string;
  profileImage: string | null;
  popularity: number;
  isOnline: boolean | null;
}

interface FriendRequest {
  requestId: number;
  userId: number;g
  nickname: string;
  profileImage: string | null;
  popularity: number;
  requestedAt: string;
}

interface SearchUser {
  userId: number;
  nickname: string;
  profileImage: string | null;
  popularity: number;
  requestStatus: 'none' | 'pending' | 'accepted' | 'rejected';
}

interface FriendLounge {
  collectionId: number;
  title: string;
  description: string | null;
  bookmarkCount: number;
  visibility: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 친구 목록 조회
 */
export const getFriendsList = async (userId: number): Promise<Friend[]> => {
  try {
    // 양방향 친구 관계 조회 (requestedBy 또는 requestedTo가 userId이고 status가 accepted인 경우)
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requestedBy: userId, status: 'accepted' },
          { requestedTo: userId, status: 'accepted' },
        ],
      },
      include: {
        requester: {
          select: {
            userId: true,
            nickname: true,
            profileImage: true,
            popularity: true,
          },
        },
        receiver: {
          select: {
            userId: true,
            nickname: true,
            profileImage: true,
            popularity: true,
          },
        },
      },
    });

    // 친구 목록 생성
    const friends = friendships.map(friendship => {
      const friend = friendship.requestedBy === userId ? friendship.receiver : friendship.requester;
      return {
        userId: friend.userId,
        nickname: friend.nickname,
        profileImage: friend.profileImage,
        popularity: friend.popularity,
        isOnline: null, // 실시간 온라인 상태는 추후 구현
      };
    });

    return friends;
  } catch {
    throw new AppError('GENERAL_005');
  }
};

/**
 * 친구 요청 전송
 */
export const sendFriendRequest = async (
  requesterId: number,
  targetUserId: number,
): Promise<void> => {
  // 자기 자신에게 요청 불가
  if (requesterId === targetUserId) {
    throw new AppError('FRIEND_003');
  }

  // 대상 유저 존재 확인
  const targetUser = await prisma.user.findUnique({
    where: { userId: targetUserId },
  });

  if (!targetUser) {
    throw new AppError('FRIEND_005');
  }

  // 차단 확인
  const isBlocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerUserId: requesterId, blockedUserId: targetUserId, isActive: true },
        { blockerUserId: targetUserId, blockedUserId: requesterId, isActive: true },
      ],
    },
  });

  if (isBlocked) {
    throw new AppError('FRIEND_004');
  }

  // 기존 친구 관계 확인 (양방향)
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requestedBy: requesterId, requestedTo: targetUserId },
        { requestedBy: targetUserId, requestedTo: requesterId },
      ],
    },
  });

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      throw new AppError('FRIEND_001');
    } else if (existingFriendship.status === 'pending') {
      throw new AppError('FRIEND_002');
    }
  }

  // 트랜잭션으로 친구 요청과 알림을 함께 생성
  await prisma.$transaction(async tx => {
    await tx.friendship.create({
      data: {
        requestedBy: requesterId,
        requestedTo: targetUserId,
        status: 'pending',
      },
    });

    await tx.notification.create({
      data: {
        fromUserId: requesterId,
        toUserId: targetUserId,
        type: 'friendRequest',
        title: '새로운 친구 요청이 있습니다.',
      },
    });
  });
};

/**
 * 받은 친구 요청 목록 조회
 */
export const getFriendRequests = async (userId: number): Promise<FriendRequest[]> => {
  const requests = await prisma.friendship.findMany({
    where: {
      requestedTo: userId,
      status: 'pending',
    },
    include: {
      requester: {
        select: {
          userId: true,
          nickname: true,
          profileImage: true,
          popularity: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return requests.map(request => ({
    requestId: request.friendshipId,
    userId: request.requester.userId,
    nickname: request.requester.nickname,
    profileImage: request.requester.profileImage,
    popularity: request.requester.popularity,
    requestedAt: request.createdAt.toISOString(),
  }));
};

/**
 * 친구 요청 수락/거절
 */
export const handleFriendRequest = async (
  userId: number,
  requestId: number,
  action: 'ACCEPT' | 'REJECT',
): Promise<string> => {
  // 친구 요청 확인
  const request = await prisma.friendship.findUnique({
    where: { friendshipId: requestId },
  });

  if (!request) {
    throw new AppError('FRIEND_006');
  }

  // 본인에게 온 요청인지 확인
  if (request.requestedTo !== userId) {
    throw new AppError('GENERAL_002');
  }

  // 이미 처리된 요청인지 확인
  if (request.status !== 'pending') {
    throw new AppError('GENERAL_001');
  }

  // 요청 처리
  const newStatus: FriendshipStatus = action === 'ACCEPT' ? 'accepted' : 'rejected';

  await prisma.friendship.update({
    where: { friendshipId: requestId },
    data: {
      status: newStatus,
      acceptedAt: action === 'ACCEPT' ? new Date() : null,
      isAccepted: action === 'ACCEPT',
    },
  });

  return action === 'ACCEPT' ? '친구 요청을 수락했습니다.' : '친구 요청을 거절했습니다.';
};

/**
 * 친구 삭제
 */
export const deleteFriend = async (userId: number, friendId: number): Promise<void> => {
  // 친구 관계 확인 (양방향)
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requestedBy: userId, requestedTo: friendId, status: 'accepted' },
        { requestedBy: friendId, requestedTo: userId, status: 'accepted' },
      ],
    },
  });

  if (!friendship) {
    throw new AppError('FRIEND_007');
  }

  // 친구 관계 삭제
  await prisma.friendship.delete({
    where: { friendshipId: friendship.friendshipId },
  });
};

/**
 * 닉네임으로 사용자 검색
 */
export const searchUserByNickname = async (nickname: string, currentUserId: number): Promise<SearchUser[]> => {
  const users = await prisma.user.findMany({
    where: {
      nickname: nickname, // 완전 일치
    },
    select: {
      userId: true,
      nickname: true,
      profileImage: true,
      popularity: true,
    },
  });

  const usersWithRequestStatus = await Promise.all(
    users.map(async (user) => {
      // 현재 유저와의 친구 관계 확인
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requestedBy: currentUserId, requestedTo: user.userId },
            { requestedBy: user.userId, requestedTo: currentUserId },
          ],
        },
      });

      let requestStatus: 'none' | 'pending' | 'accepted' | 'rejected' = 'none';
      
      if (friendship) {
        if (friendship.status === 'accepted') {
          requestStatus = 'accepted';
        } else if (friendship.status === 'pending') {
          requestStatus = 'pending';
        } else if (friendship.status === 'rejected') {
          requestStatus = 'rejected';
        }
      }

      return {
        ...user,
        requestStatus, // 친구 요청 상태 추가
      };
    })
  );

  return usersWithRequestStatus;
};

/**
 * 친구 방 초대
 */
export const inviteFriendToRoom = async (
  userId: number,
  friendId: number,
  roomId: number,
): Promise<void> => {
  // 친구 관계 확인
  const isFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requestedBy: userId, requestedTo: friendId, status: 'accepted' },
        { requestedBy: friendId, requestedTo: userId, status: 'accepted' },
      ],
    },
  });

  if (!isFriend) {
    throw new AppError('FRIEND_007');
  }

  // 방 존재 및 권한 확인
  const room = await prisma.room.findUnique({
    where: { roomId },
    include: {
      participants: {
        where: { userId, leftAt: null },
      },
    },
  });

  if (!room) {
    throw new AppError('ROOM_001');
  }

  // 초대 권한 확인 (inviteAuth가 'host'인 경우 방장만 가능)
  if (room.inviteAuth === 'host' && room.hostId !== userId) {
    throw new AppError('FRIEND_008');
  }

  // 참가자인지 확인
  if (room.participants.length === 0) {
    throw new AppError('ROOM_006');
  }

  // 친구가 이미 방에 있는지 확인
  const isAlreadyInRoom = await prisma.roomParticipant.findFirst({
    where: {
      roomId,
      userId: friendId,
      leftAt: null,
    },
  });

  if (isAlreadyInRoom) {
    throw new AppError('ROOM_005'); // 이미 참여 중인 방입니다
  }

  // 방 정원 확인
  const currentParticipants = await prisma.roomParticipant.count({
    where: {
      roomId,
      leftAt: null,
    },
  });

  if (currentParticipants >= room.maxParticipants) {
    throw new AppError('ROOM_002'); // 방이 가득 찼습니다
  }

  // 알림 생성
  await prisma.notification.create({
    data: {
      fromUserId: userId,
      toUserId: friendId,
      type: 'roomInvite',
      title: `${room.roomName} 방에 초대되었습니다.`,
    },
  });
};

/**
 * 친구의 라운지 조회 (공개된 컬렉션만)
 */
export const getFriendLounge = async (
  userId: number,
  friendId: number,
): Promise<FriendLounge[]> => {
  // 친구 관계 확인
  const isFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requestedBy: userId, requestedTo: friendId, status: 'accepted' },
        { requestedBy: friendId, requestedTo: userId, status: 'accepted' },
      ],
    },
  });

  if (!isFriend) {
    throw new AppError('FRIEND_007');
  }

  // 친구의 공개 컬렉션 조회 (friends 또는 public)
  const collections = await prisma.collection.findMany({
    where: {
      userId: friendId,
      visibility: {
        in: ['friends', 'public'],
      },
    },
    include: {
      _count: {
        select: { bookmarks: true },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return collections.map(collection => ({
    collectionId: collection.collectionId,
    title: collection.title,
    description: collection.description,
    bookmarkCount: collection._count.bookmarks,
    visibility:
      collection.visibility === 'friends' ? 'FRIENDS_ONLY' : collection.visibility.toUpperCase(),
    coverImage: collection.coverImage,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  }));
};
