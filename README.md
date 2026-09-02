# Image Sequence Video on Scroll

A lightweight JavaScript library that transforms a sequence of images into a smooth, scroll-controlled video experience using an HTML5 `<canvas>`.

The library is designed for immersive and interactive storytelling experiences where image sequences are rendered frame-by-frame according to the user's scroll position.

It supports:

* Desktop and mobile image sequences
* Responsive image switching
* Smooth scroll-to-frame animation
* Intelligent image preloading
* Memory-aware image cache cleanup
* Network-aware preload ranges
* Retina/high-DPI canvas rendering
* Dynamic content between animation frames
* Scroll velocity and direction tracking
* Custom lifecycle callbacks
* IntersectionObserver-based initial loading
* Optional debugging and FPS monitoring
* Dynamic asset cache-busting
* Existing canvas or automatic canvas creation

---

## Features

### Scroll-controlled animation

The image sequence behaves like a video. As the user scrolls, the library maps the scroll position to the appropriate animation frame.

### Desktop and mobile support

Separate image sequences can be configured for desktop and mobile devices.

```javascript
desktop: {
    folderName: 'video-desktop',
    image_Prefix: 'video',
    startPos: 1,
    endPos: 601,
    animationGap: 50
},

mobile: {
    folderName: 'video-mobile',
    image_Prefix: 'video',
    startPos: 1,
    endPos: 601,
    animationGap: 50
}
```

The active sequence automatically changes when the container crosses the configured responsive breakpoint.

---

## Performance Optimizations

The current implementation contains several optimizations intended for large image sequences.

### Intelligent preloading

Frames near the current frame are loaded ahead of time.

Desktop uses a larger preload range while mobile uses a smaller range.

The preload range is also reduced automatically when the browser reports:

* `saveData`
* `2g`
* `3g`

This reduces unnecessary network and memory usage on slower connections.

### Cache management

Images are cached after loading.

When the cache becomes larger than the configured limit, the library removes the frame that is farthest from the current frame.

This prevents long animations from continuously consuming memory.

### Lazy initial loading

The animation does not immediately load the complete sequence.

Initial assets are loaded when the canvas container approaches the viewport using `IntersectionObserver`.

### `requestAnimationFrame`

Scroll updates and animation interpolation use `requestAnimationFrame` to avoid unnecessary rendering work.

### Binary-search frame lookup

Scroll position is mapped to a frame using binary search rather than scanning every frame.

This keeps frame lookup efficient even when the animation contains hundreds or thousands of frames.

---

# Installation

The library can be included directly in a web page.

```html
<script src="video.js"></script>
```

For example:

```html
<script src="/assets/js/video.js"></script>
```

The current library exposes:

```javascript
videoMaker
```

---

# Basic HTML

A container is required for the canvas.

```html
<div id="video-container"></div>

<div id="video-scroll-area"></div>
```

The canvas can either be created automatically or supplied manually.

---

# Basic Usage

```javascript
const video = new videoMaker('#video-container', {
    canvasID: '#video-canvas',

    live_url: '/assets/images/',

    responsiveStart: 767,

    desktop: {
        folderName: 'video-desktop',
        image_Prefix: 'video',
        startPos: 1,
        endPos: 601,
        animationGap: 50
    },

    mobile: {
        folderName: 'video-mobile',
        image_Prefix: 'video',
        startPos: 1,
        endPos: 601,
        animationGap: 50
    },

    scrollAreaElement: '#video-scroll-area'
});

video.init();
```

---

# Canvas

The library supports two canvas modes.

## Use an existing canvas

```html
<canvas id="video-canvas"></canvas>
```

```javascript
const video = new videoMaker('#video-container', {
    canvasID: '#video-canvas'
});
```

When `canvasID` is provided, the library uses the existing canvas.

## Automatically create a canvas

If `canvasID` is not provided:

```javascript
const video = new videoMaker('#video-container', {
    live_url: '/assets/images/'
});
```

The library creates:

```html
<canvas id="video-canvas"></canvas>
```

and appends it to the configured container.

---

# Image Naming Convention

The image sequence follows this naming convention:

```text
<image_Prefix> (<frameNumber>)<extension>
```

For example:

```text
video (1).jpg
video (2).jpg
video (3).jpg
...
video (600).jpg
```

With:

```javascript
live_url: '/assets/images/',
```

and:

```javascript
desktop: {
    folderName: 'video-desktop',
    image_Prefix: 'video',
    startPos: 1
}
```

the generated URL becomes:

```text
/assets/images/video-desktop/video (1).jpg
```

---

# Configuration

The constructor accepts:

