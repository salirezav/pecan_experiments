# 🎬 Video Streaming Integration Guide

This guide shows how to integrate the modular video streaming feature into your existing dashboard.

## 🚀 Quick Start

### 1. Add to Dashboard Navigation

Update your sidebar or navigation to include the video streaming page:

```tsx
// In src/components/Sidebar.tsx or similar
import { VideoStreamingPage } from '../features/video-streaming';

const navigationItems = [
  // ... existing items
  {
    name: 'Video Library',
    href: '/videos',
    icon: VideoCameraIcon,
    component: VideoStreamingPage,
  },
];
```

### 2. Add Route (if using React Router)

```tsx
// In your main App.tsx or router configuration
import { VideoStreamingPage } from './features/video-streaming';

function App() {
  return (
    <Routes>
      {/* ... existing routes */}
      <Route path="/videos" element={<VideoStreamingPage />} />
    </Routes>
  );
}
```

## 🧩 Using Individual Components

The beauty of the modular architecture is that you can use individual components anywhere:

### Dashboard Home - Recent Videos

```tsx
// In src/components/DashboardHome.tsx
import { VideoList } from '../features/video-streaming';

export const DashboardHome = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Existing dashboard content */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Videos</h2>
        <VideoList 
          limit={6}
          filters={{ /* recent videos only */ }}
          className="grid grid-cols-2 gap-4"
        />
      </div>
    </div>
  );
};
```

### Vision System - Camera Videos

```tsx
// In src/components/VisionSystem.tsx
import { VideoList, VideoCard } from '../features/video-streaming';

export const VisionSystem = () => {
  const [selectedCamera, setSelectedCamera] = useState(null);

  return (
    <div>
      {/* Existing vision system content */}
      
      {/* Add video section for selected camera */}
      {selectedCamera && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">
            Recent Videos - {selectedCamera}
          </h3>
          <VideoList 
            filters={{ cameraName: selectedCamera }}
            limit={8}
          />
        </div>
      )}
    </div>
  );
};
```

### Experiment Data Entry - Video Evidence

```tsx
// In src/components/DataEntry.tsx
import { VideoThumbnail, VideoModal } from '../features/video-streaming';

export const DataEntry = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <form>
      {/* Existing form fields */}
      
      {/* Add video evidence section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Evidence
        </label>
        <div className="grid grid-cols-4 gap-4">
          {experimentVideos.map(video => (
            <VideoThumbnail
              key={video.file_id}
              fileId={video.file_id}
              onClick={() => {
                setSelectedVideo(video);
                setShowVideoModal(true);
              }}
            />
          ))}
        </div>
      </div>

      <VideoModal
        video={selectedVideo}
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </form>
  );
};
```

## 🎨 Customizing Components

### Custom Video Card for Experiments

```tsx
// Create a specialized version for your use case
import { VideoCard } from '../features/video-streaming';

export const ExperimentVideoCard = ({ video, experimentId, onAttach }) => {
  return (
    <div className="relative">
      <VideoCard video={video} showMetadata={false} />
      
      {/* Add experiment-specific actions */}
      <div className="absolute top-2 right-2">
        <button
          onClick={() => onAttach(video.file_id, experimentId)}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Attach to Experiment
        </button>
      </div>
    </div>
  );
};
```

### Custom Video Player with Annotations

```tsx
// Extend the base video player
import { VideoPlayer } from '../features/video-streaming';

export const AnnotatedVideoPlayer = ({ fileId, annotations }) => {
  return (
    <div className="relative">
      <VideoPlayer fileId={fileId} />
      
      {/* Add annotation overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {annotations.map(annotation => (
          <div
            key={annotation.id}
            className="absolute bg-yellow-400 bg-opacity-75 p-2 rounded"
            style={{
              left: `${annotation.x}%`,
              top: `${annotation.y}%`,
            }}
          >
            {annotation.text}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🔧 Configuration

### API Base URL

Update the API base URL if needed:

```tsx
// In your app configuration
import { VideoApiService } from './features/video-streaming';

// Create a configured instance
export const videoApi = new VideoApiService('http://your-api-server:8000');

// Or set globally
process.env.REACT_APP_VIDEO_API_URL = 'http://your-api-server:8000';
```

### Custom Styling

The components use Tailwind CSS classes. You can customize them:

```tsx
// Override default styles
<VideoList 
  className="grid grid-cols-1 md:grid-cols-3 gap-8" // Custom grid
/>

<VideoCard 
  className="border-2 border-blue-200 hover:border-blue-400" // Custom border
/>
```

## 🎯 Integration Examples

### 1. Camera Management Integration

```tsx
// In your camera management page
import { VideoList, useVideoList } from '../features/video-streaming';

export const CameraManagement = () => {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const { videos } = useVideoList({
    initialParams: { camera_name: selectedCamera?.name }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Camera controls */}
      <CameraControls onCameraSelect={setSelectedCamera} />
      
      {/* Videos from selected camera */}
      <div>
        <h3>Videos from {selectedCamera?.name}</h3>
        <VideoList 
          filters={{ cameraName: selectedCamera?.name }}
          limit={12}
        />
      </div>
    </div>
  );
};
```

### 2. Experiment Timeline Integration

```tsx
// Show videos in experiment timeline
import { VideoThumbnail } from '../features/video-streaming';

export const ExperimentTimeline = ({ experiment }) => {
  return (
    <div className="timeline">
      {experiment.events.map(event => (
        <div key={event.id} className="timeline-item">
          <div className="timeline-content">
            <h4>{event.title}</h4>
            <p>{event.description}</p>
            
            {/* Show related videos */}
            {event.videos?.length > 0 && (
              <div className="flex space-x-2 mt-2">
                {event.videos.map(videoId => (
                  <VideoThumbnail
                    key={videoId}
                    fileId={videoId}
                    width={120}
                    height={80}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 📱 Responsive Design

The components are designed to be responsive:

```tsx
// Automatic responsive grid
<VideoList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" />

// Mobile-friendly video player
<VideoPlayer 
  fileId={video.file_id}
  className="w-full h-auto max-h-96"
/>
```

## 🔍 Search Integration

Add search functionality:

```tsx
import { useVideoList } from '../features/video-streaming';

export const VideoSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { videos, loading } = useVideoList({
    initialParams: { search: searchTerm }
  });

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search videos..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      
      <VideoList videos={videos} loading={loading} />
    </div>
  );
};
```

## 🚀 Next Steps

1. **Start Small**: Begin by adding the video library page
2. **Integrate Gradually**: Add individual components to existing pages
3. **Customize**: Create specialized versions for your specific needs
4. **Extend**: Add new features like annotations, bookmarks, or sharing

The modular architecture makes it easy to start simple and grow the functionality over time!
