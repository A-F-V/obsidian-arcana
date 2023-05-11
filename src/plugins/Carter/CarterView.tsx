import ArcanaPlugin from 'src/main';
import * as React from 'react';
import { TFile } from 'obsidian';
import { ArcanaSearchResult } from 'src/include/ArcanaAgent';
import { ArcanaContext } from 'src/hooks/context';
import { useArcana } from 'src/hooks/hooks';

const SearchResult = ({ result }: { result: ArcanaSearchResult }) => {
  const arcana = useArcana();
  return (
    <div>
      <button
        onClick={() => {
          // Open the file
          arcana.app.workspace.openLinkText(result.file.basename, '', true);
        }}
        style={{ display: 'block', width: '100%' }}
      >
        {result.file.basename} - {result.score * 100}
      </button>
    </div>
  );
};

// A react component for the view
export const CarterView = () => {
  // The search query and the serach results states
  const arcana = useArcana();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([] as ArcanaSearchResult[]);

  // When the query changes, update the results
  React.useEffect(() => {
    // Find the closest matches
    if (query != '') {
      arcana.search(query, 20).then(setResults);
    }
  }, [query]);

  return (
    <div>
      <h1>Carter Rediscover</h1>
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
          <SearchResult result={result} />
        ))}
      </div>
    </div>
  );
};
