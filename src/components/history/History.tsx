import React from 'react';
import { History as HistoryInterface } from '../../interfaces/history';
import { Ps1 } from '../ps1';
import ReactMarkdown from 'react-markdown';

interface Props {
  history: Array<HistoryInterface>;
}

export const History: React.FC<Props> = ({ history }) => {
  return (
    <>
      {history.map((entry: HistoryInterface, index: number) => (
        <div key={entry.command + index}>
          <div className="flex flex-row space-x-2">
            <div className="flex-shrink">
              <Ps1 />
            </div>

            <div className="flex-grow">{entry.command}</div>
          </div>

          <div
            className="whitespace-pre-wrap mb-2"
            style={{ lineHeight: 'normal' }}
          >
            {entry.useMarkdown ? (
              <ReactMarkdown>{entry.output}</ReactMarkdown>
            ) : (
              entry.output
            )}
          </div>
        </div>
      ))}
    </>
  );
};

export default History;
