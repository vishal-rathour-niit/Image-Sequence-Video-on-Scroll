/**
 * video.js
 *
 * @module video
 * @version 1.0.1
 * @description convret-images-to-video
 * @author Vishal Rathour
 * @copyright India Today Group
 */

function videoMaker(el, options){
    this.canvasContainer = typeof el === "string" ? document.querySelector(el) : el;
    this.desktop  = options?.desktop || {};
	this.mobile = options?.mobile || {};
    this.canvas_id = options?.canvasID || null;
    this.responsiveStart = options?.responsiveStart || 767;
    this.image_extension = options?.image_extension || '.jpg';
    this.live_url = options?.live_url || '';
    this.rootMargin = options?.rootMargin || '0px';
    this.render = options?.render || null;
    this.root = options?.root || null;
    this.onMethod = {};
    this.isDyanamicId  = options?.isDyanamicId || false;
    this.dyanamicIDPrefic = options?.dyanamicIDPrefic || undefined;
    this.contentData = options?.contentData || [];
    this.contentSetHeight = options?.contentSetHeight || 'auto';
    this.resizeTiming = 500;
    this.dimention = {"width": window.innerWidth, "height":window.innerHeight};
    this.device = window.innerWidth <= this.responsiveStart ? this.mobile : this.desktop;
    this.scrollContainer = typeof options?.scrollAreaElement  === "string" ? document.querySelector( options?.scrollAreaElement) : options?.scrollAreaElement;
   

   // Performance Settings
    this.preload = options?.preload || 20;
    this.cleanup = options?.cleanup || 80; // Strict for mobile memory
    this.damping = 0.82; 
    this.easeFactor = 0.025;
   
    this.cache = [];
    this.canvas = null;
    this.ctx = null;
    this.totalFrame = 0;
	this.targetFrame = 0;
	this.currentFrame = 0;
	this.lastRendered = -1;
	this.velocity = 0;
	this.rafId = null;

    this.animate = this.animate.bind(this);
    this.last_width = window.innerWidth;
    this.sessionVersion = null;
    this.useCache = options?.useCache ?? true;

    this.contentMap = new Map();
    this.maxScroll = 0;
    this.containerTop = 0;
    this.framePositions = [];
    this.debug = options?.debug || false;
    this.debugPanel = null;
    this.fps = 0;
    this.lastFpsTime = performance.now();
    this.frameCount = 0;
    this.cacheKeys = [];

    this.contentData.length > 0 && this.contentData.forEach(item => {
        if (item.mobile_key) this.contentMap.set(item.mobile_key, item);
        if (item.dekstop_key) this.contentMap.set(item.dekstop_key, item);
    });
    
    
    this.scrollPending = false;
    this.preloadScheduled = false;

    if(!this.useCache){
        this.sessionVersion = this.getRandomNumber(); 
    }
    
}

videoMaker.prototype.getRandomNumber = function() {
    return Date.now(); 
};

videoMaker.prototype.getSrc = function(index) {
    const frameNumber = this.device.startPos + index;
    const baseUrl = `${this.live_url}${this.device.folderName}/${this.device.image_Prefix} (${frameNumber})${this.image_extension}`;
    if(this.sessionVersion){
        return `${baseUrl}?v=${this.sessionVersion}`;
    }
    return baseUrl;
};


videoMaker.prototype.buildCanvas = function(){
    if(this.canvas_id){
        this.canvas = document.querySelector(this.canvas_id);
        this.ctx = this.canvas.getContext("2d", {
            alpha:false,
            desynchronized:true
        });
    }
    else{
        this.canvas  = document.createElement('canvas');
        this.canvas.setAttribute('id', "video-canvas")
        this.ctx = this.canvas.getContext("2d",{
            alpha:false,
            desynchronized:true
        });
        this.canvasContainer.append(this.canvas);
    }

    this.resizeCanvas(); 


};

videoMaker.prototype.resizeCanvas = async function() {
    // 1. Force the rect to use the actual offsetHeight of the container
    const width = this.canvasContainer.offsetWidth;
    const height = this.canvasContainer.offsetHeight;
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // 2. Set PHYSICAL pixels (Resolution)
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // 3. Set CSS pixels (Display)
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    // 4. Update internal tracking
    this.dimention.width = width;
    this.dimention.height = height;

    // 5. Reset the coordinate system
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isNowMobile = width <= this.responsiveStart;
    const newMode = isNowMobile ? 'mobile' : 'desktop';

    if (newMode !== this.currentDeviceMode) {
        this.currentDeviceMode = newMode;
        this.device = isNowMobile ? this.mobile : this.desktop;
        this.cache = [];
        await this.buildScrollTrack();
    }
};


