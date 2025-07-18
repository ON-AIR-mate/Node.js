var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
export const getRecommendedVideos = (keyword) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios.get(YOUTUBE_API_URL, {
        params: {
            part: 'snippet',
            q: keyword,
            key: process.env.YOUTUBE_API_KEY,
            type: 'video',
            maxResults: 10, // 추천 영상 개수 (조절 가능)
        },
    });
    // API 응답에서 필요한 데이터만 추출하여 가공
    const videos = response.data.items.map(item => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        thumbnail: item.snippet.thumbnails.default.url,
    }));
    return videos;
});
