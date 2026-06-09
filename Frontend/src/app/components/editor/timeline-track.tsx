import React, { useRef, useState, useEffect } from 'react';

type Clip = {
  id: string;
  label: string;
  start: number; // seconds
  duration: number; // seconds
  color?: string;
};

const TIMELINE_PX_PER_SEC = 20; // simple scale

export function TimelineTrack({
  label,
  clips: initialClips,
  onChange,
}: {
  label: string;
  clips: Clip[];
  onChange?: (clips: Clip[]) => void;
}) {
  const [clips, setClips] = useState<Clip[]>(initialClips || []);
  const draggingRef = useRef<{ id: string; startX: number; origLeft: number } | null>(null);
  const resizingRef = useRef<{ id: string; startX: number; origWidth: number } | null>(null);

  useEffect(() => setClips(initialClips || []), [initialClips]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const { id, startX, origLeft } = draggingRef.current;
        const dx = e.clientX - startX;
        setClips((c) =>
          c.map((clip) =>
            clip.id === id
              ? { ...clip, start: Math.max(0, Math.round((origLeft + dx) / TIMELINE_PX_PER_SEC)) }
              : clip
          )
        );
      }
      if (resizingRef.current) {
        const { id, startX, origWidth } = resizingRef.current;
        const dx = e.clientX - startX;
        setClips((c) =>
          c.map((clip) =>
            clip.id === id
              ? { ...clip, duration: Math.max(1, Math.round((origWidth + dx) / TIMELINE_PX_PER_SEC)) }
              : clip
          )
        );
      }
    };

    const onUp = () => {
      if (draggingRef.current || resizingRef.current) {
        onChange?.(clips);
      }
      draggingRef.current = null;
      resizingRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [clips, onChange]);

  const handleDragStart = (e: React.MouseEvent, clip: Clip) => {
    draggingRef.current = { id: clip.id, startX: e.clientX, origLeft: Math.round(clip.start * TIMELINE_PX_PER_SEC) };
  };

  const handleResizeStart = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation();
    resizingRef.current = { id: clip.id, startX: e.clientX, origWidth: Math.round(clip.duration * TIMELINE_PX_PER_SEC) };
  };

  return (
    <div className="w-full">
      <div className="text-xs font-medium mb-2">{label}</div>
      <div className="relative h-16 bg-[#08101a] rounded-md p-2 overflow-x-auto">
        <div className="relative h-full" style={{ minWidth: 1200 }}>
          {clips.map((clip) => {
            const left = clip.start * TIMELINE_PX_PER_SEC;
            const width = Math.max(8, clip.duration * TIMELINE_PX_PER_SEC);
            return (
              <div
                key={clip.id}
                onMouseDown={(e) => handleDragStart(e, clip)}
                className="absolute top-2 h-12 rounded-md cursor-grab select-none flex items-center"
                style={{ left, width, background: clip.color || 'linear-gradient(90deg,#06b6d4,#3b82f6)' }}
              >
                <div className="px-2 text-xs font-semibold text-black/90 truncate">{clip.label}</div>
                <div
                  onMouseDown={(e) => handleResizeStart(e, clip)}
                  className="ml-auto w-3 h-full cursor-ew-resize bg-black/20"
                  title="Drag to resize"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TimelineTrack;
