import { Request, Response, NextFunction } from 'express';
import * as youtubeService from './youtube.service.js';
import { sendSuccess } from '../../utils/response.js';
import AppError from '../../middleware/errors/AppError.js';

export const recommendVideos = async (req: Request, res: Response, next: NextFunction) => {
  const { keyword } = req.query;

  if (!keyword) {
    return next(new AppError(400, 'Keyword is required'));
  }

  try {
    const videos = await youtubeService.getRecommendedVideos(keyword as string);
    sendSuccess(res, videos);
  } catch (error) {
    next(error);
  }
};
