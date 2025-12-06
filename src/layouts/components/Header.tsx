import { makeStyles, Text, tokens, Button } from '@fluentui/react-components';
import { WeatherSunny24Regular, WeatherMoon24Regular, Code24Regular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

import icon from '/icon.png';
import { SITE_TITLE, EnableCodeIcon, RepoUrl } from '../../config';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '30px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: tokens.spacingHorizontalL,
  },
  title: {
    marginLeft: tokens.spacingHorizontalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    '&:hover': {
      opacity: 0.8,
    },
  },
  icon: {
    height: '32px',
    width: '32px',
  },
  themeToggle: {
    cursor: 'pointer',
  },
  mobileMenuButton: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'inline-flex',
    },
  },
});

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
}

const Header = ({ isDarkMode, onToggleTheme, onToggleSidebar }: HeaderProps) => {
  const styles = useStyles();
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <Text size={500} weight="semibold" className={styles.title} onClick={handleTitleClick}>
        <img src={icon} alt="logo" className={styles.icon} />
         {SITE_TITLE}
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        <Button 
          appearance="transparent"
          onClick={onToggleSidebar}
          className={styles.mobileMenuButton}
        >菜单</Button>
        <Button 
          appearance="transparent" 
          icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
          onClick={onToggleTheme}
          className={styles.themeToggle}
        />
        {EnableCodeIcon && (
          <Button
            appearance="transparent"
            icon={<Code24Regular />}
            title="项目源代码"
            onClick={() => window.open(RepoUrl, '_blank', 'noopener,noreferrer')}
          />
        )}
      </div>
    </header>
  );
};

export default Header;