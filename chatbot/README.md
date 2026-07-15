# Paragraph Evaluator Chatbot

🤖 **Powered by LLaMA 3.1** | 🌐 **Deploy to Cloudflare in 5 minutes**

An AI-powered chatbot that evaluates text across four critical dimensions using **LLaMA 3.1** (llama3.1:latest).

## 🚀 Quick Start

### Local Development
1. Install Ollama and pull llama3.1:latest
2. Open `index.html` in your browser

### Deploy to Cloudflare (5 minutes)
See **[DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)** for instant deployment

## 🎯 What's New (v2.0)

- ✅ **Single Model**: Now using only llama3.1:latest (5.6 GB)
- ✅ **Cloudflare Ready**: Deploy globally in minutes
- ✅ **Two Deployment Options**: 
  - Your own Ollama server
  - Cloudflare Workers AI (no server needed)
- ✅ **Simplified Architecture**: One model, one API call
- ✅ **Better Performance**: Lower latency with single evaluation

## 📊 Evaluation Dimensions

Each paragraph receives four scores (0-100):

1. **Clarity** - How clear and easy to understand
2. **Truthfulness** - Factual accuracy and logical consistency  
3. **Innovation** - Novel ideas and future-oriented thinking
4. **Practicality** - Real-world applicability and feasibility

## Prerequisites

### For Local Use
1. **Ollama** installed and running
   - Download: https://ollama.ai/
2. **LLaMA 3.1 Model** installed:
   ```bash
   ollama pull llama3.1:latest
   ```

### For Cloudflare Deployment
1. **Cloudflare Account** (free tier works)
2. **Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

## Installation & Usage

### Local Development

```bash
# 1. Install LLaMA 3.1
ollama pull llama3.1:latest

# 2. Verify
ollama list

# 3. Start Ollama
ollama serve

# 4. Open index.html in browser
```

### Deploy to Cloudflare

**Quick Deploy (Easiest)**
```bash
npm install -g wrangler
wrangler login
wrangler deploy --config wrangler-cf-ai.toml
```

**Full Guide**: See [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)

## 📁 Project Structure

```
Chatbot/
├── index.html                    # Main UI (standalone)
├── styles.css                    # Styling
├── script.js                     # Frontend logic
│
├── worker.js                     # Cloudflare Worker (Option 1)
├── wrangler.toml                 # Config for your Ollama
│
├── worker-cf-ai.js               # Cloudflare Worker (Option 2)
├── wrangler-cf-ai.toml           # Config for Workers AI
│
├── package.json                  # NPM scripts
├── .gitignore                    # Git ignore rules
│
├── README.md                     # This file
├── DEPLOYMENT_QUICKSTART.md      # 5-min deployment guide
├── CLOUDFLARE_DEPLOYMENT.md      # Detailed deployment docs
├── CHANGES_SUMMARY.md            # What changed in v2.0
└── QUICK_START.md                # Quick reference
```

## 🌐 Deployment Options

### Option 1: Your llama3.1:latest (with Ollama)
**Pros**: Use your specific model, full control  
**Requirements**: Cloudflare Tunnel or public Ollama server  
**Guide**: [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md#option-1-deploy-with-your-ollama-server)

### Option 2: Cloudflare Workers AI (Serverless)
**Pros**: No server management, instant deploy  
**Requirements**: Just a Cloudflare account  
**Guide**: [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md#option-2-deploy-with-cloudflare-workers-ai-serverless)

## Model Information

**Your Local Model** (llama3.1:latest):
- **Model ID**: 46e0c10c039e
- **Size**: 5.6 GB
- **Context**: 4096 tokens
- **CPU Usage**: 100%

**Cloudflare Workers AI** (if using Option 2):
- **Model**: @cf/meta/llama-3.1-8b-instruct
- **Size**: Managed by Cloudflare
- **Context**: 8192 tokens

## 🎯 How It Works

```
User Input
    ↓
Single API Call → /api/evaluate
    ↓
LLaMA 3.1 Model
    ↓
All 4 Dimensions Evaluated Together
    ↓
JSON Response:
{
  "clarity": 85,
  "truthfulness": 78,
  "innovation": 88,
  "practicality": 80
}
    ↓
Visual Display
```

## Score Interpretation

- **90-100**: Excellent
- **70-89**: Good
- **40-69**: Fair
- **0-39**: Needs Improvement

## Performance

### Local (Ollama)
- **First run**: 10-20 seconds (model loading)
- **Subsequent**: 5-10 seconds
- **Memory**: ~5.6 GB RAM

### Cloudflare Workers AI
- **Typical**: 2-5 seconds
- **Global Edge**: Low latency worldwide
- **Auto-scaling**: Handles traffic spikes

## NPM Scripts

```bash
npm run dev          # Local dev with your Ollama
npm run dev:ai       # Local dev with Workers AI
npm run deploy       # Deploy with your Ollama
npm run deploy:ai    # Deploy with Workers AI
npm run tail         # View deployment logs
npm run delete       # Delete deployment
```

## Troubleshooting

### "Cannot connect to Ollama"
```bash
ollama serve         # Start Ollama
curl http://localhost:11434/api/tags  # Verify
```

### "Model not found"
```bash
ollama pull llama3.1:latest
ollama list
```

### Deployment Issues
See [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md#troubleshooting)

## Privacy & Security

- ✅ **Local Option Available** - All processing on your machine
- ✅ **No Data Collection** - Your text stays private
- ✅ **Open Source** - All code is visible
- ✅ **Cloudflare Option** - Encrypted, edge processing

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## Example Evaluation

**Input:**
```
Artificial intelligence is revolutionizing healthcare through machine learning 
algorithms that can detect diseases earlier and more accurately than traditional 
methods, potentially saving millions of lives worldwide.
```

**Typical Results:**
```
Clarity:         87/100
Truthfulness:    82/100
Innovation:      91/100
Practicality:    85/100
```

## What Changed in v2.0?

See [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) for complete details:
- Single model (llama3.1:latest)
- Cloudflare Workers support
- API endpoint abstraction
- Simplified architecture
- Deployment options

## Documentation

- **[README.md](README.md)** - This overview
- **[DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)** - Deploy in 5 minutes
- **[CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)** - Detailed deployment guide
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - What's new in v2.0
- **[QUICK_START.md](QUICK_START.md)** - Quick reference

## License

MIT License - Free to use and modify

## Credits

- **Ollama** - Local LLM runtime
- **Meta** - LLaMA 3.1 model
- **Cloudflare** - Workers platform

## Support

- **Ollama**: https://github.com/ollama/ollama
- **Cloudflare Workers**: https://workers.cloudflare.com
- **Deployment Help**: See [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)

---

**Ready to deploy?** 👉 [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)
