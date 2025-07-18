import { Router } from 'express';
import * as youtubeController from './youtube.controller.js';

const router = Router();

// 검색어 기반 추천 영상 조회
router.get('/recommendations', youtubeController.recommendVideos);

export default router;