import { App, Modal, Setting, debounce } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';

function QuestionModalView({
  question,
  onSubmit,
}: {
  question: string;
  onSubmit: (result: string) => void;
}) {
  const [result, setResult] = React.useState<string>('');
  return (
    <div>
      <h1>{question}</h1>
      <div style={{ width: '100%' }}>
        <input
          type="text"
          autoFocus={true}
          onChange={event => setResult(event.target.value)}
          onSubmit={() => onSubmit(result)}
          onKeyUp={debounce(event => {
            if (event.key === 'Enter') {
              if (result.length > 0) onSubmit(result);
            }
          })}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}

export default class QuestionModal extends Modal {
  question: string;
  onSubmit: (result: string) => void;

  constructor(app: App, question: string, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
    this.question = question;
  }

  onOpen() {
    // Using React
    const root = createRoot(this.containerEl.children[1]);

    root.render(
      <React.StrictMode>
        <QuestionModalView
          question={this.question}
          onSubmit={result => {
            this.close();
            this.onSubmit(result);
          }}
        />
      </React.StrictMode>
    );
  }

  onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
