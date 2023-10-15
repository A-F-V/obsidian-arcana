[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/AFV7)

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22arcana%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

[Looking for Collaborators](#collaborating)

# 🔮 Arcana

> A plugin for [Obsidian](https://obsidian.md/)

**Arcana** is a collection of AI powered tools designed to help you be more creative and productive with your Obsidian vault. Each tool is inspired by a famous historical figure:

- [Socrates](#socrates) - **Conversation**
  - [Custom Agents](#adding-custom-chat-agents) - **Create Conversation Agents from Templates**
  - **Text to Speech Transcription**
  - **Speech to Text Replies**
- [Henry Ford](#henry-ford) - **Metadata Markup**
- [Agatha Christie](#agatha-christie) - **Text Generation**
- [Richard Feynman](#richard-feynman) - **Flashcard Generation**
- [Charles Darwin](#charles-darwin) - **Auto Tagging**
- [Nostradamus](#nostradamus) - **Note Naming**

## Usage:

- **[OpenAI API key](https://platform.openai.com/account/api-keys) required** - set in settings.
- **It is highly recommended that you use the GPT4 API instead of the GPT3.5.**
- Most tools are invoked using the command palette and searching either `Arcana` or the person's name.
- Some tools add a view in the sidebar to interact with.

## Etymology:

> The word arcanum (pluralized as "arcana") came from Latin arcanus, meaning "secret," and entered English as the Dark Ages gave way to the Renaissance. It was often used in reference to the mysteries of the physical and spiritual worlds, subjects of heavy scrutiny and rethinking at the time.

# The Keepers of the Arcana:

## Socrates

<p align="center">
<img src='imgs/Socrates.png' height=500/>
</p>

**The Socratic Method with Socrates**

- Exchange in dialogue with Socrates.
- Ask questions specific to the note currently open.
- Use OpenAI's Whisper Text to Speech transcription.
- Use EdenAI Speech to Text for AI replies.

![](gifs/Socrates.gif)

### Adding Custom Chat Agents

You can create new agents like Socrates that are specialized for your own use cases.

For example, bring **Aristotle**, the teacher of Alexander the Greater, to life by using [Mr Ranedeer's AI Tutor Prompt](https://github.com/JushBJJ/Mr.-Ranedeer-AI-Tutor) as the initial message.

To create a new agent, add a new file to the `Conversation Agent Folder` specified in settings.

1. The agent's **name** is the name of the file. Names must be unique and cannot be the same as **Socrates**
2. The agent's **initial message** is the body of the file.
3. For additional agent settings, you can add the following fields to the file's YAML frontmatter:

| Setting ID                       | Setting Type                                 | Description                                                                                                  |
| -------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `arcana-agent-emoji`             | Emoji                                        | The emoji the agent will use for the conversation                                                            |
| `arcana-user-emoji`              | Emoji                                        | The emoji the user will use for the conversation                                                             |
| `arcana-auto-send-transcription` | Boolean                                      | Whether to send a transcribed message immediately after recording                                            |
| `arcana-tts-provider`            | 'google' or 'amazon' or 'microsoft' or 'ibm' | The Text to Speech model provider                                                                            |
| `arcana-tts-model`               | String                                       | The Text to Speech model. See Support Models at https://docs.edenai.co/reference/audio_text_to_speech_create |
| `arcana-tts-rate`                | Number between -100 to 100                   | The speed modifier as a percentage of normal                                                                 |
| `arcana-tts-pitch`               | Number between -100 to 100                   | The pitch modifier as a percentage of normal                                                                 |
| `arcana-tts-language`            | String                                       | The language to use for Text to Speech                                                                       |

[This website](https://flowgpt.com/) provides some good prompts for making agents.

#### Example

In a file called `Aristotle.md`

```md
---
arcana-user-emoji: 🧐
arcana-agent-emoji: 🗿
aracana-auto-send-transcription: true
---

I want you to act like Aristotle.
I want you to respond and answer like Aristotle using the tone, manner and vocabulary Aristotle would use.
Do not write any explanations.
Only answer like Aristotle. You must know all of the knowledge of Aristotle.
```

## Henry Ford

<p align="center">
<img src='imgs/Ford.png' height=500/>
</p>

**Frontmatter Metadata Automated Workflows**

- Can define a template for updating properties in note's front matter based on user defined instruction
- Can apply template to individual notes or an entire folder

![](gifs/Ford.gif)

1. Set the folder that contains your templates in the settings
2. Templates are markdown notes with the following format: - Each property rule is a section (header + body) - The header contains the name of the property and optionally the type of the field from: `string`,`string[]`,`number`,`boolean`
   For example:

```markdown
# part-of-speech:string

For the word being defined, what is its part of speech? Select from: "verb"|"noun"|"adjective"|"other".

# country-of-origin:string

For the word being defined, what country or region can the word's etymology be traced back to. Give your answer in lower kebab case.

# frequency:number

For the word being defined, give a score from 1 to 10 for how often the word typically is used in modern discourse.

# length:boolean

Is the word longer than 7 characters? Just say true or false without explanation.
```

## Agatha Christie

<p align="center">
<img src='imgs/Agatha.png' height=500/>
</p>

- Anywhere in a note, you can ask Agatha to write for you (either by asking a question or giving an instruction)
- She will use your note as a guide.
- You can also highlight text and Agatha will also take that into consideration. (She will write instead at the **bottom of the file**)
- To cancel your request, press `Esc`.

![](gifs/Christie.gif)

## Richard Feynman

<p align="center">
<img src='imgs/Feynman' height=500/>
</p>

**Write Flashcards with Feynman**

- Will take a note and produce 5 flashcards for you to use.
- Flashcards are capatible with [Obsidian-Spaced-Repitition](https://github.com/st3v3nmw/obsidian-spaced-repetition) plugin.
- Category is also generated.

![](gifs/Feynman.gif)

## Charles Darwin

<p align="center">
<img src='imgs/Darwin.png' height=500/>
</p>

**Cataloging and Classifying**

- Adds up to `Max tags to add` new tags to note
- Can request that `Only Existing Tags` be considered. Otherwise, new tags are allowed as well
  - Can `Exclude Tags` to be considered from vault (like `flashcards/*`). Wild cards allowed.
  - Can also only show tags that exceed or are equal to `Min Tag Count` to filter uncommon tags.
- Does not repeat tags used in the note.
- Can set the `New Tag Style` to: None, Kebab, Camel, Snake and Pascal Case. This applies only to tags not already in vault.

![](gifs/Darwin.gif)

## Nostradamus

<p align="center">
<img src='imgs/Nostradamus' height=500/>
</p>

**Can predict the title of notes**

- Takes the content of the note and uses it to give the file a better title.
- Does it in the style of [Andy Matuschak's Evergreen notes](https://notes.andymatuschak.org/Evergreen_note_titles_are_like_APIs)

![](gifs/Nostradamus.gif)

---

### Collaborating:

**Actively Looking for Collaborators**
If you would like to contribute or collaborate, message me directly on twitter [@AFV_7](https://twitter.com/AFV_7) and we can talk :).

---

_The images were generated using Midjourney_
