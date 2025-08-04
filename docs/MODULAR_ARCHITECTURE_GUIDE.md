# 🏗️ Modular Architecture Guide

This guide demonstrates the modular architecture patterns implemented in the video streaming feature and how to apply them to other parts of the project.

## 🎯 Goals

- **Separation of Concerns**: Each module has a single responsibility
- **Reusability**: Components can be used across different parts of the application
- **Maintainability**: Easy to understand, modify, and test individual pieces
- **Scalability**: Easy to add new features without affecting existing code

## 📁 Feature-Based Structure

```
src/features/video-streaming/
├── components/           # UI Components
│   ├── VideoPlayer.tsx
│   ├── VideoCard.tsx
│   ├── VideoList.tsx
│   ├── VideoModal.tsx
│   ├── VideoThumbnail.tsx
│   └── index.ts
├── hooks/               # Custom React Hooks
│   ├── useVideoList.ts
│   ├── useVideoPlayer.ts
│   ├── useVideoInfo.ts
│   └── index.ts
├── services/            # API & Business Logic
│   └── videoApi.ts
├── types/               # TypeScript Definitions
│   └── index.ts
├── utils/               # Pure Utility Functions
│   └── videoUtils.ts
├── VideoStreamingPage.tsx  # Main Feature Page
└── index.ts             # Feature Export
```

## 🧩 Layer Responsibilities

### 1. **Components Layer** (`/components`)
- **Purpose**: Pure UI components that handle rendering and user interactions
- **Rules**: 
  - No direct API calls
  - Receive data via props
  - Emit events via callbacks
  - Minimal business logic

**Example:**
```tsx
// ✅ Good: Pure component with clear props
export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onClick,
  showMetadata = true,
}) => {
  return (
    <div onClick={() => onClick?.(video)}>
      {/* UI rendering */}
    </div>
  );
};

// ❌ Bad: Component with API calls
export const VideoCard = () => {
  const [video, setVideo] = useState(null);
  
  useEffect(() => {
    fetch('/api/videos/123').then(/* ... */); // Don't do this!
  }, []);
};
```

### 2. **Hooks Layer** (`/hooks`)
- **Purpose**: Manage state, side effects, and provide data to components
- **Rules**:
  - Handle API calls and data fetching
  - Manage component state
  - Provide clean interfaces to components

**Example:**
```tsx
// ✅ Good: Hook handles complexity, provides simple interface
export function useVideoList(options = {}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await videoApiService.getVideos();
      setVideos(data.videos);
    } finally {
      setLoading(false);
    }
  }, []);

  return { videos, loading, refetch: fetchVideos };
}
```

### 3. **Services Layer** (`/services`)
- **Purpose**: Handle external dependencies (APIs, storage, etc.)
- **Rules**:
  - Pure functions or classes
  - No React dependencies
  - Handle errors gracefully
  - Provide consistent interfaces

**Example:**
```tsx
// ✅ Good: Service handles API complexity
export class VideoApiService {
  async getVideos(params = {}) {
    try {
      const response = await fetch(this.buildUrl('/videos', params));
      return await this.handleResponse(response);
    } catch (error) {
      throw new VideoApiError('FETCH_ERROR', error.message);
    }
  }
}
```

### 4. **Types Layer** (`/types`)
- **Purpose**: Centralized TypeScript definitions
- **Rules**:
  - Define all interfaces and types
  - Export from index.ts
  - Keep types close to their usage

### 5. **Utils Layer** (`/utils`)
- **Purpose**: Pure utility functions
- **Rules**:
  - No side effects
  - Easily testable
  - Single responsibility

## 🔄 Component Composition Patterns

### Small, Focused Components

Instead of large monolithic components, create small, focused ones:

```tsx
// ✅ Good: Small, focused components
<VideoList>
  {videos.map(video => (
    <VideoCard key={video.id} video={video} onClick={onVideoSelect} />
  ))}
</VideoList>

// ❌ Bad: Monolithic component
<VideoSystemPage>
  {/* 500+ lines of mixed concerns */}
</VideoSystemPage>
```

### Composition over Inheritance

```tsx
// ✅ Good: Compose features
export const VideoStreamingPage = () => {
  const { videos, loading } = useVideoList();
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <div>
      <VideoList videos={videos} onVideoSelect={setSelectedVideo} />
      <VideoModal video={selectedVideo} />
    </div>
  );
};
```

## 🎨 Applying to Existing Components

### Example: Breaking Down VisionSystem Component

**Current Structure (Monolithic):**
```tsx
// ❌ Current: One large component
export const VisionSystem = () => {
  // 900+ lines of mixed concerns
  return (
    <div>
      {/* System status */}
      {/* Camera cards */}
      {/* Storage info */}
      {/* MQTT status */}
    </div>
  );
};
```

**Proposed Modular Structure:**
```
src/features/vision-system/
├── components/
│   ├── SystemStatusCard.tsx
│   ├── CameraCard.tsx
│   ├── CameraGrid.tsx
│   ├── StorageOverview.tsx
│   ├── MqttStatus.tsx
│   └── index.ts
├── hooks/
│   ├── useSystemStatus.ts
│   ├── useCameraList.ts
│   └── index.ts
├── services/
│   └── visionApi.ts
└── VisionSystemPage.tsx
```

**Refactored Usage:**
```tsx
// ✅ Better: Composed from smaller parts
export const VisionSystemPage = () => {
  return (
    <div>
      <SystemStatusCard />
      <CameraGrid />
      <StorageOverview />
      <MqttStatus />
    </div>
  );
};

// Now you can reuse components elsewhere:
export const DashboardHome = () => {
  return (
    <div>
      <SystemStatusCard />  {/* Reused! */}
      <QuickStats />
    </div>
  );
};
```

## 📋 Migration Strategy

### Phase 1: Extract Utilities
1. Move pure functions to `/utils`
2. Move types to `/types`
3. Create service classes for API calls

### Phase 2: Extract Hooks
1. Create custom hooks for data fetching
2. Move state management to hooks
3. Simplify component logic

### Phase 3: Break Down Components
1. Identify distinct UI sections
2. Extract to separate components
3. Use composition in parent components

### Phase 4: Feature Organization
1. Group related components, hooks, and services
2. Create feature-level exports
3. Update imports across the application

## 🧪 Testing Benefits

Modular architecture makes testing much easier:

```tsx
// ✅ Easy to test individual pieces
describe('VideoCard', () => {
  it('displays video information', () => {
    render(<VideoCard video={mockVideo} />);
    expect(screen.getByText(mockVideo.filename)).toBeInTheDocument();
  });
});

describe('useVideoList', () => {
  it('fetches videos on mount', async () => {
    const { result } = renderHook(() => useVideoList());
    await waitFor(() => {
      expect(result.current.videos).toHaveLength(3);
    });
  });
});
```

## 🚀 Benefits Achieved

1. **Reusability**: `VideoCard` can be used in lists, grids, or modals
2. **Maintainability**: Each file has a single, clear purpose
3. **Testability**: Small, focused units are easy to test
4. **Developer Experience**: Clear structure makes onboarding easier
5. **Performance**: Smaller components enable better optimization

## 📝 Best Practices

1. **Start Small**: Begin with one feature and apply patterns gradually
2. **Single Responsibility**: Each file should have one clear purpose
3. **Clear Interfaces**: Use TypeScript to define clear contracts
4. **Consistent Naming**: Follow naming conventions across features
5. **Documentation**: Document complex logic and interfaces

This modular approach transforms large, hard-to-maintain components into small, reusable, and testable pieces that can be composed together to create powerful features.
