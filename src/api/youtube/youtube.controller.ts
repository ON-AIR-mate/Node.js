
import { Request, Response } from 'express';
import * as youtubeService from './youtube.service';

export const recommendVideos = async (req: Request, res: Response) => {
  const { keyword } = req.query; // URL 쿼리에서 키워드 추출 (e.g., /api/youtube/recommend?keyword=축구)

  if (!keyword) {
    return res.status(400).json({ message: 'Keyword is required' });
  }

  try {
    const videos = await youtubeService.getRecommendedVideos(keyword as string);
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching videos.' });
  }
};
