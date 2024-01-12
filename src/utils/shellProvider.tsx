import React, { useEffect } from 'react';
import { History } from '../interfaces/history';
import * as bin from './bin';
import { useTheme } from './themeProvider';

interface ShellContextType {
  history: History[];
  command: string;
  lastCommandIndex: number;
  setHistory: (output: string, useMarkdown: boolean) => void;
  setCommand: (command: string) => void;
  setLastCommandIndex: (index: number) => void;
  execute: (command: string) => Promise<void>;
  clearHistory: () => void;
}

const ShellContext = React.createContext<ShellContextType>(null);

interface ShellProviderProps {
  children: React.ReactNode;
}

export const useShell = () => React.useContext(ShellContext);

export const ShellProvider: React.FC<ShellProviderProps> = ({ children }) => {
  const [init, setInit] = React.useState(true);
  const [history, _setHistory] = React.useState<History[]>([]);
  const [command, _setCommand] = React.useState<string>('');
  const [lastCommandIndex, _setLastCommandIndex] = React.useState<number>(0);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setCommand('banner');
  }, []);

  useEffect(() => {
    if (!init) {
      execute();
    }
  }, [command, init]);

  const setHistory = (output: string, useMarkdown: boolean) => {
    _setHistory([
      ...history,
      {
        id: history.length,
        date: new Date(),
        command: command.split(' ').slice(1).join(' '),
        output,
        useMarkdown,
      },
    ]);
  };

  const setCommand = (command: string) => {
    _setCommand([Date.now(), command].join(' '));

    setInit(false);
  };

  const clearHistory = () => {
    _setHistory([]);
  };

  const setLastCommandIndex = (index: number) => {
    _setLastCommandIndex(index);
  };

  const isMarkdownCommand = (cmd: string) => {
    switch (cmd) {
      case 'banner':
      case 'weather':
        return false;
      case 'about':
      case 'projects':
      case 'socials':
      case 'github':
      case 'writing':
        return true;
      default:
        return false;
    }
  };

  const execute = async () => {
    const [cmd, ...args] = command.split(' ').slice(1);

    switch (cmd) {
      case 'theme':
        const output = await bin.theme(args, setTheme);
        setHistory(output, false);
        break;
      case 'clear':
        clearHistory();
        break;
      case '':
        setHistory('', false);
        break;
      case 'help':
      default: {
        if (Object.keys(bin).indexOf(cmd) === -1) {
          setHistory(
            `Command not found: ${cmd}. Try 'help' to get started.`,
            false,
          );
        } else {
          try {
            const output = await bin[cmd](args);
            const useMarkdown = isMarkdownCommand(cmd);
            setHistory(output, useMarkdown);
          } catch (error) {
            setHistory(error.message, false);
          }
        }
      }
    }
  };

  return (
    <ShellContext.Provider
      value={{
        history,
        command,
        lastCommandIndex,
        setHistory,
        setCommand,
        setLastCommandIndex,
        execute,
        clearHistory,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
};
