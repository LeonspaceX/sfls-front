import React from 'react';
import { makeStyles, tokens, Button, shorthands, Text } from '@fluentui/react-components';
import { ArrowDownload24Regular, Dismiss24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerContainer: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  topRightControls: {
    position: 'fixed',
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalM,
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  image: {
    maxWidth: '90vw',
    maxHeight: '80vh',
    userSelect: 'none',
    cursor: 'grab',
    display: 'block',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow8,
  },
  filename: {
    position: 'fixed',
    bottom: tokens.spacingVerticalS,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: '#fff',
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
});

export interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, onClose }) => {
  const styles = useStyles();
  const [scale, setScale] = React.useState(1);
  const [dragging, setDragging] = React.useState(false);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const startRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  React.useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    offsetRef.current = { x: 0, y: 0 };
  }, [src]);

  const filename = React.useMemo(() => {
    try {
      const url = new URL(src, window.location.href);
      const pathname = url.pathname || '';
      const name = pathname.split('/').filter(Boolean).pop();
      return name || 'image';
    } catch {
      const parts = src.split('?')[0].split('/');
      return parts.pop() || 'image';
    }
  }, [src]);

  const handleWheel: React.WheelEventHandler<HTMLImageElement> = (e) => {
    e.preventDefault();
    const next = clamp(scale + (e.deltaY < 0 ? 0.15 : -0.15), 0.5, 5);
    setScale(next);
  };

  const handleMouseDown: React.MouseEventHandler<HTMLImageElement> = (e) => {
    e.preventDefault();
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY };
    offsetRef.current = { ...offset };
  };

  const handleMouseMove: React.MouseEventHandler<HTMLImageElement> = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    setOffset({ x: offsetRef.current.x + dx, y: offsetRef.current.y + dy });
  };

  const handleMouseUpOrLeave: React.MouseEventHandler<HTMLImageElement> = () => {
    setDragging(false);
  };

  const handleDoubleClick: React.MouseEventHandler<HTMLImageElement> = () => {
    setScale((s) => (s > 1 ? 1 : 2));
    setOffset({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    // 优先通过 fetch 获取 Blob，再使用 Object URL 触发浏览器下载；
    // 这样可以规避跨域 URL 忽略 download 属性导致的直接跳转问题。
    try {
      const res = await fetch(src, { mode: 'cors' });
      // 某些站点可能返回非 2xx，但仍有文件内容；此处仅在严格失败时降级
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 延迟释放以避免某些浏览器在点击后立即撤销 URL 导致失败
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch (err) {
      // 降级：无法 fetch（CORS/网络）时打开新标签，让用户自行另存为
      const a = document.createElement('a');
      a.href = src;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.topRightControls}>
        <Button appearance="subtle" icon={<ArrowDownload24Regular />} aria-label="下载图片" onClick={handleDownload} />
        <Button appearance="subtle" icon={<Dismiss24Regular />} aria-label="关闭查看器" onClick={onClose} />
      </div>
      <div className={styles.viewerContainer} onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt || 'image'}
          className={styles.image}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onDoubleClick={handleDoubleClick}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />
      </div>
      <Text size={100} className={styles.filename}>{filename}</Text>
    </div>
  );
};

export default ImageViewer;