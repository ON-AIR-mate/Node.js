import { Request, Response } from 'express';
import axios from 'axios';
import { YoutubeSearchDto } from '../dtos/youtubeSearchDto';

type YoutubeSearchItem = {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
  };
};

type YoutubeVideoResult = {
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  viewCount: number;
  uploadTime: string;
};

// 명시적 타입으로 처리 (any 사용 X)
export const searchYoutubeVideos = async (
  req: Request<unknown, unknown, unknown, YoutubeSearchDto>,
  res: Response,
): Promise<void> => {
  try {
    const { query, limit = 10 } = req.query;

    // 입력값 검증
    if (!query || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '검색어를 입력해주세요.',
      });
      return;
    }

    if (limit < 1 || limit > 50) {
      res.status(400).json({
        success: false,
        message: 'limit은 1-50 사이여야 합니다.',
      });
      return;
    }

    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '인증 정보가 누락되었습니다.',
      });
      return;
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        success: false,
        message: '서버 설정 오류: YOUTUBE_API_KEY가 누락되었습니다.',
      });
      return;
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults: limit,
        key: apiKey,
      },
    });

    const items = response.data.items as YoutubeSearchItem[];

    const videoList: YoutubeVideoResult[] = await Promise.all(
      items.map(async item => {
        const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            part: 'statistics,snippet',
            id: item.id.videoId,
            key: apiKey,
          },
        });

        const videoData = statsRes.data.items[0];
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelName: item.snippet.channelTitle,
          viewCount: parseInt(videoData.statistics.viewCount, 10),
          uploadTime: videoData.snippet.publishedAt,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: videoList,
    });
  } catch (error: unknown) {
    console.error('YouTube search failed:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 403) {
        res.status(403).json({
          success: false,
          message: 'YouTube API 할당량 초과 또는 API 키 오류',
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: 'YouTube API 요청 실패',
      timestamp: new Date().toISOString(),
    });
  }
  }
};
