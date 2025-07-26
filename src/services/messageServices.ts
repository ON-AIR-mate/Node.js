import { PrismaClient, RoomMessage, UserChatMessage } from '@prisma/client';
import { SaveRoomMessageInput, SendDirectMessageDTO, roomMessageDTO } from '../dtos/messageDto';
import { findUserById } from '../services/authServices';

const prisma = new PrismaClient();

/**
 * room 채팅
 */
//room 메시지 조회
export const getRoomMessages = async (roomId: number) => {
  const messages = await prisma.roomMessage.findMany({
    where: {
      roomId,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          userId: true,
          nickname: true,
          profileImage: true,
        },
      },
    },
  });

  const result = await Promise.all(
    messages.reverse().map(async (msg: RoomMessage) => {
      const member = await findUserById(msg.userId); // 사용자 정보 가져오기

      return {
        messageId: msg.messageId,
        userId: msg.userId,
        nickname: member?.nickname,
        profileImage: member?.profileImage,
        content: msg.content,
        messageType: msg.type,
        timestamp: msg.createdAt.toISOString(),
      };
    }),
  );

  return result;
};

//room  메시지 저장
export const saveRoomMessage = async ({
  roomId,
  userId,
  content,
  messageType,
}: SaveRoomMessageInput) => {
  const message = await prisma.roomMessage.create({
    data: {
      roomId,
      userId,
      content,
      type: messageType,
    },
    include: {
      user: {
        select: {
          nickname: true,
          profileImage: true,
        },
      },
    },
  });
  const user = await findUserById(userId);
  const roomMessageDTO = {
    messageId: message.messageId, // Prisma 모델에서 메시지 PK
    userId: message.userId,
    profileImage: user?.profileImage ?? '',
    content: message.content,
    messageType: message.type,
    timestamp: message.createdAt,
  } satisfies roomMessageDTO;
  return roomMessageDTO;
};

/**
 * 1:1 채팅
 */
//채팅방 생성 및 조회
export const getOrCreateChatRoom = async (user1Id: number, user2Id: number) => {
  const [u1, u2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  const existingChat = await prisma.userChat.findFirst({
    where: {
      user1Id: u1,
      user2Id: u2,
    },
  });

  if (existingChat) return existingChat;

  return await prisma.userChat.create({
    data: {
      user1Id: u1,
      user2Id: u2,
    },
  });
};

//채팅 메시지 저장
export const saveDirectMessage = async (senderId: number, payload: SendDirectMessageDTO) => {
  const { receiverId, content, type } = payload;

  // 1. 채팅방 조회
  const chat = await getOrCreateChatRoom(senderId, receiverId);

  // 2. 메시지 저장
  const message = await prisma.userChatMessage.create({
    data: {
      chatId: chat.chatId,
      userId: senderId,
      content,
      type: type,
    },
    include: {
      user: {
        select: {
          nickname: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    messageId: message.messageId,
    senderId,
    receiverId,
    content: message.content,
    messageType: message.type,
    createdAt: message.createdAt,
  };
};

//채팅 내역 조회
export const getDiriectMessages = async (userId: number, receiverId: number) => {
  const chat = await getOrCreateChatRoom(userId, receiverId);
  const chatId = chat.chatId;
  const messages = await prisma.userChatMessage.findMany({
    where: {
      chatId,
    },
    orderBy: { createdAt: 'desc' },
  });

  return messages.reverse().map((msg: UserChatMessage) => ({
    messageId: msg.messageId,
    senderId: msg.userId,
    receiverId: receiverId,
    content: msg.content,
    messageType: msg.type,
    timestamp: msg.createdAt.toISOString(),
  }));
};