```javascript
new videoMaker(element, options)
```

## Constructor

```javascript
const video = new videoMaker(
    '#video-container',
    options
);
```

### `element`

The canvas container.

It can be either:

```javascript
'#video-container'
```

or a DOM element:

```javascript
document.querySelector('#video-container')
```

---

# Options

## `canvasID`

```javascript
canvasID: '#video-canvas'
```

Existing canvas selector.

Default:

```javascript
null
```

If omitted, the library creates the canvas automatically.

---

## `desktop`

Desktop configuration.

```javascript
desktop: {
    folderName: 'video-desktop',
    image_Prefix: 'video',
    startPos: 1,
    endPos: 601,
    animationGap: 50
}
```

---

## `mobile`

Mobile configuration.

```javascript
mobile: {
    folderName: 'video-mobile',
    image_Prefix: 'video',
    startPos: 1,
    endPos: 601,
    animationGap: 50
}
```

---

## `responsiveStart`

Breakpoint used to determine mobile vs desktop.

```javascript
responsiveStart: 767
```

Default:

```text
767px
```

The current implementation evaluates the actual canvas/container width during resizing and switches between the desktop and mobile configurations.

---

## `image_extension`

Image file extension.

```javascript
image_extension: '.jpg'
```

Default:

```text
.jpg
```

Examples:

```javascript
image_extension: '.png'
```

```javascript
image_extension: '.webp'
```

---

## `live_url`

Base URL for the image sequence.

```javascript
live_url: '/assets/images/'
```

The final image URL is generated from:

```text
live_url
+
folderName
+
image_Prefix
+
frame number
+
image_extension
```

---

## `rootMargin`

Configurable root margin value.

```javascript
rootMargin: '200px'
```

Default:

```text
0px
```

---

## `scrollAreaElement`

Defines the element used to generate the scroll track.

```javascript
scrollAreaElement: '#video-scroll-area'
```

It can be either a selector:

```javascript
scrollAreaElement: '#scroll-area'
```

or a DOM element:

```javascript
scrollAreaElement: document.querySelector('#scroll-area')
```

---

## `contentData`

Optional content that can be inserted between animation frames.

```javascript
contentData: [
    {
        mobile_key: '10',
        dekstop_key: '20',
        content: '<h2>Introduction</h2>'
    }
]
```

The library creates a content slide when a matching frame key is found.

---

## `contentSetHeight`

Default height for desktop content slides.

```javascript
contentSetHeight: '500px'
```

---

## `render`

Custom render callback.

```javascript
render: function(data) {
    console.log(data.status);
}
```

The callback receives an object containing the current animation status.

---

## `root`

Optional root element configuration.

```javascript
root: null
```

---

## `isDyanamicId`

Enable dynamic ID support.

```javascript
isDyanamicId: true
```

> Note: This option is retained in the current API structure for compatibility with the previous implementation.

---

## `dyanamicIDPrefic`

Dynamic ID prefix.

```javascript
dyanamicIDPrefic: 'video_'
```

> Note: The current implementation stores this option, while frame asset generation is primarily based on the configured folder, prefix, frame position, and extension.

---

## `useCache`

Controls cache-busting behavior.

```javascript
useCache: true
```

Default:

```javascript
true
```

When:

```javascript
useCache: false
```

the library generates a session version value and appends it to image URLs:

```text
?v=<timestamp>
```

This can be useful when assets are updated and browser caching needs to be bypassed.

---

## `debug`

Enable the built-in debugging panel.

```javascript
debug: true
```

Default:

```javascript
false
```

When enabled, the library displays:

* Current frame
* Target frame
* Animation velocity
* FPS
* Cache size
* Animation progress

---

# Desktop / Mobile Configuration

Each device configuration supports:

| Property       | Description                                   |
| -------------- | --------------------------------------------- |
| `folderName`   | Image folder                                  |
| `image_Prefix` | Image filename prefix                         |
| `startPos`     | Starting frame                                |
| `endPos`       | Ending frame                                  |
| `animationGap` | Space inserted between frames without content |

Example:

```javascript
const options = {
    responsiveStart: 767,

    desktop: {
        folderName: 'desktop',
        image_Prefix: 'video',
        startPos: 1,
        endPos: 601,
        animationGap: 50
    },

    mobile: {
        folderName: 'mobile',
        image_Prefix: 'video',
        startPos: 1,
        endPos: 601,
        animationGap: 50
    }
};
```

---

# Content Between Frames

The library can insert HTML content into the scrolling animation.

Example:

```javascript
contentData: [
    {
        mobile_key: '10',
        dekstop_key: '20',
        content: '<h2>Moon Landing</h2><p>Historic moment.</p>',
        height: '500px'
    }
]
```

