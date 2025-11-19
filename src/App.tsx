// 你好，感谢你愿意看源代码，但是悄悄告诉你，代码其实是AI写的所以质量很差喵。抱歉呜呜呜😭。

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PostCard from './components/PostCard';
import MainLayout from './layouts/MainLayout';
import './App.css';
import { fetchArticles } from './api';
import CreatePost from './components/CreatePost';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AboutPage from './components/AboutPage';
import PostState from './components/PostState';
import ReportState from './components/ReportState';
import AdminPage from './components/AdminPage';
import InitPage from './pages/InitPage';
import NotFound from './pages/NotFound';

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [articles, setArticles] = useState<Array<{
    id: number;
    content: string;
    upvotes: number;
    downvotes: number;
  }>>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [homeRefreshTick, setHomeRefreshTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const observer = useRef<IntersectionObserver>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const pullDeltaRef = useRef<number>(0);
  const lastRefreshAtRef = useRef<number>(0);
  const [pullOffset, setPullOffset] = useState(0);
  const [offsetAnimated, setOffsetAnimated] = useState(false);
  const MAX_PULL = 80; // 最大下拉位移
  const TRIGGER_PULL = 60; // 触发刷新的阈值
  const DAMPING = 0.5; // 阻尼系数，减少位移幅度
  const REFRESH_COOLDOWN_MS = 5000; // 刷新冷却时间

  const lastArticleRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const doRefresh = () => {
    if (refreshing || loading) return;
    const now = Date.now();
    if (now - lastRefreshAtRef.current < REFRESH_COOLDOWN_MS) return;
    lastRefreshAtRef.current = now;
    setRefreshing(true);
    setArticles([]);
    setHasMore(true);
    setPage(1);
    setHomeRefreshTick((t) => t + 1);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
    pullDeltaRef.current = 0;
    setOffsetAnimated(false);
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const startY = touchStartYRef.current;
    if (startY == null) return;
    const currentY = e.touches[0]?.clientY ?? startY;
    const rawDelta = currentY - startY;
    pullDeltaRef.current = rawDelta;
    const atTop = (containerRef.current?.scrollTop ?? 0) <= 0;
    if (atTop && rawDelta > 0 && !loading && !refreshing) {
      const offset = Math.min(MAX_PULL, rawDelta * DAMPING);
      setPullOffset(offset);
    } else {
      setPullOffset(0);
    }
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    const atTop = (containerRef.current?.scrollTop ?? 0) <= 0;
    const shouldRefresh = atTop && pullOffset >= TRIGGER_PULL;
    setOffsetAnimated(true);
    setPullOffset(0);
    if (shouldRefresh) {
      doRefresh();
    }
    touchStartYRef.current = null;
    pullDeltaRef.current = 0;
    // 结束后移除动画标记，下一次拖动为无动画的跟随效果
    setTimeout(() => setOffsetAnimated(false), 220);
  };

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const atTop = (containerRef.current?.scrollTop ?? 0) <= 0;
    if (atTop && e.deltaY < 0) {
      doRefresh();
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadArticles = async () => {
      if (!hasMore) return;
      setLoading(true);
      try {
        const newArticles = await fetchArticles(page, signal);
        if (newArticles.length === 0) {
          setHasMore(false);
        } else {
          setArticles(prev => [...prev, ...newArticles]);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to load articles:', error);
        }
      } finally {
        setLoading(false);
        if (refreshing) {
          setRefreshing(false);
          toast.success('刷新成功！');
        }
      }
    };
    loadArticles();

    return () => {
      controller.abort();
    };
  }, [page, hasMore, homeRefreshTick]);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />}>
            <Route
              index
              element={
                <div
                  style={{ width: '100%', height: 'calc(100vh - 64px)', overflowY: 'auto', padding: '20px' }}
                  ref={containerRef}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onWheel={onWheel}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: '100%',
                    transform: `translateY(${pullOffset}px)`,
                    transition: offsetAnimated ? 'transform 200ms ease' : 'none'
                  }}>
                    {/* 刷新提示改为 toast，不显示顶部灰字 */}
                    {articles.map((article, index) => {
                      if (articles.length === index + 1 && hasMore) {
                        return (
                          <div ref={lastArticleRef} key={article.id}>
                            <PostCard
                              id={article.id}
                              content={article.content}
                              upvotes={article.upvotes}
                              downvotes={article.downvotes}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <PostCard
                            key={article.id}
                            id={article.id}
                            content={article.content}
                            upvotes={article.upvotes}
                            downvotes={article.downvotes}
                          />
                        );
                      }
                    })}
                    {loading && <div>加载中...</div>}
                  </div>
                </div>
              }
            />
            <Route path="create" element={<CreatePost />} />
            <Route path="/progress/review" element={<PostState />} />
            <Route path="/progress/complaint" element={<ReportState />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="/init" element={<InitPage />} />
          <Route path="/admin" element={<AdminPage isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />} />
           <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </FluentProvider>
  );
}

export default App;
