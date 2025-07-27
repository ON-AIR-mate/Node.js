import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import chatHandler from './chatHandler';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { findUserByToken } from '../services/authServices.js';
import { onlineUser, offlineUser } from './redisManager';

let io: Server;

export const initSocketServer = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // 필요 시 CORS 제한
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: No token'));
    }

    const user = await findUserByToken(token);
    if (!user) {
      return next(new Error('유효하지 않은 토큰입니다.'));
    }
    socket.data.user = {
      id: user.userId.toString(),
      nickname: user.nickname,
      userId: user.userId,
    }; // socket.data에 사용자 정보 저장

    console.log('🔗유저: ', socket.data.user.id, ', ', socket.data.user.nickname);
    next(); // 다음 미들웨어 또는 연결 승인
  });

  io.use((socket, next) => {
    const rawUser = socket.handshake.auth.user;
    if (!rawUser) return next(new Error('no user'));
    socket.data.user = JSON.parse(rawUser);
    next();
  });

  const pubClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  });

  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter set');

  io.on('connection', socket => {
    const user = socket.data.user;
    console.log('🚀 유저 접속:', user.nickname, ', 소캣: ', socket.id);
    onlineUser(user.id, socket.id);

    chatHandler(io!, socket);

    socket.on('disconnect', () => {
      offlineUser(socket.data.user.id, socket.id);
      console.log('❌ 연결 해제:', socket.id);
    });
  });

  return io;
};

/**
 * Returns the initialized Socket.IO server instance.
 *
 * @returns The Socket.IO server instance
 * @throws If the server has not been initialized
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
