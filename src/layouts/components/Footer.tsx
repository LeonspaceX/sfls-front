import { makeStyles, tokens } from '@fluentui/react-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SITE_FOOTER_MD } from '../../config';

const useStyles = makeStyles({
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  markdown: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: '20px',
    textAlign: 'center',
    // 约束可能的图片或表格
    '& img': { maxWidth: '100%', height: 'auto', display: 'inline-block', verticalAlign: 'middle' },
    '& a': { color: tokens.colorBrandForegroundLink, textDecoration: 'underline', wordBreak: 'break-word' },
    '& a:hover': { textDecoration: 'underline' },
    '& a:visited': { color: tokens.colorBrandForegroundLink },
    '& a:focus': { outline: `2px solid ${tokens.colorNeutralStroke1}`, outlineOffset: '2px' },
  },
});

const Footer = () => {
  const styles = useStyles();

  return (
    <footer className={styles.footer}>
      <div className={styles.markdown}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{SITE_FOOTER_MD}</ReactMarkdown>
      </div>
    </footer>
  );
};

export default Footer;