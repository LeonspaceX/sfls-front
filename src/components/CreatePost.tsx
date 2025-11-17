import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkIns from 'remark-ins';
import remarkBreaks from 'remark-breaks';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { uploadImage, submitPost } from '../api';
import { Button, makeStyles, tokens } from '@fluentui/react-components';

interface CreatePostProps {
  onSubmitSuccess?: () => void;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    maxWidth: '800px',
    margin: '0 auto',
  },
  editor: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
});

const CreatePost: React.FC<CreatePostProps> = ({ onSubmitSuccess }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = useStyles();

  useEffect(() => {
    const savedDraft = localStorage.getItem('draft');
    if (savedDraft) {
      setContent(savedDraft);
      toast.success('读取草稿成功！');
    }
  }, []);

  const handleSaveDraft = () => {
    localStorage.setItem('draft', content);
    toast.success('保存成功！');
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    // 轻度压缩：最大宽高 1920，JPEG/WebP 质量 0.85；
    // 对 PNG/GIF 保留格式，仅缩放尺寸以避免质量损失或动画丢失。
    const compressImage = (srcFile: File): Promise<File> => {
      return new Promise((resolve) => {
        try {
          const isGif = srcFile.type === 'image/gif';
          // 对动图或极小文件不做压缩
          if (isGif || srcFile.size < 150 * 1024) {
            resolve(srcFile);
            return;
          }

          const img = new Image();
          img.onload = () => {
            const maxW = 1920;
            const maxH = 1920;
            let { width, height } = img;
            const ratio = Math.min(1, Math.min(maxW / width, maxH / height));
            const targetW = Math.max(1, Math.round(width * ratio));
            const targetH = Math.max(1, Math.round(height * ratio));

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(srcFile);
              return;
            }
            ctx.drawImage(img, 0, 0, targetW, targetH);

            const preferJpeg = srcFile.type === 'image/jpeg' || srcFile.type === 'image/jpg';
            const preferPng = srcFile.type === 'image/png';
            const mime = preferJpeg ? 'image/jpeg' : preferPng ? 'image/png' : 'image/webp';
            const quality = preferPng ? undefined : 0.85; // PNG 质量参数无效，仅靠缩放降体积

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(srcFile);
                  return;
                }
                const outName = srcFile.name;
                const fileOut = new File([blob], outName, { type: mime });
                // 若压缩后反而更大，则沿用原文件
                resolve(fileOut.size < srcFile.size ? fileOut : srcFile);
              },
              mime,
              quality
            );
          };
          img.onerror = () => resolve(srcFile);
          img.src = URL.createObjectURL(srcFile);
        } catch {
          resolve(srcFile);
        }
      });
    };

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);

      const response = await uploadImage(formData);
      if (response.status === 'OK' && response.url) {
        return response.url;
      } else {
        toast.error('图片上传失败，文件大小过大或格式不正确！');
        return '';
      }
    } catch (error) {
      toast.error('图片上传出错');
      console.error(error);
      return '';
    }
  };

  const handleEditorChange = ({ text }: { text: string }) => {
    setContent(text);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('文章内容不能为空');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPost({ content });
      if (response.status === 'Pass') {
        toast.success(`提交成功！id=${response.id}${response.message ? `, ${response.message}` : ''}`);
        localStorage.removeItem('draft');
        onSubmitSuccess?.();
      } else if (response.status === 'Pending') {
        toast.info(`等待审核！id=${response.id}${response.message ? `, ${response.message}` : ''}`);
        localStorage.removeItem('draft');
        onSubmitSuccess?.();
      } else if (response.status === 'Deny') {
        toast.error(response.message || '投稿中包含违禁词');
      }
    } catch (error) {
      toast.error('投稿提交失败，请稍后重试');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.editor}>
        <MdEditor
          value={content}
          style={{ height: '500px' }}
          renderHTML={(text) => (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkIns, remarkBreaks]}>
              {text}
            </ReactMarkdown>
          )}
          onChange={handleEditorChange}
          onImageUpload={handleImageUpload}
        />
      </div>
      <div className={styles.buttonGroup}>
        <Button appearance="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交'}
        </Button>
        <Button appearance="secondary" onClick={handleSaveDraft}>
          保存草稿
        </Button>
      </div>
    </div>
  );
};

export default CreatePost;