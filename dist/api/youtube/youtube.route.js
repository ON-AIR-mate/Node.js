import { Router } from 'express';
import * as youtubeController from './youtube.controller.js';
const router = Router();
// GET /api/youtube/recommend?keyword=...
router.get('/recommend', youtubeController.recommendVideos);
export default router;
