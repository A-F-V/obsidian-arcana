import ArcanaPlugin from 'src/main';
import * as React from 'react';
import { TFile } from 'obsidian';
import { surroundWithMarkdown } from 'src/utilities/DocumentCleaner';

export const Carter_VIEW_TYPE = 'Carter-view';

// A react component for the view
export const CarterView = ({ arcana }: { arcana: ArcanaPlugin }) => {
  // The search query and the serach results states
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([] as TFile[]);

  // When the query changes, update the results
  React.useEffect(() => {
    // Find the closest matches
    if (query != '') {
      arcana.search(query, 10).then(setResults);
    }
  }, [query]);

  return (
    <div>
      <input
        type="text"
        onKeyUp={e => {
          if (e.key == 'Enter') {
            setQuery(e.currentTarget.value);
          }
        }}
      />
      <div>
        {results.map(result => (
          <button
            onClick={() => {
              // Open the file
              arcana.app.workspace.openLinkText(result.basename, '', true);
            }}
            style={{ display: 'block', width: '100%' }}
          >
            {result.basename}
          </button>
        ))}
      </div>
    </div>
  );
};
