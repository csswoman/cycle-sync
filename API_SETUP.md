# 🔑 API Keys Setup Guide

This guide will help you obtain the free API keys needed for CycleSync.

## Required APIs

### 1. NewsAPI (Health Articles)
**Free Tier:** 100 requests/day

**Steps to get your key:**
1. Visit [https://newsapi.org/](https://newsapi.org/)
2. Click "Get API Key"
3. Sign up with your email
4. Verify your email
5. Copy your API key from the dashboard
6. Add to `.env.local`: `VITE_NEWSAPI_KEY=your_key_here`

---

### 2. RapidAPI (ExerciseDB)
**Free Tier:** 10,000 requests/month

**Steps to get your key:**
1. Visit [https://rapidapi.com/](https://rapidapi.com/)
2. Sign up for a free account
3. Go to [ExerciseDB API](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
4. Click "Subscribe to Test"
5. Select the **Basic (Free)** plan
6. Copy your `X-RapidAPI-Key` from the code snippets
7. Add to `.env.local`: `VITE_RAPIDAPI_KEY=your_key_here`

---

### 3. Spoonacular (Recipes)
**Free Tier:** 150 requests/day

**Steps to get your key:**
1. Visit [https://spoonacular.com/food-api](https://spoonacular.com/food-api)
2. Click "Get Access"
3. Sign up for a free account
4. Go to your [Profile](https://spoonacular.com/food-api/console#Profile)
5. Copy your API key
6. Add to `.env.local`: `VITE_SPOONACULAR_KEY=your_key_here`

**Important:** The app tracks your daily usage and automatically switches to fallback recipes when you reach the limit. You'll see a friendly message: "You've reached the daily limit for detailed recipes. Tomorrow you'll have more!"

---

### 4. Gemini AI (Chatbot) - Already Configured
You should already have this from the initial setup.

If not:
1. Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env.local`: `VITE_GEMINI_API_KEY=your_key_here`

---

## Setup Instructions

1. **Create `.env.local` file** in the root of your project:
   ```bash
   cp .env.example .env.local
   ```

2. **Add all your API keys** to `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_NEWSAPI_KEY=your_newsapi_key
   VITE_RAPIDAPI_KEY=your_rapidapi_key
   VITE_SPOONACULAR_KEY=your_spoonacular_key
   ```

3. **Restart your dev server**:
   ```bash
   npm run dev
   ```

---

## Features by API

| API | Feature | Free Limit | Fallback |
|-----|---------|------------|----------|
| **NewsAPI** | Health articles in Dashboard | 100/day | Static curated articles |
| **ExerciseDB** | Exercise GIFs and instructions | 10,000/month | 3 basic exercises |
| **Spoonacular** | Recipe search with nutrition | 150/day | 6 curated recipes |
| **Gemini AI** | Smart chatbot assistant | Generous free tier | N/A |

---

## Quota Management

### Spoonacular Smart Quota System
The app automatically tracks your Spoonacular API usage:
- **Tracks requests** in localStorage
- **Resets daily** at midnight
- **Shows warning** when limit is reached
- **Switches to fallback** recipes automatically
- **Displays reset time** to users

You can check your quota status in the Nutrition page - a banner will appear when you're close to or have exceeded the daily limit.

---

## Troubleshooting

### "API key is missing" error
- Make sure your `.env.local` file exists
- Check that all keys start with `VITE_`
- Restart your dev server after adding keys

### "Quota exceeded" message
- **NewsAPI**: Wait until tomorrow or upgrade to paid plan
- **ExerciseDB**: Very generous limit, unlikely to hit
- **Spoonacular**: App will show fallback recipes automatically

### API not working
1. Check if your API key is valid
2. Verify you're subscribed to the free plan (RapidAPI)
3. Check browser console for specific error messages
4. Ensure you haven't exceeded rate limits

---

## Cost Summary

**Total Monthly Cost: $0** 🎉

All APIs used in this project have generous free tiers that are more than sufficient for personal use and development.

If you need more requests:
- **NewsAPI**: $449/month (Business plan)
- **Spoonacular**: $19/month (500 requests/day)
- **ExerciseDB**: Free tier is very generous

---

## Privacy & Security

- All API keys are stored in `.env.local` (gitignored)
- Keys are only used client-side for this personal project
- For production, consider using a backend proxy to hide API keys
- No user data is sent to third-party APIs

---

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Verify all API keys are correctly formatted
3. Ensure you're using the latest version of the code
4. Check API provider status pages

Happy coding! 🚀
