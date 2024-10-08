const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI API key not configured' }) };
  }

  try {
    const { industry, emailContext, goals, fileContents } = JSON.parse(event.body);

    if (!industry || !emailContext || !goals) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
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

    return {
      statusCode: 200,
      body: JSON.stringify({ generatedEmail, tokensUsed })
    };
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

    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};