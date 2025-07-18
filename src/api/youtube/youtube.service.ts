import axios from 'axios';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// YouTube API 응답에 대한 타입 정의
interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchResult[];
}

// 서비스 함수가 반환하는 비디오 객체 타입
interface RecommendedVideo {
  title: string;
  videoId: string;
  thumbnail: string;
}

export const getRecommendedVideos = async (keyword: string): Promise<RecommendedVideo[]> => {
  const response = await axios.get<YouTubeSearchResponse>(YOUTUBE_API_URL, {
    params: {
      part: 'snippet',
      q: keyword,
      key: process.env.YOUTUBE_API_KEY,
      type: 'video',
      maxResults: 10, // 추천 영상 개수 (조절 가능)
    },
  });

  // API 응답에서 필요한 데이터만 추출하여 가공
  const videos: RecommendedVideo[] = response.data.items.map(item => ({
    title: item.snippet.title,
    videoId: item.id.videoId,
    thumbnail: item.snippet.thumbnails.default.url,
  }));

  return videos;
};
