'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Camera, Geometry, Program, Mesh, Vec2 } from 'ogl';

interface IridescenceProps {
  color?: [number, number, number];
  amplitude?: number;
  speed?: number;
  mouseReact?: boolean;
  className?: string;
}

export default function Iridescence({
  color = [0.5, 0.7, 1.0],
  amplitude = 0.5,
  speed = 0.3,
  mouseReact = true,
  className = '',
}: IridescenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const renderer = new Renderer({
      alpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    // Set canvas style
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';

    const camera = new Camera(gl);
    camera.position.z = 1;

    // Handle resize
    const handleResize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      camera.perspective({
        aspect: container.offsetWidth / container.offsetHeight,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse tracking - smooth interpolation for better reactivity
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseReact) {
        const targetX = e.clientX / window.innerWidth;
        const targetY = 1.0 - e.clientY / window.innerHeight;
        
        // Smooth interpolation for fluid movement
        mouseRef.current.x += (targetX - mouseRef.current.x) * 0.1;
        mouseRef.current.y += (targetY - mouseRef.current.y) * 0.1;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Vertex shader
    const vertex = /* glsl */ `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
      }
    `;

    // Fragment shader with iridescent effect
    const fragment = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec3 uColor;
      uniform float uAmplitude;
      uniform float uSpeed;
      varying vec2 vUv;

      // Cosine gradient function for smooth color transitions
      vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
        return a + b * cos(6.28318 * (c * t + d));
      }

      // 2D Noise function
      float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      // Smooth noise
      float smoothNoise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 st = vUv;
        float time = uTime * uSpeed;
        
        // Enhanced mouse interaction - more prominent
        vec2 mouseOffset = uMouse - st;
        float mouseDist = length(mouseOffset);
        float mouseEffect = exp(-mouseDist * 2.0) * 0.8;
        
        // Create flowing motion with stronger mouse influence
        vec2 motion = vec2(
          sin(time * 0.5 + st.y * 3.0) * uAmplitude,
          cos(time * 0.3 + st.x * 3.0) * uAmplitude
        );
        
        // Strong mouse reactivity
        vec2 mouseInfluence = mouseOffset * mouseEffect * 1.5;
        st += motion + mouseInfluence;
        
        // Multiple layers of waves for complexity
        float wave1 = sin(st.x * 4.0 + time) * 0.5 + 0.5;
        float wave2 = sin(st.y * 3.0 - time * 0.7) * 0.5 + 0.5;
        float wave3 = sin((st.x + st.y) * 2.5 + time * 0.5) * 0.5 + 0.5;
        
        // Add noise for texture
        float n = smoothNoise(st * 5.0 + time * 0.1);
        
        // Combine waves with mouse effect
        float pattern = (wave1 + wave2 + wave3) / 3.0;
        pattern = mix(pattern, n, 0.2);
        pattern += mouseEffect * 0.3;
        
        // Lighter blue with subtle dark green iridescence
        // Light aqua blue: rgb(102, 204, 255) = vec3(0.4, 0.8, 1.0)
        // Dark green hint: rgb(0, 102, 102) = vec3(0.0, 0.4, 0.4)
        vec3 color1 = cosPalette(
          pattern + time * 0.15,
          vec3(0.35, 0.7, 0.85),
          vec3(0.2, 0.4, 0.5),
          vec3(1.0, 1.0, 1.0),
          vec3(0.0, 0.3, 0.5)
        );
        
        // Secondary layer - lighter blue with subtle dark green
        vec3 color2 = cosPalette(
          pattern * 0.5 - time * 0.1,
          vec3(0.3, 0.65, 0.8),
          vec3(0.15, 0.35, 0.45),
          vec3(1.0, 1.0, 1.0),
          vec3(0.1, 0.4, 0.6)
        );
        
        // Blend colors with stronger intensity
        vec3 finalColor = mix(color1, color2, 0.4);
        
        // Apply cyan tint matching project theme
        finalColor *= uColor;
        
        // Enhanced shimmer effect for continuous iridescence
        float shimmer = sin(pattern * 10.0 + time * 2.0) * 0.2 + 0.8;
        finalColor *= shimmer;
        
        // Mouse cursor creates spot with subtle dark green
        // Dark teal green: rgb(0, 153, 153) = vec3(0.0, 0.6, 0.6)
        vec3 mouseColor = mix(
          vec3(0.4, 0.8, 1.0),     // Light aqua blue base
          vec3(0.0, 0.5, 0.5),     // Subtle dark green on hover
          mouseEffect * 0.4
        );
        finalColor += mouseColor * mouseEffect * 0.5;
        
        // Subtle vignette - less aggressive for full page
        float vignette = 1.0 - length(vUv - 0.5) * 0.3;
        finalColor *= vignette;
        
        // Higher alpha for more prominent effect
        float alpha = smoothstep(0.0, 0.5, vignette) * 0.95;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    // Create geometry (fullscreen quad)
    const geometry = new Geometry(gl, {
      position: {
        size: 2,
        data: new Float32Array([-1, -1, 3, -1, -1, 3]),
      },
      uv: {
        size: 2,
        data: new Float32Array([0, 0, 2, 0, 0, 2]),
      },
    });

    // Create program with shaders
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new Vec2(0.5, 0.5) },
        uColor: { value: color },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
      transparent: true,
    });

    // Create mesh
    const mesh = new Mesh(gl, { geometry, program });

    // Animation loop with continuous time
    const animate = (currentTime: number) => {
      animationRef.current = requestAnimationFrame(animate);

      const elapsed = currentTime * 0.001;
      program.uniforms.uTime.value = elapsed;
      program.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);

      renderer.render({ scene: mesh, camera });
    };
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (gl.canvas && container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
      geometry.remove();
      program.remove();
    };
  }, [color, amplitude, speed, mouseReact]);

  return (
    <div
      ref={containerRef}
      className={`iridescence-container ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    />
  );
}
