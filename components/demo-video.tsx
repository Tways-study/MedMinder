"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const controlClass =
  "flex size-11 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

/**
 * The demo film, embedded on the sign-in page. It plays muted and looped as
 * soon as it is mostly on screen (on a phone it sits below the form, so that
 * is when it is scrolled to) and pauses when it leaves, which saves battery
 * and data. Sound is a tap away. Under reduced motion, or when the browser
 * refuses to autoplay (Low Power Mode, data saver), the poster shows and the
 * play button starts it.
 */
export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // True once the viewer has paused it themselves; scrolling must not restart it.
  const userPaused = useRef(false);
  const reducedMotion = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // Autoplay refused: the poster stays up and the play button takes over.
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true; // React's `muted` prop is unreliable for autoplay.
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!userPaused.current && !reducedMotion.current) attemptPlay();
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [attemptPlay]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black shadow-landing">
      <video
        ref={videoRef}
        className="aspect-video w-full"
        src="/demo/medminder-demo.mp4"
        poster="/demo/medminder-demo-poster.jpg"
        aria-label="MedMinder demo film: counting a shelf is not the same as checking its dates, and MedMinder stamps every lot by how close it is to expiring."
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      />
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          aria-pressed={!muted}
          className={controlClass}
        >
          {muted ? (
            <VolumeX className="size-4" aria-hidden />
          ) : (
            <Volume2 className="size-4" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause demo" : "Play demo"}
          className={controlClass}
        >
          {playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
