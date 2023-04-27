- [x] Use a Langchain Vector Store
- [x] Create the Polaris Plugin
  - [x] Create a command to search and get n closest neighbours
  - [x] Create modal for this
  - [ ] Get menu to display results
  - [ ] Ribbon action to initiate
- [ ] Better state machine for when there is or is not an apikey , store etc.
  - [ ] Really broken when the store has not been created yet.

# State machine ideas:

# API Ideas:

- `complete`: query: string -> completion: string
- `search`: query: string, k: number -> documents: string[]

## Tasks and their API usage:

- Smart search - search
- Auto Tag - complete or maybe search
- Auto Link - search
- Flash card generator - complete
  - Maybe a more active tool for testing knowledge?
- Quiz and Evaluate - complete
- Inspired exploration - complete
