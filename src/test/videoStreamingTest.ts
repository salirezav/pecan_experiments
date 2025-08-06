/**
 * Video Streaming API Test
 * 
 * This test script verifies the video streaming functionality
 * and API connectivity with the USDA Vision Camera System.
 */

import { videoApiService } from '../features/video-streaming/services/videoApi';

export interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

export class VideoStreamingTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🧪 Starting Video Streaming API Tests');
    console.log('=====================================');

    await this.testApiConnectivity();
    await this.testVideoList();
    await this.testVideoInfo();
    await this.testStreamingUrls();

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });

    console.log(`\n🎯 Tests Passed: ${passed}/${total}`);
    
    return this.results;
  }

  private async testApiConnectivity(): Promise<void> {
    try {
      console.log('\n🔗 Testing API Connectivity...');
      
      const isHealthy = await videoApiService.healthCheck();
      
      if (isHealthy) {
        this.addResult('API Connectivity', true, 'Successfully connected to video API');
      } else {
        this.addResult('API Connectivity', false, 'API is not responding');
      }
    } catch (error) {
      this.addResult('API Connectivity', false, `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testVideoList(): Promise<void> {
    try {
      console.log('\n📋 Testing Video List...');
      
      const response = await videoApiService.getVideos({
        limit: 5,
        include_metadata: true
      });
      
      if (response && typeof response.total_count === 'number') {
        this.addResult('Video List', true, `Found ${response.total_count} videos, retrieved ${response.videos.length} items`, response);
      } else {
        this.addResult('Video List', false, 'Invalid response format');
      }
    } catch (error) {
      this.addResult('Video List', false, `Failed to fetch videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testVideoInfo(): Promise<void> {
    try {
      console.log('\n📹 Testing Video Info...');
      
      // First get a video list to test with
      const videoList = await videoApiService.getVideos({ limit: 1 });
      
      if (videoList.videos.length === 0) {
        this.addResult('Video Info', false, 'No videos available to test with');
        return;
      }

      const firstVideo = videoList.videos[0];
      const videoInfo = await videoApiService.getVideoInfo(firstVideo.file_id);
      
      if (videoInfo && videoInfo.file_id === firstVideo.file_id) {
        this.addResult('Video Info', true, `Successfully retrieved info for ${firstVideo.file_id}`, videoInfo);
      } else {
        this.addResult('Video Info', false, 'Invalid video info response');
      }
    } catch (error) {
      this.addResult('Video Info', false, `Failed to fetch video info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testStreamingUrls(): Promise<void> {
    try {
      console.log('\n🎬 Testing Streaming URLs...');
      
      // Get a video to test with
      const videoList = await videoApiService.getVideos({ limit: 1 });
      
      if (videoList.videos.length === 0) {
        this.addResult('Streaming URLs', false, 'No videos available to test with');
        return;
      }

      const firstVideo = videoList.videos[0];
      
      // Test streaming URL generation
      const streamingUrl = videoApiService.getStreamingUrl(firstVideo.file_id);
      const thumbnailUrl = videoApiService.getThumbnailUrl(firstVideo.file_id, {
        timestamp: 1.0,
        width: 320,
        height: 240
      });

      if (streamingUrl && thumbnailUrl) {
        this.addResult('Streaming URLs', true, `Generated URLs for ${firstVideo.file_id}`, {
          streamingUrl,
          thumbnailUrl
        });
      } else {
        this.addResult('Streaming URLs', false, 'Failed to generate URLs');
      }
    } catch (error) {
      this.addResult('Streaming URLs', false, `Failed to test URLs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addResult(test: string, success: boolean, message: string, data?: any): void {
    this.results.push({ test, success, message, data });
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).VideoStreamingTester = VideoStreamingTester;
  (window as any).runVideoStreamingTests = async () => {
    const tester = new VideoStreamingTester();
    return await tester.runAllTests();
  };
}

export default VideoStreamingTester;
