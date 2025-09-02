# AI-Powered Git Commit Descriptions

This feature adds AI-generated titles and descriptions for git commits using Mastra AI and OpenRouter.

## Setup

1. **Get an OpenRouter API Key**
   - Visit https://openrouter.ai/keys
   - Create an account and generate an API key
   - You'll need to add credits to your account to use the API

2. **Configure the API Key**
   - Open the `.env` file in the app directory
   - Replace `your_openrouter_api_key_here` with your actual API key:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

3. **Start the Application**
   ```bash
   bun run dev
   ```

4. **Navigate to Git History**
   - Open http://localhost:3000/git-history
   - You'll see the git commit list with a new "Generate AI Description" button on each commit

## Usage

1. Click the **"Generate AI Description"** button on any commit
2. The AI will analyze the commit diff and generate:
   - A concise, descriptive title (max 72 characters)
   - A detailed description explaining:
     - What changes were made
     - Why these changes might have been made
     - The impact of the changes
     - Any notable patterns or techniques used

3. The generated content will appear below the commit information
4. You can regenerate the description by clicking the button again

## Model Used

The feature uses **OpenAI GPT-OSS-120B** through OpenRouter, which is a powerful open-source model capable of understanding code changes and providing technical insights.

## Cost

Each commit analysis will use tokens from your OpenRouter account. The GPT-OSS-120B model is relatively cost-effective. Check your OpenRouter dashboard for usage and billing information.

## Troubleshooting

- **"Failed to generate description. Please check your OPENROUTER_API_KEY"**
  - Verify your API key is correctly set in the `.env` file
  - Ensure you have credits in your OpenRouter account
  - Check that the API key has the correct permissions

- **Button shows "Generating..." but nothing happens**
  - Check the browser console for errors
  - Verify the server is running (`bun run dev`)
  - Check server logs for any error messages

## Technical Implementation

The feature uses:
- **Mastra AI Framework**: For agent orchestration and LLM integration
- **OpenRouter Provider**: To access the GPT-OSS-120B model
- **TanStack Start Server Functions**: For backend processing
- **React State Management**: For UI updates and loading states

The implementation is in `/app/src/routes/git-history.tsx`