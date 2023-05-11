import * as React from 'react';
import { ArcanaSearchResult } from 'src/include/ArcanaAgent';
import { useArcana } from 'src/hooks/hooks';
import { GridLoader } from 'react-spinners';

const SearchResult = ({ result }: { result: ArcanaSearchResult }) => {
  const arcana = useArcana();
  return (
    <div>
      <button
        onClick={() => {
          // Open the file
          arcana.app.workspace.openLinkText(result.file.basename, '', true);
        }}
        style={{
          display: 'block',
          width: '100%',
          justifyContent: 'left',
          textAlign: 'left',
          marginBlock: 10,
          height: 'fit-content',
        }}
      >
        <em>{(result.score * 100).toPrecision(3)}%</em> |{' '}
        <b>{result.file.basename}</b>
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
  const [loading, setLoading] = React.useState(false);

  // When the query changes, update the results
  React.useEffect(() => {
    // Find the closest matches
    if (query != '') {
      setLoading(true);
      arcana.search(query, 20).then(results => {
        setResults(results);
        setLoading(false);
      });
    }
  }, [query]);
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>🧭 Carter</h1>
        <GridLoader size={10} loading={loading} color={'#70163C'} />
      </div>
      <input
        type="text"
        className="beautiful-input"
        style={{ width: '100%' }}
        onKeyUp={e => {
          if (e.key == 'Enter') {
            setQuery(e.currentTarget.value);
          }
        }}
      />
      <div style={{ padding: 10 }}>
        {results.map(result => (
          <SearchResult key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
};
