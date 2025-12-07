import React, { useState, useMemo } from 'react';
import { 
  makeStyles, 
  Button, 
  tokens, 
  Text, 
  Textarea, 
  Dropdown, 
  Option,
  Label,
  Input
} from '@fluentui/react-components';
import { Dismiss24Regular, Play24Regular } from '@fluentui/react-icons';
import * as Api from '../api';
import * as AdminApi from '../admin_api';
import { API_CONFIG } from '../config';

const useStyles = makeStyles({
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  modalContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalXXL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow64,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    position: 'relative',
    overflowY: 'auto',
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  resultBox: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    maxHeight: '200px',
    overflow: 'auto',
    fontSize: tokens.fontSizeBase200,
    wordBreak: 'break-all',
  },
});

interface DevToolsModalProps {
  onClose: () => void;
}

const DevToolsModal: React.FC<DevToolsModalProps> = ({ onClose }) => {
  const styles = useStyles();
  const [selectedFunc, setSelectedFunc] = useState<string>('');
  const [params, setParams] = useState<string>('[]');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Combine APIs and filter functions
  const apiFunctions = useMemo(() => {
    const all = { ...Api, ...AdminApi };
    return Object.entries(all)
      .filter(([_, value]) => typeof value === 'function')
      .map(([key]) => key)
      .sort();
  }, []);

  const handleExecute = async () => {
    if (!selectedFunc) return;
    setLoading(true);
    setResult('Executing...');
    
    try {
      // Parse params
      let args = [];
      try {
        const parsed = JSON.parse(params);
        if (Array.isArray(parsed)) {
          args = parsed;
        } else {
           throw new Error('Params must be a JSON array, e.g. ["arg1", 123]');
        }
      } catch (e: any) {
        setResult(`Error parsing params: ${e.message}`);
        setLoading(false);
        return;
      }

      const allApi: any = { ...Api, ...AdminApi };
      const func = allApi[selectedFunc];
      
      if (typeof func !== 'function') {
        setResult('Selected item is not a function.');
        setLoading(false);
        return;
      }

      const res = await func(...args);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      console.error(e);
      setResult(`Error: ${e.message}\n${JSON.stringify(e, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} role="dialog" aria-modal="true" aria-label="后端调试工具">
        <Button
          icon={<Dismiss24Regular />}
          appearance="transparent"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="关闭"
        />
        
        <Text as="h2" className={styles.title}>后端调试工具</Text>
        
        <div className={styles.section}>
          <Label>Current Backend URL</Label>
          <Input value={API_CONFIG.BASE_URL} readOnly />
        </div>

        <div className={styles.section}>
          <Label>Select Function</Label>
          <Dropdown
            placeholder="Select an API function"
            onOptionSelect={(_, data) => setSelectedFunc(data.optionValue || '')}
            value={selectedFunc}
            style={{ width: '100%' }}
          >
            {apiFunctions.map((funcName) => (
              <Option key={funcName} value={funcName}>
                {funcName}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.section}>
          <Label>Parameters (JSON Array)</Label>
          <Textarea 
            value={params} 
            onChange={(_, data) => setParams(data.value)} 
            placeholder='e.g. ["arg1", 123] or []'
            rows={3}
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        <div className={styles.section}>
          <Button 
            appearance="primary" 
            icon={<Play24Regular />} 
            onClick={handleExecute}
            disabled={!selectedFunc || loading}
          >
            Execute
          </Button>
        </div>

        <div className={styles.section}>
          <Label>Result</Label>
          <div className={styles.resultBox}>
            {result || 'No result yet'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: tokens.spacingVerticalM }}>
          <Button appearance="subtle" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
};

export default DevToolsModal;
