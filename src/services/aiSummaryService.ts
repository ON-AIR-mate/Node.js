// src/services/aiSummaryService.ts
import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errors/AppError.js';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import {
  GenerateSummaryRequestDto,
  GenerateSummaryResponseDto,
  ClaudeResponseDto,
  AISummaryFeedbackData,
} from '../dtos/aiSummaryDto.js';

const prisma = new PrismaClient();
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export class AiSummaryService {
  /**
   * 방의 채팅 내역을 가져와서 AI 요약을 생성합니다.
   * DB에 저장하지 않고 바로 응답을 반환합니다.
   */
  async generateChatSummary(
    data: GenerateSummaryRequestDto,
    userId: number,
  ): Promise<GenerateSummaryResponseDto> {
    // 1. 방 정보 확인
    const room = await prisma.room.findUnique({
      where: { roomId: data.roomId },
      include: {
        host: true,
      },
    });

    if (!room) {
      throw new AppError('ROOM_001', '방이 존재하지 않습니다.');
    }

    // 2. 사용자가 방에 참여했는지 확인
    const participant = await prisma.roomParticipant.findFirst({
      where: {
        roomId: data.roomId,
        userId: userId,
      },
    });

    if (!participant) {
      throw new AppError('ROOM_006', '방에 참여하지 않았습니다.');
    }

    // 3. 채팅 메시지 가져오기
    const messages = await prisma.roomMessage.findMany({
      where: {
        roomId: data.roomId,
        type: 'general', // 시스템 메시지 제외
      },
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (messages.length === 0) {
      throw new AppError('GENERAL_003', '요약할 채팅 내역이 없습니다.');
    }

    // 4. 비디오 정보 가져오기
    const video = await prisma.youtubeVideo.findUnique({
      where: { videoId: room.videoId },
    });

    if (!video) {
      throw new AppError('ROOM_007', '유튜브 영상을 찾을 수 없습니다.');
    }

    // 5. 채팅 내용 포맷팅
    const chatContent = messages.map(msg => `${msg.user.nickname}: ${msg.content}`).join('\n');

    // 6. Claude 3.5 Sonnet 모델 호출
    const summary = await this.callClaudeModel(chatContent, video.title);

    // 7. 임시 summaryId 생성 (DB 저장 없이)
    const summaryId = `summary_${data.roomId}_${Date.now()}`;

    return {
      summaryId,
      roomTitle: room.roomName,
      videoTitle: video.title,
      topicSummary: summary.topicSummary,
      emotionAnalysis: summary.emotionAnalysis,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Claude 3.5 Sonnet 모델을 호출하여 채팅 요약을 생성합니다.
   */
  private async callClaudeModel(
    chatContent: string,
    videoTitle: string,
  ): Promise<ClaudeResponseDto> {
    const systemPrompt = `당신은 채팅 내용을 분석하고 요약하는 전문가입니다. 
응답은 반드시 유효한 JSON 형식으로만 해주세요.`;

    const userPrompt = `다음은 "${videoTitle}" 영상을 함께 시청하며 나눈 채팅 내용입니다.

채팅 내용:
${chatContent}

위 채팅 내용을 분석하여 다음 두 가지를 한국어로 작성해주세요:

1. 전체 대화 주제 요약 (3-5문장으로 핵심 내용 정리)
2. 대화의 전반적인 감정 분석
   - 반드시 다음 6가지 중 하나를 선택: 기쁨, 슬픔, 분노, 혐오, 공포, 놀람
   - 기쁨: 즐겁고 유쾌한 분위기
   - 슬픔: 우울하거나 아쉬운 분위기  
   - 분노: 화나거나 짜증나는 분위기
   - 혐오: 불쾌하거나 거부감이 드는 분위기
   - 공포: 무섭거나 불안한 분위기
   - 놀람: 놀랍거나 신기하거나 충격적인 분위기
   - 형식: "감정이름 - 이유 설명"

응답은 반드시 다음 JSON 형식으로만 해주세요:
{
  "topicSummary": "요약 내용",
  "emotionAnalysis": "기쁨 - 대화 전반적으로 즐거운 분위기가 지배적이었습니다"
}`;

    try {
      const input: InvokeModelCommandInput = {
        modelId: process.env.BEDROCK_MODEL_ID!,  // Claude 3.5 Sonnet
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      };

      const command = new InvokeModelCommand(input);
      const response: InvokeModelCommandOutput = await bedrockClient.send(command);

      const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as ClaudeResponse;

      // Claude 응답에서 텍스트 추출
      const responseText = responseBody.content[0]?.text || '{}';

      // JSON 파싱
      const result = JSON.parse(responseText);

      return {
        topicSummary: result.topicSummary || '요약을 생성할 수 없습니다.',
        emotionAnalysis: result.emotionAnalysis || '기쁨 - 분석할 수 없습니다.',
      };
    } catch (error) {
      console.error('Claude 모델 호출 실패:', error);
      throw new AppError('GENERAL_004', 'AI 요약 생성에 실패했습니다.');
    }
  }

  /**
   * AI 요약에 대한 피드백을 저장합니다.
   * 기존 UserFeedback 테이블을 활용하여 JSON 형태로 저장합니다.
   */
  async submitFeedback(
    summaryId: string,
    userId: number,
    feedback: 'LIKE' | 'DISLIKE',
    comment?: string,
  ): Promise<void> {
    // summaryId에서 roomId 추출 (summary_123_timestamp 형식)
    const roomIdMatch = summaryId.match(/summary_(\d+)_/);
    if (!roomIdMatch) {
      throw new AppError('GENERAL_001', '유효하지 않은 summaryId입니다.');
    }

    const roomId = parseInt(roomIdMatch[1]);

    // 실제로 존재하는 방인지 확인
    const room = await prisma.room.findUnique({
      where: { roomId },
    });

    if (!room) {
      throw new AppError('ROOM_001', '방이 존재하지 않습니다.');
    }

    // UserFeedback 테이블에 AI 요약 피드백 저장
    const feedbackData: AISummaryFeedbackData = {
      type: 'AI_SUMMARY_FEEDBACK',
      summaryId,
      roomId,
      feedback,
      comment,
      timestamp: new Date().toISOString(),
    };

    await prisma.userFeedback.create({
      data: {
        userId,
        content: JSON.stringify(feedbackData),
      },
    });
  }
}

export const aiSummaryService = new AiSummaryService();
