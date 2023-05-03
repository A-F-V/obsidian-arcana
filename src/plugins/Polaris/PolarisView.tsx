import ArcanaPlugin from 'src/main';
import * as React from 'react';

export const POLARIS_VIEW_TYPE = 'polaris-view';

// A react component for the view
export const PolarisView = ({ arcana }: { arcana: ArcanaPlugin }) => {
  // The search query and the serach results states
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([] as string[]);

  // When the query changes, update the results
  React.useEffect(() => {
    // Find the closest matches
    if (query != '') {
      arcana.search(query, 10).then(results => {
        setResults(results.map(result => result.name));
      });
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
      <ul>
        {results.map(result => (
          <li>{result}</li>
        ))}
      </ul>
    </div>
  );
};
