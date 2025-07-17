
import axios from 'axios';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

export const getRecommendedVideos = async (keyword: string) => {
  try {
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        q: keyword,
        key: process.env.YOUTUBE_API_KEY,
        type: 'video',
        maxResults: 10, // 추천 영상 개수 (조절 가능)
      },
    });

    // API 응답에서 필요한 데이터만 추출하여 가공
    const videos = response.data.items.map((item: any) => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.default.url,
    }));

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw new Error('Failed to fetch recommended videos.');
  }
};
