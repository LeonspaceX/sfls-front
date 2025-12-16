import { useEffect, useRef, useState } from 'react';
import { API_CONFIG } from '../config';

interface UseSSEOptions {
  onNewPost?: () => void;
  maxRetries?: number;
  enabled?: boolean;
}

export function useSSE(options: UseSSEOptions = {}) {
  const {
    onNewPost,
    maxRetries = 3,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onNewPostRef = useRef(onNewPost);

  // 更新 ref 以获取最新的回调
  useEffect(() => {
    onNewPostRef.current = onNewPost;
  }, [onNewPost]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const connect = () => {
      // 如果已经达到最大重连次数，放弃连接
      if (retriesRef.current >= maxRetries) {
        return;
      }

      try {
        const eventSource = new EventSource(`${API_CONFIG.BASE_URL}/stream`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          retriesRef.current = 0; // 重置重试计数
        };

        eventSource.onmessage = (event) => {
          const data = event.data;

          if (data === 'heartbeat') {
            // 心跳消息，不做处理
            return;
          }

          if (data === 'new_post') {
            // 新投稿通知
            onNewPostRef.current?.();
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource.close();

          // 如果还没达到最大重连次数，尝试重连
          if (retriesRef.current < maxRetries) {
            retriesRef.current += 1;

            // 使用指数退避策略重连
            const delay = Math.min(1000 * Math.pow(2, retriesRef.current - 1), 10000);
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        };
      } catch {
        setIsConnected(false);
      }
    };

    // 初始连接
    connect();

    // 清理函数
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, maxRetries]);

  return { isConnected };
}