videoMaker.prototype.buildScrollTrack = function() {
    return new Promise((resolve, reject) => {
        if (!this.scrollContainer) { reject('no scroller element found.'); return; }
        
        const fragment = document.createDocumentFragment();
        this.scrollContainer.innerHTML = "";
        const frameCount = this.device.endPos - this.device.startPos;
        const isMobile = this.dimention.width <= this.responsiveStart;

        for (let i = 0; i < frameCount; i++) {
            const sentinel = document.createElement("div");
            sentinel.className = "frame-sentinel";
            sentinel.dataset.index = i;
            sentinel.dataset.view = isMobile ? 'mobile-image':'desktop-image';
            
            const frameId = (this.device.startPos + i).toString();
            const contentMatch = this.contentMap.get(frameId);

            if (contentMatch) {
                const textDiv = document.createElement("div");
                textDiv.className = "slide-text-between";
                textDiv.innerHTML = "<div class='slide-text-container'>" + contentMatch.content + "</div>";
                const height = contentMatch.hasOwnProperty('height') ? contentMatch.height : (this.contentSetHeight || '500px');
               
                if (isMobile) {
                    if(contentMatch.hasOwnProperty('height')){textDiv.style.height = height}
                    else{textDiv.style.height = 'auto';}
                } else {
                    textDiv.style.height = height;
                }
                sentinel.appendChild(textDiv);
            } else {
                sentinel.style.height = (this.device.animationGap || 50) + 'px';
            }

            fragment.appendChild(sentinel);
        }
        
        this.scrollContainer.append(fragment);
        this.totalFrame = frameCount;
        resolve(this.totalFrame);
    });
};

videoMaker.prototype.load = function(index) {
    if (this.cache[index]) return this.cache[index];
    const src = this.getSrc(index);
    const img = new Image();
    img.crossOrigin = "anonymous";

    const promise = new Promise((resolve, reject) => {

        img.onload = async () => {
            try {
                await img.decode();
            } catch(e){}

            this.cache[index] = img;
            this.cacheKeys.push(index);
            resolve(img);
        };

        img.onerror = reject;

    });

    img.src = src;

    this.cache[index] = promise;
    this.cacheKeys.push(index);

    const isMobile = window.innerWidth <= this.responsiveStart;
    const limit = isMobile ? 20 : this.cleanup;

    if (this.cache.length > limit) {
        this.disposeOldestCache();
    }

    return promise;
};

videoMaker.prototype.render_animation = function(frame){
    frame = frame | 0;
    if(frame < 0) frame = 0;
    if(frame >= this.totalFrame) frame = this.totalFrame - 1;
    const asset = this.cache[frame];

    if(asset instanceof HTMLImageElement || asset instanceof ImageBitmap){
        this.draw(asset);
    } else {

        this.load(frame).then(img=>{
            if(Math.round(this.currentFrame) === frame){
                this.draw(img);
            }
        });

    }

    if (!this.preloadScheduled) {
        this.preloadScheduled = true;
        const run = () => {
            this.preloadNear(frame);
            this.preloadScheduled = false;
        };

        if ("requestIdleCallback" in window) {
            requestIdleCallback(run);
        } else {
            setTimeout(run, 50);
        }
    }

}

videoMaker.prototype.disposeOldestCache = function(){
    if(!this.cacheKeys.length) return;

    let farthest = this.cacheKeys[0];
    let farthestDist = Math.abs(farthest - this.currentFrame);

    for(let i=1;i<this.cacheKeys.length;i++){
        const k = this.cacheKeys[i];
        const dist = Math.abs(k - this.currentFrame);

        if(dist > farthestDist){
            farthestDist = dist;
            farthest = k;
        }
    }

    const img = this.cache[farthest];
    if(img instanceof HTMLImageElement) img.src = "";

    this.cache[farthest] = null;
    this.cacheKeys = this.cacheKeys.filter(k => k !== farthest);
};