The content is associated with a frame position.

When the corresponding frame is reached, the content slide is included in the scroll track.

---

# Animation Architecture

The animation pipeline works approximately as follows:

```text
User Scroll
    ↓
Scroll Event
    ↓
requestAnimationFrame
    ↓
Scroll Position
    ↓
Binary Search
    ↓
Target Frame
    ↓
Frame Interpolation
    ↓
Image Cache
    ↓
Canvas Rendering
```

The current frame does not immediately jump to the target frame.

Instead, the library uses velocity-based interpolation:

```javascript
velocity =
    velocity * damping
    +
    delta * easeFactor
```

This produces smoother frame transitions during scrolling.

---

# Frame Loading

Frames are loaded dynamically.

```javascript
video.load(index);
```

The generated image is loaded using:

```javascript
const img = new Image();

img.crossOrigin = "anonymous";
```

After loading, the image is decoded before being stored in the cache when possible.

---

# Preloading

The library preloads frames around the current frame.

For normal connections:

```text
Desktop
Forward: 40
Backward: 15

Mobile
Forward: 12
Backward: 4
```

For slower connections or Save-Data mode:

```text
Forward: 6
Backward: 2
```

The preload direction also takes the current scroll velocity into account.

This means the library can prioritize frames in the direction the user is currently scrolling.

---

# Cache Cleanup

The library prevents unlimited image caching.

When the cache reaches its configured limit, the frame farthest from the current frame is removed.

This is particularly important for mobile devices where large image sequences can consume significant memory.

---

# Canvas Rendering

Images are rendered using the Canvas 2D API.

The canvas uses:

```javascript
alpha: false
```

and:

```javascript
desynchronized: true
```

to optimize rendering.

The image uses a cover-style scaling algorithm:

```javascript
const scale = Math.max(
    canvasWidth / imageWidth,
    canvasHeight / imageHeight
);
```

The image is then centered inside the canvas.

This ensures the image covers the complete canvas without leaving gaps.

---

# High-DPI / Retina Support

The canvas automatically considers `devicePixelRatio`.

The current implementation limits the DPR to:

```text
2
```

For example:

```javascript
const dpr = Math.min(
    window.devicePixelRatio || 1,
    2
);
```

The physical canvas resolution is increased while the CSS dimensions remain equal to the container dimensions.

This provides sharper rendering on high-density displays.

---

# Responsive Resize

The library listens for window resize events.

When the viewport changes:

1. Current animation progress is calculated.
2. Canvas dimensions are recalculated.
3. Mobile/desktop configuration is checked.
4. Scroll track can be rebuilt.
5. Previous animation progress is restored.
6. The correct frame is rendered again.
7. The `resize` callback is triggered if registered.

This prevents the animation from unexpectedly jumping back to frame zero after resizing.

---

# Scroll Tracking

The library creates a sequence of invisible frame sentinel elements.

Example:

```html
<div class="frame-sentinel"></div>
<div class="frame-sentinel"></div>
<div class="frame-sentinel"></div>
```

Each sentinel represents an animation frame.

If content is associated with a frame, the content is inserted into the corresponding sentinel.

The sentinel positions are stored in:

```javascript
this.framePositions
```

The scroll position is then converted into a frame using binary search.

---

# IntersectionObserver

Initial image loading is delayed until the animation container approaches the viewport.

The observer uses:

```javascript
rootMargin: "200px"
```

When the container becomes visible:

```javascript
startIntialLoading()
```

is executed.

This avoids loading the animation before it is needed.

---

# Events / Callbacks

The library provides an event API:

```javascript
video.on(type, handler);
```

Example:

```javascript
video.on('update', function(data) {
    console.log(data);
});
```

The method is chainable:

```javascript
video
    .on('start', function(data) {
        console.log('Animation started');
    })
    .on('complete', function(data) {
        console.log('Animation completed');
    });
```

---

# Available Events

## `update`

Called when the animation frame is updated.

```javascript
video.on('update', function(data) {
    console.log(data);
});
```

Example data:

```javascript
{
    frame: 120,
    totalFrames: 600,
    progress: 0.2,
    velocity: 1.45,
    isMobile: false,
    direction: 'down'
}
```

---

## `start`

Triggered when the animation moves beyond the first frame.

```javascript
video.on('start', function(data) {
    console.log('Animation started');
});
```

The callback is protected from repeated firing until the animation returns to frame zero.

---

## `complete`

Triggered when the final frame is reached.

```javascript
video.on('complete', function(data) {
    console.log('Animation completed');
});
```

