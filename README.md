# 🎭 Chuckle

A viral Chrome extension that transforms any text on the web into shareable memes using AI-powered reasoning and image generation.

## 🚀 Features

- **Instant Meme Generation**: Highlight any text, right-click, and create a meme in seconds
- **AI-Powered Humor**: Gemini 2.5 Flash analyzes context and suggests perfect meme templates
- **Smart Image Editing**: Nano Banana generates polished memes with precise text placement
- **One-Click Sharing**: Copy to clipboard or share directly to social media
- **Free Tier Friendly**: Built to leverage Google AI Studio's generous free quotas

## 🎯 How It Works

1. **Highlight** any text on a webpage
2. **Right-click** and select "Remix as a Meme"
3. **AI analyzes** the text and selects the perfect meme template
4. **Instant meme** appears with copy/share options
5. **Go viral** 🚀

## 🛠️ Tech Stack

- **Gemini 2.5 Flash**: Context analysis and meme reasoning
- **Nano Banana**: Image generation and editing
- **Chrome Extension API**: Seamless browser integration
- **Google AI Studio**: Free-tier API access

## 📦 Installation

### Prerequisites
- Chrome browser
- Google AI Studio API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Teycir/Chuckle.git
cd Chuckle
```

2. Create `.env` file:
```bash
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

3. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the Chuckle directory

## 🎨 Usage

1. Browse any website
2. Highlight interesting, funny, or shocking text
3. Right-click → "Remix as a Meme"
4. Wait 2-3 seconds for AI magic
5. Copy or share your meme!

## 🔧 Development

```bash
# Project structure
Chuckle/
├── manifest.json       # Extension configuration
├── background.js       # Service worker
├── content.js          # Page interaction
├── popup.html          # Meme display UI
├── popup.js            # UI logic
├── .env                # API keys (gitignored)
└── README.md           # This file
```

## 🌟 Viral Features

- **Low friction**: 2 clicks from text to meme
- **High shareability**: Instant social media integration
- **Trending templates**: Always up-to-date meme formats
- **Context-aware**: AI understands humor and sentiment

## 📝 License

MIT

## 🤝 Contributing

Pull requests welcome! Let's make the internet funnier together.

## ⚠️ Disclaimer

This extension is for entertainment purposes. Please respect copyright and use responsibly.
