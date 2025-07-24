import { Request, Response } from 'express';
import axios from 'axios';

type YoutubeVideoDetail = {
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  viewCount: number;
  uploadTime: string;
};

export const getYoutubeVideoDetail = async (
  req: Request<{ videoId: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { videoId } = req.params;

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

    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics',
        id: videoId,
        key: apiKey,
      },
    });

    const videoData = response.data.items?.[0];

    if (!videoData) {
      res.status(404).json({
        success: false,
        message: '해당 videoId에 대한 영상 정보를 찾을 수 없습니다.',
      });
      return;
    }

    const result: YoutubeVideoDetail = {
      videoId: videoData.id,
      title: videoData.snippet.title,
      thumbnail: videoData.snippet.thumbnails.medium.url,
      channelName: videoData.snippet.channelTitle,
      viewCount: parseInt(videoData.statistics.viewCount, 10),
      uploadTime: videoData.snippet.publishedAt,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'YouTube API 요청 실패',
      timestamp: new Date().toISOString(),
    });
  }
};
