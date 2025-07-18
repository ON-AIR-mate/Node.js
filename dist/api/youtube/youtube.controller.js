var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as youtubeService from './youtube.service.js';
import { sendSuccess } from '../../utils/response.js';
import AppError from '../../middleware/errors/AppError.js';
export const recommendVideos = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword } = req.query;
    if (!keyword) {
        return next(new AppError(400, 'Keyword is required'));
    }
    try {
        const videos = yield youtubeService.getRecommendedVideos(keyword);
        sendSuccess(res, videos);
    }
    catch (error) {
        next(error);
    }
});