videoMaker.prototype.draw = function(img) {
    if (!img || !this.ctx) return;

    // 1. Performance Throttling (60fps limit)
    const now = performance.now();
    if (now - (this.lastDraw || 0) < 16) return;
    this.lastDraw = now;

    // 2. Get Natural Image Dimensions
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (iw === 0 || ih === 0) return;

    // 3. Get Logical Canvas Dimensions (from resizeCanvas)
    const cw = this.dimention.width;
    const ch = this.dimention.height;

    /**
     * 4. Calculate Scale (Cover Logic)
     * We use Math.max to ensure the image is scaled up until 
     * it covers the ENTIRE canvas height (ch). 
     * This prevents the "cut from bottom" or "gap at bottom" issue.
     */
    const scale = Math.max(cw / iw, ch / ih);

    const nw = iw * scale;
    const nh = ih * scale;

    /**
     * 5. Centering Coordinates
     * cx: Centers horizontally (crops left/right if image is too wide)
     * cy: Centers vertically (crops top/bottom if image is too tall)
     * This ensures the image is pinned to the center of your 100dvh container.
     */
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    // 6. Clear the Logical Canvas Area
    // We use cw/ch because setTransform(dpr) is handling the physical scaling
    this.ctx.clearRect(0, 0, cw, ch);

    // 7. Execute Draw
    this.ctx.drawImage(img, cx, cy, nw, nh);

    // 8. Debugging (Optional)
    if (this.debug) {
        this.ctx.save(); // Save state so debug styles don't bleed
        this.ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
        this.ctx.font = "bold 14px monospace";
        this.ctx.fillText(`FRAME: ${Math.round(this.currentFrame)}`, 20, 30);
        this.ctx.fillText(`CANVAS: ${Math.round(cw)}x${Math.round(ch)}`, 20, 50);
        this.ctx.fillText(`SCALE: ${scale.toFixed(4)}`, 20, 70);
        this.ctx.restore();
    }
};

videoMaker.prototype.findFrameIndex = function(scrollY){
    // binary search forn fast finding
    let low = 0;
    let high = this.framePositions.length - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (this.framePositions[mid] <= scrollY) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return Math.max(0, high);
};

videoMaker.prototype.updateFromScroll = function(){
    const scrollY = Math.max(0,Math.min(window.scrollY - this.containerTop, this.maxScroll));
    if (scrollY <= 0) {
        this.targetFrame = 0;
        this.schedule();
        return;
    }

    const frame = this.findFrameIndex(scrollY);  // binary search finder
    this.targetFrame = frame;
    this.schedule();
};

videoMaker.prototype.getRanges = function() {
    const isMobile = window.innerWidth <= this.responsiveStart;
    let ranges = isMobile ? { forward: 12, backward: 4 }: { forward: 40, backward: 15 };
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
        if (conn.saveData || /2g|3g/.test(conn.effectiveType)) {
            ranges.forward = 6;  
            ranges.backward = 2; 
        }
    }
    return ranges;
};


videoMaker.prototype.preloadNear = function(center) {
    const direction = this.velocity >= 0 ? 1 : -1;
    const { forward, backward } = this.getRanges();

    for (let i = 1; i <= forward; i++) {
        const f = center + (i * direction);
        if (f >= 0 && f < this.totalFrame) this.load(f);
    }
    for (let j = 1; j <= backward; j++) {
        const b = center - (j * direction);
        if (b >= 0 && b < this.totalFrame) this.load(b);
    }
};

videoMaker.prototype.animate = function() {
    const delta = this.targetFrame - this.currentFrame;
    this.velocity = this.velocity * this.damping + delta * this.easeFactor;
    this.currentFrame += this.velocity;

    const frame = (this.currentFrame + 0.5) | 0;

    if (frame !== this.lastRendered) {
        this.render_animation(frame);
        this.lastRendered = frame;
        this.fireEvent();
        this.updateDebug();
    }

    if (Math.abs(delta) < 0.001 && Math.abs(this.velocity) < 0.001) {
        this.currentFrame = this.targetFrame;
        this.velocity = 0; 
        this.rafId = null;
        this.fireEvent();
        return; 
    }

    if(Math.abs(this.velocity) < 0.0005 && Math.abs(delta) < 0.0005){
        this.rafId = null;
        return;
    }

    this.rafId = requestAnimationFrame(this.animate);
};


videoMaker.prototype.schedule = function(){
    if (!this.rafId) this.rafId = requestAnimationFrame(this.animate);
}


videoMaker.prototype.startIntialLoading = function(){
    const initial = window.innerWidth <= this.responsiveStart ? 8 : 40;
    for (let i = 0; i < initial; i++) {
        this.load(i);
    }
    this.render_animation(0);
};

