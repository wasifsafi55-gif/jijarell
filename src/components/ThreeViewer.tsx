import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RefreshCw, RotateCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ThreeViewerProps {
  type: 'watch' | 'shoe' | 'bag';
  activeColor?: string;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const supportsWebGL = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
    if (!supportsWebGL) return false;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as any;
    if (!gl) return false;

    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }
    return true;
  } catch (e) {
    return false;
  }
}

export default function ThreeViewer({ type, activeColor }: ThreeViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(() => !checkWebGLSupport());
  const [loading, setLoading] = useState(() => !webglError);
  const [helpText, setHelpText] = useState('Drag to rotate, scroll to zoom');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const fallbackContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || webglError) return;

    setLoading(true);
    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbfbfb); // Very soft warm white to match luxurious grid

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    // 3. Renderer with WebGL error trapping
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn("WebGL initialization failed, falling back to rich vector-ambient 2.5D canvas.", err);
      setWebglError(true);
      setLoading(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff8ee, 1.3); // Soft golden light tint
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.5); // Soft blue bounce
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    // 5. Build High-Fidelity Custom Procedural Luxury Geometries
    const productGroup = new THREE.Group();
    let meshColor = 0xd4af37; // Standard Gold

    if (activeColor) {
      if (activeColor.toLowerCase().includes('black') || activeColor.toLowerCase().includes('onyx')) {
        meshColor = 0x181818;
      } else if (activeColor.toLowerCase().includes('brown') || activeColor.toLowerCase().includes('espresso') || activeColor.toLowerCase().includes('cognac')) {
        meshColor = 0x5c4033;
      } else if (activeColor.toLowerCase().includes('crimson') || activeColor.toLowerCase().includes('red')) {
        meshColor = 0x8b0000;
      } else if (activeColor.toLowerCase().includes('desert') || activeColor.toLowerCase().includes('sand')) {
        meshColor = 0xc2b280;
      }
    }

    if (type === 'watch') {
      // Dial Casing (Titanium/Gold ring)
      const ringGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.35, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: meshColor === 0x181818 ? 0x242424 : 0xd4af37,
        metalness: 0.9,
        roughness: 0.15
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      productGroup.add(ring);

      // Dial face
      const faceGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.05, 32);
      const faceMat = new THREE.MeshStandardMaterial({
        color: 0x121212, // Dark luxury obsidian plate
        roughness: 0.2
      });
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.y = 0.16;
      face.rotation.x = Math.PI / 2;
      productGroup.add(face);

      // Watch hands
      const hourHandGeo = new THREE.BoxGeometry(0.1, 0.8, 0.02);
      const handMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.1 });
      const hourHand = new THREE.Mesh(hourHandGeo, handMat);
      hourHand.position.set(0, 0.2, 0.3);
      hourHand.rotation.z = Math.PI / 4;
      productGroup.add(hourHand);

      const minuteHandGeo = new THREE.BoxGeometry(0.06, 1.2, 0.02);
      const minuteHand = new THREE.Mesh(minuteHandGeo, handMat);
      minuteHand.position.set(0.2, 0.4, 0.3);
      minuteHand.rotation.z = -Math.PI / 6;
      productGroup.add(minuteHand);

      // Luxury leather band
      const bandGeo = new THREE.BoxGeometry(0.8, 0.15, 4.2);
      const bandMat = new THREE.MeshStandardMaterial({
        color: meshColor === 0xd4af37 ? 0x221100 : meshColor,
        roughness: 0.8,
        bumpScale: 0.05
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(0, -0.2, 0);
      productGroup.add(band);

    } else if (type === 'shoe') {
      // Sole
      const soleGeo = new THREE.BoxGeometry(1.2, 0.3, 3.4);
      const soleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.y = -0.5;
      productGroup.add(sole);

      // Main Shoe Body
      const bodyGeo = new THREE.ConeGeometry(0.9, 2.6, 4);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: meshColor,
        roughness: 0.45,
        metalness: 0.1
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = -Math.PI / 2.3;
      body.rotation.z = Math.PI;
      body.position.set(0, 0, 0.3);
      productGroup.add(body);

      // Heel collar
      const heelGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.9, 16);
      const heelMat = new THREE.MeshStandardMaterial({ color: meshColor === 0x181818 ? 0x050505 : meshColor });
      const heel = new THREE.Mesh(heelGeo, heelMat);
      heel.position.set(0, 0.1, -0.7);
      productGroup.add(heel);

    } else { // bag
      // Main Body
      const bodyGeo = new THREE.BoxGeometry(2.6, 1.8, 1.6);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: meshColor,
        roughness: 0.6,
        bumpScale: 0.05
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      productGroup.add(body);

      // Gold corners
      const cornerGeo = new THREE.BoxGeometry(0.4, 0.4, 1.65);
      const cornerMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
      
      const leftCorner = new THREE.Mesh(cornerGeo, cornerMat);
      leftCorner.position.set(-1.1, -0.7, 0);
      productGroup.add(leftCorner);

      const rightCorner = leftCorner.clone();
      rightCorner.position.x = 1.1;
      productGroup.add(rightCorner);

      // Double Handles (Torus half-rings)
      const handleGeo = new THREE.TorusGeometry(0.7, 0.1, 16, 32, Math.PI);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(0, 0.9, 0);
      productGroup.add(handle);
    }

    scene.add(productGroup);

    // Subtle automatic rotation sweep
    let autoRotate = true;

    // 6. User Interaction state
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      productGroup.rotation.y += deltaMove.x * 0.01;
      productGroup.rotation.x += deltaMove.y * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Zoom on wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.008;
      camera.position.z = Math.max(3, Math.min(camera.position.z, 15));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Touch Support
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      autoRotate = false;
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const deltaMove = {
          x: e.touches[0].clientX - previousMousePosition.x,
          y: e.touches[0].clientY - previousMousePosition.y
        };
        productGroup.rotation.y += deltaMove.x * 0.012;
        productGroup.rotation.x += deltaMove.y * 0.012;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = (dist - touchStartDist) * 0.01;
        camera.position.z -= factor;
        camera.position.z = Math.max(3, Math.min(camera.position.z, 15));
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd);

    // 7. Animation loop
    let requestID: number;
    const clock = new THREE.Clock();

    const animate = () => {
      requestID = requestAnimationFrame(animate);

      if (autoRotate) {
        const elapsed = clock.getElapsedTime();
        productGroup.rotation.y = elapsed * 0.35;
        productGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.15;
      }

      renderer.render(scene, camera);
    };

    setLoading(false);
    animate();

    // Resize Handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Dispose everything cleanly
    return () => {
      cancelAnimationFrame(requestID);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      resizeObserver.disconnect();
      
      try {
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        if (renderer) {
          renderer.dispose();
        }
      } catch (err) {
        // Safe fail
      }
    };
  }, [type, activeColor, webglError]);

  const getHexColor = () => {
    if (!activeColor) return '#d4af37'; // Luxurious Gold
    const col = activeColor.toLowerCase();
    if (col.includes('black') || col.includes('onyx') || col.includes('charcoal')) return '#181c20';
    if (col.includes('brown') || col.includes('espresso') || col.includes('cognac')) return '#5c4033';
    if (col.includes('crimson') || col.includes('red') || col.includes('maroon')) return '#8b0000';
    if (col.includes('desert') || col.includes('sand') || col.includes('beige')) return '#d4b795';
    if (col.includes('white') || col.includes('ivory') || col.includes('silver')) return '#e2e8f0';
    return activeColor; // Or fallback
  };

  const handleFallbackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fallbackContainerRef.current) return;
    const rect = fallbackContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentages from center (-0.5 to 0.5)
    const pctX = (x / rect.width) - 0.5;
    const pctY = (y / rect.height) - 0.5;
    
    // Tilt intensity
    setTilt({
      x: pctX * 24, // Rotate up to 24 degrees horizontally
      y: -pctY * 24 // Rotate up to 24 degrees vertically
    });
  };

  const handleFallbackMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleFallbackMouseEnter = () => {
    setIsHovered(true);
  };

  const fallbackHexColor = getHexColor();

  const renderFallback = () => {
    const tiltStyle = {
      transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${isHovered ? 1.05 : 1})`,
      transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    };

    return (
      <div 
        ref={fallbackContainerRef}
        onMouseMove={handleFallbackMouseMove}
        onMouseEnter={handleFallbackMouseEnter}
        onMouseLeave={handleFallbackMouseLeave}
        className="relative w-full h-full min-h-[300px] bg-gradient-to-b from-[#fdfdfd] to-[#f5f5f5] flex items-center justify-center p-8 select-none overflow-hidden rounded-2xl border border-stone-150"
      >
        {/* Ambient backdrop glow */}
        <div 
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-25 transition-all duration-700 ease-out"
          style={{
            background: fallbackHexColor,
            transform: `translate(${tilt.x * 0.8}px, ${-tilt.y * 0.8}px)`,
          }}
        />

        {/* 3D Looking Floating Shadow */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-4 bg-stone-900/10 rounded-full blur-md transition-all duration-500 ease-out"
          style={{
            transform: `translateX(-50%) scale(${isHovered ? 1.1 : 1}) translate(${tilt.x * 0.3}px, ${-tilt.y * 0.1}px)`,
            opacity: isHovered ? 0.35 : 0.25,
          }}
        />

        {/* Dynamic Interactive SVG Container */}
        <div 
          style={tiltStyle} 
          className="relative w-52 h-52 flex items-center justify-center drop-shadow-2xl filter"
        >
          {type === 'watch' && (
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="goldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f9d976" />
                  <stop offset="50%" stopColor="#e9b646" />
                  <stop offset="100%" stopColor="#916a1c" />
                </linearGradient>
                <linearGradient id="bezelReflection" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="strapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={fallbackHexColor} stopOpacity="0.85" />
                  <stop offset="50%" stopColor={fallbackHexColor} />
                  <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="dialFace" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a1c1e" />
                  <stop offset="100%" stopColor="#0a0b0d" />
                </linearGradient>
              </defs>

              {/* Watch Straps */}
              {/* Upper Strap */}
              <path 
                d="M 80 40 L 120 40 L 115 5 C 115 1, 85 1, 85 5 Z" 
                fill="url(#strapGrad)" 
                stroke="#111" 
                strokeWidth="0.5"
              />
              {/* Lower Strap */}
              <path 
                d="M 80 160 L 120 160 L 115 195 C 115 199, 85 199, 85 195 Z" 
                fill="url(#strapGrad)" 
                stroke="#111" 
                strokeWidth="0.5"
              />

              {/* Stitching details on straps */}
              <path d="M 84 5 L 84 40 M 116 5 L 116 40" fill="none" stroke="#6b5b45" strokeWidth="0.75" strokeDasharray="3 2" opacity="0.6"/>
              <path d="M 84 160 L 84 195 M 116 160 L 116 195" fill="none" stroke="#6b5b45" strokeWidth="0.75" strokeDasharray="3 2" opacity="0.6"/>

              {/* Watch Crown (Setting Dial) */}
              <rect x="158" y="92" width="8" height="16" rx="2" fill="url(#goldBezel)" stroke="#332200" strokeWidth="0.5" />
              <line x1="161" y1="94" x2="161" y2="106" stroke="#443311" strokeWidth="1" />
              <line x1="163" y1="94" x2="163" y2="106" stroke="#443311" strokeWidth="1" />

              {/* Gold Bezel Outer Ring */}
              <circle cx="100" cy="100" r="60" fill="url(#goldBezel)" stroke="#221100" strokeWidth="0.5" />
              
              {/* Inner Dial Glass Face */}
              <circle cx="100" cy="100" r="50" fill="url(#dialFace)" />

              {/* Bezel inner metallic ridges */}
              <circle cx="100" cy="100" r="54" fill="none" stroke="#ffebc2" strokeWidth="0.5" opacity="0.4" />

              {/* Ticks & Dial Markers */}
              <g stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.75" strokeLinecap="round">
                {/* 12 o'clock luxury triangle */}
                <polygon points="100,56 96,62 104,62" fill="#d4af37" stroke="none" />
                
                {/* Hours tickers */}
                <line x1="100" y1="53" x2="100" y2="58" stroke="#d4af37" strokeWidth="1.5" />
                <line x1="150" y1="100" x2="145" y2="100" stroke="#d4af37" strokeWidth="1.5" />
                <line x1="100" y1="147" x2="100" y2="142" stroke="#d4af37" strokeWidth="1.5" />
                <line x1="50" y1="100" x2="55" y2="100" stroke="#d4af37" strokeWidth="1.5" />
                
                {/* Diagonal subtle markings */}
                <line x1="135" y1="65" x2="131" y2="69" />
                <line x1="135" y1="135" x2="131" y2="131" />
                <line x1="65" y1="135" x2="69" y2="131" />
                <line x1="65" y1="65" x2="69" y2="69" />
              </g>

              {/* Luxury Text Emblem */}
              <text x="100" y="80" textAnchor="middle" fill="#d4af37" fontSize="5" letterSpacing="1.5" fontWeight="bold" opacity="0.8">JIJARELL</text>
              <text x="100" y="86" textAnchor="middle" fill="#888" fontSize="3" letterSpacing="0.8" opacity="0.6">AUTOMATIC</text>

              {/* Date window */}
              <rect x="122" y="95" width="12" height="10" fill="#111" rx="1" stroke="#d4af37" strokeWidth="0.5" opacity="0.6"/>
              <text x="128" y="102" textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="bold">07</text>

              {/* Chrono Subdials */}
              <circle cx="100" cy="122" r="14" fill="#141517" stroke="#333" strokeWidth="0.5" />
              <path d="M 100 122 L 103 113" stroke="#e9b646" strokeWidth="0.75" />
              <circle cx="100" cy="122" r="1" fill="#fff" />

              {/* Watch Hands */}
              {/* Hour Hand */}
              <g transform="rotate(305 100 100)">
                <path d="M 100 102 L 97 100 L 100 68 L 103 100 Z" fill="#ffffff" stroke="#999" strokeWidth="0.5" />
                <line x1="100" y1="100" x2="100" y2="72" stroke="#d4af37" strokeWidth="1" />
              </g>

              {/* Minute Hand */}
              <g transform="rotate(55 100 100)">
                <path d="M 100 102 L 98 100 L 100 52 L 102 100 Z" fill="#ffffff" stroke="#999" strokeWidth="0.5" />
                <line x1="100" y1="100" x2="100" y2="55" stroke="#d4af37" strokeWidth="1" />
              </g>

              {/* Continuous mechanical sweeping second hand */}
              <g style={{ transformOrigin: '100px 100px', animation: 'sweep 12s linear infinite' }}>
                <line x1="100" y1="118" x2="100" y2="48" stroke="#d9383a" strokeWidth="0.75" strokeLinecap="round" />
                <circle cx="100" cy="48" r="2.5" fill="#d9383a" />
              </g>

              {/* Central Pin */}
              <circle cx="100" cy="100" r="3.5" fill="url(#goldBezel)" stroke="#000" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="1.5" fill="#000" />

              {/* Glass Reflection overlay */}
              <path d="M 52 80 A 50 50 0 0 1 148 80 Z" fill="url(#bezelReflection)" opacity="0.15" pointerEvents="none" />
              <circle cx="100" cy="100" r="50" fill="url(#bezelReflection)" opacity="0.08" pointerEvents="none" />
            </svg>
          )}

          {type === 'shoe' && (
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="shoeBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={fallbackHexColor} />
                  <stop offset="60%" stopColor={fallbackHexColor} />
                  <stop offset="100%" stopColor="#111" stopOpacity="0.45" />
                </linearGradient>
                <linearGradient id="goldAcc" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#d4af37" />
                </linearGradient>
                <linearGradient id="soleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#eeeeee" />
                  <stop offset="100%" stopColor="#cccccc" />
                </linearGradient>
              </defs>

              {/* Shoe Silhouette Layer */}
              <g transform="translate(10, 15)">
                {/* Back collar pull tab */}
                <path d="M 32 60 C 26 50, 26 56, 29 45 C 32 38, 38 41, 36 48 Z" fill="#d4af37" opacity="0.9" />

                {/* Main Shoe Body */}
                <path 
                  d="M 32 62 
                     C 30 75, 29 110, 31 130 
                     C 32 135, 40 142, 60 142
                     C 80 142, 140 142, 172 135
                     C 176 134, 180 128, 178 122
                     C 174 112, 165 98, 148 95
                     C 134 93, 118 90, 100 78
                     C 82 66, 68 56, 55 58
                     C 42 60, 34 50, 32 62 Z" 
                  fill="url(#shoeBodyGrad)" 
                  stroke="#111111" 
                  strokeWidth="1" 
                />

                {/* Contrast Stitching */}
                <path d="M 32 82 C 45 88, 55 88, 65 140" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />
                <path d="M 60 60 C 72 75, 95 90, 130 96" fill="none" stroke="#221111" strokeWidth="1" strokeDasharray="4 2" opacity="0.3" />
                <path d="M 125 96 C 138 102, 160 115, 172 135" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.4" />

                {/* Brand Stripe Panel */}
                <path d="M 75 88 C 90 92, 110 102, 115 138 L 100 139 C 95 110, 80 100, 65 98 Z" fill="url(#goldAcc)" opacity="0.85" />

                {/* Suede Toe Cap Layer */}
                <path d="M 148 95 C 160 100, 178 115, 178 122 C 178 125, 174 130, 165 133 C 150 124, 140 112, 138 100 Z" fill="#222" opacity="0.15" />

                {/* Lacing Panel */}
                <path d="M 68 62 C 78 72, 92 84, 98 94" fill="none" stroke="#111111" strokeWidth="3" opacity="0.15" strokeLinecap="round" />
                <g stroke="#ffffff" strokeWidth="1" strokeLinecap="round">
                  <line x1="68" y1="65" x2="78" y2="72" opacity="0.9" />
                  <line x1="74" y1="71" x2="84" y2="78" opacity="0.9" />
                  <line x1="80" y1="77" x2="90" y2="84" opacity="0.9" />
                  <line x1="86" y1="83" x2="96" y2="90" opacity="0.9" />
                  
                  {/* Floating lace loops */}
                  <path d="M 68 65 C 60 55, 62 48, 70 56 S 64 63, 68 65" fill="none" stroke="#d4af37" strokeWidth="0.8" />
                </g>

                {/* Outsole */}
                <path 
                  d="M 31 130 
                     C 30 134, 31 142, 33 145
                     C 40 147, 80 148, 173 141
                     C 178 141, 179 135, 176 134
                     L 165 135
                     C 135 138, 80 138, 31 130 Z" 
                  fill="url(#soleGrad)" 
                  stroke="#111" 
                  strokeWidth="0.75" 
                />

                {/* Tread Details */}
                <path d="M 33 145 C 50 148, 120 149, 173 142 C 174 144, 170 146, 166 146 C 120 149, 50 149, 33 145 Z" fill="#111" />
                
                {/* Air Bubble Unit */}
                <rect x="45" y="133" width="22" height="6" rx="2" fill="#111111" />
                <rect x="47" y="134.5" width="18" height="3" rx="1.5" fill="#00e1ff" opacity="0.7" />

                {/* Golden J stamp on heel */}
                <circle cx="48" cy="115" r="4.5" fill="#d4af37" opacity="0.9" />
                <text x="48" y="116.5" textAnchor="middle" fill="#000" fontSize="4.5" fontWeight="black" fontFamily="sans-serif">J</text>
              </g>
            </svg>
          )}

          {type === 'bag' && (
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="leatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={fallbackHexColor} />
                  <stop offset="70%" stopColor={fallbackHexColor} />
                  <stop offset="100%" stopColor="#111111" stopOpacity="0.45" />
                </linearGradient>
                <linearGradient id="goldAcc" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fdf0cd" />
                  <stop offset="30%" stopColor="#e9a32c" />
                  <stop offset="100%" stopColor="#8d5f13" />
                </linearGradient>
                <radialGradient id="bagInnerShadow" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
                </radialGradient>
              </defs>

              {/* Archetypal Premium Handle */}
              <path 
                d="M 60 70 C 60 20, 140 20, 140 70 L 130 70 C 130 30, 70 30, 70 70 Z" 
                fill="#242424" 
                stroke="#111111" 
                strokeWidth="0.5" 
              />
              
              {/* Strap hardware */}
              <rect x="63" y="65" width="14" height="12" rx="3" fill="url(#goldAcc)" stroke="#111" strokeWidth="0.5" />
              <rect x="123" y="65" width="14" height="12" rx="3" fill="url(#goldAcc)" stroke="#111" strokeWidth="0.5" />

              {/* Main Handbag container */}
              <path 
                d="M 52 75 
                   C 52 72, 57 70, 60 70 
                   L 140 70 
                   C 143 70, 148 72, 148 75 
                   L 165 152 
                   C 166 156, 161 160, 156 160 
                   L 44 160 
                   C 39 160, 34 156, 35 152 Z" 
                fill="url(#leatherGrad)" 
                stroke="#000000" 
                strokeWidth="1" 
              />

              {/* Stitching */}
              <path 
                d="M 56 75 L 144 75 L 157 155 L 43 155 Z" 
                fill="none" 
                stroke="#ffd482" 
                strokeWidth="0.8" 
                strokeDasharray="4 2" 
                opacity="0.4" 
              />
              {/* Seam lines */}
              <path d="M 100 70 L 100 160" stroke="#000" strokeWidth="1" opacity="0.15" />
              <path d="M 100 70 L 100 160" stroke="#ffd482" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />

              {/* Inner ambient shadow overlay */}
              <path 
                d="M 52 75 L 148 75 L 165 152 L 35 152 Z" 
                fill="url(#bagInnerShadow)" 
                pointerEvents="none" 
                opacity="0.25" 
              />

              {/* Gold corners */}
              <path d="M 35 152 L 48 141 L 62 160 L 44 160 L 35 152" fill="url(#goldAcc)" stroke="#3a2300" strokeWidth="0.5" />
              <path d="M 165 152 L 152 141 L 138 160 L 156 160 L 165 152" fill="url(#goldAcc)" stroke="#3a2300" strokeWidth="0.5" />

              {/* Logo Gold Plaque */}
              <g transform="translate(100, 110)">
                <rect x="-18" y="-10" width="36" height="20" rx="2" fill="url(#goldAcc)" stroke="#111" strokeWidth="0.5" />
                <rect x="-15" y="-7" width="30" height="14" rx="1" fill="none" stroke="#ffd482" strokeWidth="0.5" opacity="0.5" />
                <text x="0" y="0.5" textAnchor="middle" fill="#2d1c00" fontSize="3" letterSpacing="0.8" fontWeight="black" fontFamily="serif">JIJARELL</text>
                <circle cx="-13" cy="5" r="0.5" fill="#111" />
                <circle cx="13" cy="5" r="0.5" fill="#111" />
              </g>

              {/* Hanging Tag */}
              <path d="M 126 77 C 129 82, 138 98, 140 108" fill="none" stroke="#222" strokeWidth="1" />
              <path d="M 134 104 L 146 104 L 143 124 L 131 124 Z" fill="#222" stroke="#111" strokeWidth="0.5" />
              <path d="M 134 104 L 146 104 L 143 124 L 131 124 Z" fill="url(#leatherGrad)" stroke="#ffeaad" strokeWidth="0.5" strokeDasharray="3 1" opacity="0.6" />
              <text x="138" y="117" textAnchor="middle" fill="url(#goldAcc)" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">J</text>
            </svg>
          )}
        </div>

        {/* Continuous 60fps mechanical sweep keyframe animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes sweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />

        {/* Luxury Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none select-none">
          <span className="text-[9px] uppercase font-bold tracking-widest text-amber-600 bg-white border border-stone-200/80 px-2.5 py-1 rounded-sm shadow-xs">
            Interactive Hybrid Studio
          </span>
          <div className="text-[9px] text-stone-500 bg-white border border-stone-150 px-2.5 py-1 rounded-sm shadow-xs">
            Hover & move mouse to tilt
          </div>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-1.5 pointer-events-auto">
          <span className="p-1 px-1.5 bg-white border border-stone-200/80 text-stone-600 rounded-sm shadow-xs text-[10px] font-medium tracking-wide">
            HQ Vector
          </span>
        </div>
      </div>
    );
  };

  if (webglError) {
    return renderFallback();
  }

  return (
    <div className="relative w-full h-full bg-[#fbfbfb] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-stone-150">
      <div ref={mountRef} className="w-full h-full min-h-[300px]" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest">Compiling 3D Model...</span>
          </div>
        </div>
      )}

      {/* Control Overlays */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none select-none">
        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-600 px-3 py-1 bg-white/95 rounded-lg shadow-xs border border-stone-200">
          Interactive Canvas View
        </span>
        <div className="flex gap-2 pointer-events-auto">
          <div className="text-[10px] text-stone-400 bg-white/95 border border-stone-200 px-2 py-1 rounded-md shadow-xs">
            {helpText}
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-1.5 pointer-events-auto">
        <span className="p-1.5 bg-white/90 border border-stone-200/80 hover:bg-white text-stone-500 hover:text-stone-850 rounded-md shadow-xs text-xs pointer-events-auto" title="AR View Enabled">
          <Maximize className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