The callback is fired once per traversal to the end.

---

## `resize`

Triggered after responsive resizing has completed.

```javascript
video.on('resize', function(data) {
    console.log(data.progress);
});
```

Example:

```javascript
{
    progress: 0.53
}
```

---

# `render` Callback

The constructor also supports:

```javascript
render: function({ status }) {
    console.log(status);
}
```

The status object contains animation information similar to the `update` event.

Example:

```javascript
render: function({ status }) {
    console.log(
        status.frame,
        status.progress
    );
}
```

---

# Event Data

Animation callbacks receive:

```javascript
{
    frame: Number,
    totalFrames: Number,
    progress: Number,
    velocity: Number,
    isMobile: Boolean,
    direction: String
}
```

### `frame`

Current rounded frame number.

### `totalFrames`

Total number of frames in the current animation.

### `progress`

Animation progress between `0` and `1`.

Example:

```text
0      = beginning
0.5    = middle
1      = end
```

### `velocity`

Current animation velocity.

### `isMobile`

Whether the current configuration is mobile.

### `direction`

Current animation direction:

```text
down
```

or:

```text
up
```

---

# Debug Mode

Enable debugging:

```javascript
const video = new videoMaker('#video-container', {
    debug: true
});
```

A floating debug panel displays:

```text
Frame: 120 / 600
Target: 125
Velocity: 1.24
FPS: 60
Cache: 42
Progress: 0.200
```

This is useful when tuning:

* Frame count
* Preload ranges
* Cache limits
* Animation smoothness
* Scroll behavior
* FPS performance

---

# Complete Example

```html
<div id="video-container"></div>

<div id="video-scroll-area"></div>

<script src="/assets/js/video.js"></script>

<script>
const video = new videoMaker('#video-container', {

    live_url: '/assets/images/',

    image_extension: '.jpg',

    responsiveStart: 767,

    scrollAreaElement: '#video-scroll-area',

    desktop: {
        folderName: 'video-desktop',
        image_Prefix: 'video',
        startPos: 1,
        endPos: 601,
        animationGap: 50
    },

    mobile: {
        folderName: 'video-mobile',
        image_Prefix: 'video',
        startPos: 1,
        endPos: 601,
        animationGap: 50
    },

    debug: false,

    useCache: true,

    render: function({ status }) {
        console.log(status);
    }
});

video
    .on('start', function(data) {
        console.log('Animation started', data);
    })
    .on('update', function(data) {
        console.log('Frame:', data.frame);
    })
    .on('complete', function(data) {
        console.log('Animation completed', data);
    })
    .on('resize', function(data) {
        console.log('Resize progress:', data.progress);
    });

video.init();
</script>
```

---

# Recommended Asset Structure

```text
project/
│
├── index.html
│
├── assets/
│   ├── js/
│   │   └── video.js
│   │
│   └── images/
│       │
│       ├── video-desktop/
│       │   ├── video (1).jpg
│       │   ├── video (2).jpg
│       │   ├── video (3).jpg
│       │   └── ...
│       │
│       └── video-mobile/
│           ├── video (1).jpg
│           ├── video (2).jpg
│           ├── video (3).jpg
│           └── ...
```

---

# Performance Recommendations

## 1. Use appropriately sized images

Do not use unnecessarily large source images.

For mobile sequences, provide mobile-specific assets.

## 2. Use WebP when possible

```javascript
image_extension: '.webp'
```

This can significantly reduce network transfer compared with large JPEG sequences.

## 3. Keep frame counts reasonable

A sequence with hundreds or thousands of frames can consume significant network bandwidth.

## 4. Enable cache

For production:

```javascript
useCache: true
```

is recommended.

## 5. Test mobile separately

Mobile devices have significantly different memory and network characteristics.

The library already reduces preload behavior on mobile and slower connections.

## 6. Use debug mode during development

```javascript
debug: true
```

Disable it in production:

```javascript
debug: false
```

---

# Browser APIs Used

The library uses modern browser APIs including:

* HTML5 Canvas
* `requestAnimationFrame`
* `IntersectionObserver`
* `Image`
* `Image.decode()`
* `performance.now()`
* `navigator.connection`
* `requestIdleCallback` when available

Browsers that do not support `requestIdleCallback` automatically fall back to `setTimeout`.

---

# API Reference

