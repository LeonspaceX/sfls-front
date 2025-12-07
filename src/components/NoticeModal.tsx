import React from 'react';
import { makeStyles, Button, tokens, Text } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkIns from 'remark-ins';
import remarkBreaks from 'remark-breaks';

const useStyles = makeStyles({
  modalContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalXXL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow64,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '520px',
    maxWidth: '90vw',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
  },
  contentBox: {
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  iframe: {
    width: '100%',
    height: '360px',
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
  },
});

export interface NoticeData {
  type: 'md' | 'url';
  content: string;
  version: number;
  display?: string;
}

interface NoticeModalProps {
  data: NoticeData;
  onClose: () => void;
  onNeverShow: (version: number) => void;
}

const NoticeModal: React.FC<NoticeModalProps> = ({ data, onClose, onNeverShow }) => {
  const styles = useStyles();
  const { type, content, version } = data;

  return (
    <div className={styles.modalContent} role="dialog" aria-modal="true" aria-label="公告">
      <Button
        icon={<Dismiss24Regular />}
        appearance="transparent"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="关闭"
      />
      <Text as="h2" className={styles.title}>公告</Text>
      <div className={styles.contentBox}>
        {type === 'md' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkIns, remarkBreaks]}>
            {content}
          </ReactMarkdown>
        ) : (
          <iframe className={styles.iframe} src={content} title={`公告-${version}`} />
        )}
      </div>
      <div className={styles.actions}>
        <Button appearance="primary" onClick={onClose}>确定</Button>
        <Button appearance="subtle" onClick={() => onNeverShow(version)}>不再显示</Button>
      </div>
    </div>
  );
};

export default NoticeModal;

