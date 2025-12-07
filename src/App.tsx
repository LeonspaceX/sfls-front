// 你好，感谢你愿意看源代码，但是悄悄告诉你，代码其实是AI写的所以质量很差喵。抱歉呜呜呜😭。

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme, tokens } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PostCard from './components/PostCard';
import MainLayout from './layouts/MainLayout';
import './App.css';
import { fetchArticles, getNotice } from './api';
import CreatePost from './components/CreatePost';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import AboutPage from './components/AboutPage';
import PostState from './components/PostState';
import ReportState from './components/ReportState';
import AdminPage from './components/AdminPage';
import InitPage from './pages/InitPage';
import NotFound from './pages/NotFound';
import ImageViewer from './components/ImageViewer';
import NoticeModal from './components/NoticeModal';
import type { NoticeData } from './components/NoticeModal';

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

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
  const lastRefreshAtRef = useRef<number>(0);
  const REFRESH_COOLDOWN_MS = 5000; // 刷新冷却时间
  const [imageViewer, setImageViewer] = useState<{ open: boolean; src?: string; alt?: string }>({ open: false });
  const [noticeData, setNoticeData] = useState<NoticeData | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    getNotice().then(data => {
      // Check display status
      if (data.display === 'false') {
        setShowNotice(false);
        return;
      }

      const savedVersion = localStorage.getItem('notice_version');
      // 只有当有内容且版本号大于本地存储的版本时才显示
      if (data.content && (!savedVersion || Number(savedVersion) < Number(data.version))) {
        setNoticeData({
          type: data.type,
          content: data.content,
          version: Number(data.version),
          display: data.display
        });
        setShowNotice(true);
      }
    }).catch(console.error);
  }, []);

  const openImageViewer = (src?: string, alt?: string) => {
    if (!src) return;
    setImageViewer({ open: true, src, alt });
  };
  const closeImageViewer = () => setImageViewer({ open: false });

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

  // 移除触摸下拉刷新逻辑

  // 撤销 Pointer 事件回退，恢复为纯 Touch 逻辑

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
                  onWheel={onWheel}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: '100%',
                    // 移除下拉位移动画
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
                              onPreviewImage={openImageViewer}
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
                            onPreviewImage={openImageViewer}
                          />
                        );
                      }
                    })}
                    {loading && <div>加载中...</div>}
                    {!loading && !hasMore && (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: tokens.colorNeutralStroke2 }} />
                        <div style={{ padding: '0 12px', color: tokens.colorNeutralForeground3, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          已经到底了喵~
                        </div>
                        <div style={{ flex: 1, height: 1, backgroundColor: tokens.colorNeutralStroke2 }} />
                      </div>
                    )}
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
      <ToastContainer theme={isDarkMode ? 'dark' : 'light'} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: isDarkMode ? '#333' : '#fff',
            color: isDarkMode ? '#fff' : '#333',
          },
        }}
      />
      {imageViewer.open && imageViewer.src && (
        <ImageViewer src={imageViewer.src!} alt={imageViewer.alt} onClose={closeImageViewer} />
      )}
      {showNotice && noticeData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <NoticeModal
            data={noticeData}
            onClose={() => setShowNotice(false)}
            onNeverShow={(version) => {
              localStorage.setItem('notice_version', String(version));
              setShowNotice(false);
            }}
          />
        </div>
      )}
    </FluentProvider>
  );
}

export default App;