videoMaker.prototype.init = function() {
    const rect = this.canvasContainer?.getBoundingClientRect() || { "width": window.innerWidth, "height": window.innerHeight };
    this.currentDeviceMode = rect.width <= this.responsiveStart ? 'mobile' : 'desktop';
    
    this.buildCanvas();
    this.initDebug();
    const observer = new IntersectionObserver((entries)=>{
        if(entries[0].isIntersecting){
            this.startIntialLoading();
            observer.disconnect();
        }

    },{ rootMargin:"200px" });

observer.observe(this.canvasContainer);
    
    window.addEventListener('resize', () => {
        const currentWidth = window.innerWidth;
        //if (currentWidth === this.last_width) return; 
        
        this.isResizing = true; 
        const progress = this.currentFrame / (this.totalFrame - 1 || 1);
        
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(async () => {
            await this.resizeCanvas();

            const restoredFrame = Math.round(progress * (this.totalFrame - 1));
            this.currentFrame = restoredFrame;
            this.targetFrame = restoredFrame;
            this.isResizing = false;
            this.last_width = currentWidth; 
            if (this.onMethod['resize']) this.onMethod['resize'].call(this, { progress });
            this.render_animation(restoredFrame);
        }, 150);
    });

    this.buildScrollTrack().then(() => {
        this.framePositions = [];
        const sentinels = this.scrollContainer.querySelectorAll(".frame-sentinel");
        sentinels.forEach(el => {
            this.framePositions.push(el.offsetTop);
        });

        this.maxScroll = this.scrollContainer.scrollHeight - window.innerHeight;
        const rect = this.scrollContainer.getBoundingClientRect();
        this.containerTop = window.scrollY + rect.top;

        this.onScroll = () => {
            if(!this.scrollPending){
                this.scrollPending = true;
                requestAnimationFrame(()=>{
                    this.updateFromScroll();
                    this.scrollPending = false;
                });
            }
        };

        window.addEventListener("scroll", this.onScroll, { passive:true });

    }).catch((e) => console.log("error :- ", e));

    
    
};

videoMaker.prototype.fireEvent = function() {
    const total = this.totalFrame - 1 || 1;
    const currentRounded = Math.round(this.currentFrame);
    
    const data = {
        frame: currentRounded,
        totalFrames: this.totalFrame,
        progress: Number((this.currentFrame / total).toFixed(4)),
        velocity: this.velocity,
        isMobile: window.innerWidth <= this.responsiveStart,
        direction: this.velocity > 0 ? 'down' : 'up',
    };

   
    if (typeof this.render === 'function') this.render.call(this, { status: data });
    if (this.onMethod['update']) this.onMethod['update'].call(this, data);

    
    if (data.frame > 0 && this.onMethod['start']) {
        if (!this.hasFiredStart) {
            this.onMethod['start'].call(this, data);
            this.hasFiredStart = true;
        }
    } else if (data.frame === 0) {
        this.hasFiredStart = false; 
    }

    if (data.frame === total && this.onMethod['complete']) {
        if (!this.hasFiredComplete) {
            this.onMethod['complete'].call(this, data);
            this.hasFiredComplete = true; 
        }
    } else {
        this.hasFiredComplete = false; 
    }
};

videoMaker.prototype.on = function(type, handler) {
    this.onMethod[type] = handler;
    return this; 
};



videoMaker.prototype.initDebug = function(){
    if(!this.debug) return;
    const panel = document.createElement("div");

    panel.style.position = "fixed";
    panel.style.bottom = "10px";
    panel.style.right = "10px";
    panel.style.padding = "8px 10px";
    panel.style.background = "rgba(0,0,0,0.75)";
    panel.style.color = "#0f0";
    panel.style.fontSize = "12px";
    panel.style.fontFamily = "monospace";
    panel.style.zIndex = "99999";
    panel.style.borderRadius = "4px";

    panel.innerHTML = "Initializing...";

    document.body.appendChild(panel);

    this.debugPanel = panel;

};


videoMaker.prototype.updateDebug = function(){
    if(!this.debugPanel) return;
    const now = performance.now();
    this.frameCount++;
    if(now - this.lastFpsTime >= 1000){
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTime = now;
    }

    this.debugPanel.innerHTML = `
        Frame: ${Math.round(this.currentFrame)} / ${this.totalFrame}<br>
        Target: ${this.targetFrame}<br>
        Velocity: ${this.velocity.toFixed(2)}<br>
        FPS: ${this.fps}<br>
        Cache: ${this.cache.length}<br>
        Progress: ${(this.currentFrame/(this.totalFrame-1)).toFixed(3)}
        `;
};