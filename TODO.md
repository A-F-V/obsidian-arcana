- [ ] Submit to Obsidian Community Plugin Store
  - [ ] Complete recommendations
- [x] Use a Langchain Vector Store
- [x] Policy for constantly managing embeddings
  - [x] Periodically fetch
- [x] Create the Columbus Plugin
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
- [x] Remove the frontmatter from the embedding text
- [x] Still requesting all embeddings on load for some reason? (says loading store a tonne before2)
- [ ] Complete experiment Socrates
- [x] There is a bug that spams the id.
  - [x] Flashcard not quite working either - spams + deletes some stuff.
- [x] Add category for flashcard
- [x] Make socrates more succinct
- [x] Make Feynman location configurable
- [ ] When creating the tag plugin, you can refactor part of the feynman plugin.
- [ ] Socrates - If using a highlight - go to end of paragraph instead

# State machine ideas:

# API Ideas:

- `complete`: query: string -> completion: string
- `search`: query: string, k: number -> documents: string[]

## Tasks and their API usage:

- [x] Smart search - search
- [x] Name Suggester - complete
- [x] Section Completer - complete
- [ ] Conversation and explore - complete (socrates)
- Auto Tag - complete or maybe search
- Auto Link - search
- [x] Flash card generator - complete
  - Maybe a more active tool for testing knowledge?
- Quiz and Evaluate - complete
- Inspired exploration - complete
