- [x] Use a Langchain Vector Store
- [ ] Policy for constantly managing embeddings
  - [ ] Periodically fetch
- [x] Create the Polaris Plugin
  - [x] Create a command to search and get n closest neighbours
  - [x] Create modal for this
  - [ ] Get menu to display results
  - [ ] Ribbon action to initiate
- [ ] Better state machine for when there is or is not an apikey , store etc.
  - [x] Store
  - [x] API
  - [ ] Test
- [ ] Good error handing and reporting when api key is invalid or no internet etc
- [ ] A way to avoid passing plugin all the way through class hierarchy

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