| Method                    | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `init()`                  | Initializes canvas, scroll tracking, observer and resize handling |
| `load(index)`             | Loads an individual frame                                         |
| `render_animation(frame)` | Renders a specific frame                                          |
| `draw(image)`             | Draws an image onto the canvas                                    |
| `resizeCanvas()`          | Updates canvas dimensions                                         |
| `buildCanvas()`           | Creates or initializes the canvas                                 |
| `buildScrollTrack()`      | Builds the frame-based scroll structure                           |
| `updateFromScroll()`      | Converts scroll position into a target frame                      |
| `preloadNear(frame)`      | Preloads frames around the current frame                          |
| `disposeOldestCache()`    | Removes the least useful cached frame                             |
| `schedule()`              | Starts animation rendering                                        |
| `animate()`               | Performs frame interpolation                                      |
| `fireEvent()`             | Dispatches animation callbacks                                    |
| `on(type, handler)`       | Registers a custom callback                                       |
| `initDebug()`             | Initializes debug panel                                           |
| `updateDebug()`           | Updates debug/FPS information                                     |

---

# Animation Lifecycle

The typical lifecycle is:

```text
videoMaker()
     ↓
init()
     ↓
buildCanvas()
     ↓
IntersectionObserver
     ↓
startIntialLoading()
     ↓
buildScrollTrack()
     ↓
User Scroll
     ↓
updateFromScroll()
     ↓
schedule()
     ↓
animate()
     ↓
render_animation()
     ↓
load() / cache
     ↓
draw()
     ↓
fireEvent()
```

---

# Version

Current source version:

```text
1.0.1
```

The current source identifies the module as `video` and describes it as an image-to-video conversion library.

---

# Author

**Vishal Rathour**

---

# Evolution From Previous Version

The current implementation is an evolution of the original `transform-images-into-videos-on-scroll` project.

The original project focused primarily on converting an image sequence into a scroll-controlled canvas video and provided desktop/mobile configuration, content insertion, and basic callbacks.

The current implementation expands that architecture with:

* Smooth frame interpolation
* Velocity-based animation
* Intelligent directional preloading
* Network-aware preload behavior
* Automatic cache cleanup
* Mobile memory optimization
* High-DPI canvas rendering
* Responsive device switching
* Scroll-track generation
* Binary-search frame lookup
* IntersectionObserver-based lazy loading
* Image decoding
* FPS/debug monitoring
* `start`, `update`, `complete`, and `resize` events
* Cache-busting support
* Dynamic content heights
* Improved resize state restoration

This makes the current implementation more suitable for production-grade immersive storytelling and long image-sequence animations.

---

# Example Production Configuration

```javascript
const video = new videoMaker('#canvas-container', {

    canvasID: '#video-canvas',

    live_url:
        'https://example.com/assets/images/',

    image_extension: '.webp',

    responsiveStart: 767,

    scrollAreaElement:
        '#video-scroll-area',

    desktop: {
        folderName: 'desktop',
        image_Prefix: 'video',
        startPos: 1,
        endPos: 800,
        animationGap: 60
    },

    mobile: {
        folderName: 'mobile',
        image_Prefix: 'video',
        startPos: 1,
        endPos: 800,
        animationGap: 40
    },

    useCache: true,

    debug: false,

    contentSetHeight: '500px',

    contentData: [
        {
            dekstop_key: '100',
            mobile_key: '80',
            content:
                '<div class="story-content">' +
                '<h2>Story Title</h2>' +
                '<p>Story description.</p>' +
                '</div>',
            height: '500px'
        }
    ],

    render: function({ status }) {
        // Optional external rendering callback
        console.log(status);
    }
});

video
    .on('start', function(data) {
        console.log('Video started');
    })
    .on('update', function(data) {
        // Update external UI
    })
    .on('complete', function(data) {
        console.log('Video completed');
    })
    .on('resize', function(data) {
        console.log('Video resized');
    });

video.init();
```

---

# Troubleshooting

## Canvas is blank

Check:

1. `live_url`
2. `folderName`
3. `image_Prefix`
4. `startPos`
5. `endPos`
6. `image_extension`
7. Image URLs in the browser network panel.

For example:

```text
/assets/images/desktop/video (1).jpg
```

must actually exist.

---

## Animation does not move

Verify that:

```javascript
scrollAreaElement
```

points to a valid scrolling element and that the generated scroll track has enough height.

---

## Images load slowly

Consider:

* WebP assets
* Smaller source dimensions
* Fewer frames
* Proper CDN configuration
* Appropriate preload ranges

---

## High memory usage

The library already performs cache cleanup, but very large image sequences can still require significant memory.

Consider reducing:

```text
frame count
```

or:

```text
image dimensions
```

especially on mobile.

---

## Mobile animation is different from desktop

This is expected when separate configurations are supplied.

Check:

```javascript
mobile: {}
```

and:

```javascript
desktop: {}
```

for matching frame counts and correct asset paths.

---

