import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/generate-email', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { industry, emailContext, goals, fileContents } = req.body;

    if (!industry || !emailContext || !goals) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `Generate a single optimized email for the following context:
      Industry: ${industry}
      Email Context: ${emailContext}
      Goals: ${goals}
      
      Reference Email Examples:
      ${fileContents.join('\n\n')}
    `;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: process.env.SYSTEM_PROMPT
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const generatedEmail = response.data.choices[0].message.content;
    const tokensUsed = response.data.usage.total_tokens;

    res.json({ generatedEmail, tokensUsed });
  } catch (error) {
    console.error('Error generating email:', error);
    
    let errorMessage = 'An error occurred while generating the email';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.request) {
      errorMessage = 'No response received from OpenAI API';
    }

    res.status(statusCode).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});