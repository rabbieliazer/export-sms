
import { ChatThread, AIAnalysisResult } from '../types';
import { format } from 'date-fns';

/**
 * Generates a clean HTML file for a single chat thread.
 */
export const generateStandaloneHTML = (thread: ChatThread, analysis: AIAnalysisResult | null): string => {
  const messagesHtml = thread.messages.map((msg, i) => {
    const isNewDay = i === 0 || format(msg.date, 'yyyyMMdd') !== format(thread.messages[i-1].date, 'yyyyMMdd');
    const dateHeader = isNewDay ? `
      <div class="date-header">
        <span>${format(msg.date, 'EEEE, MMMM do, yyyy')}</span>
      </div>
    ` : '';

    return `
      ${dateHeader}
      <div class="message-container ${msg.type}">
        <div class="message-bubble">
          ${msg.body.replace(/\n/g, '<br>')}
        </div>
        <div class="message-time">${format(msg.date, 'h:mm a')}</div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat with ${thread.contactName}</title>
    <style>
        :root { --primary: #4f46e5; --bg: #f8fafc; --text: #1e293b; --muted: #64748b; }
        body { font-family: sans-serif; background: var(--bg); color: var(--text); padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; display: flex; flex-direction: column; min-height: 90vh; }
        header { padding: 20px; border-bottom: 1px solid #eee; text-align: center; }
        .chat-area { padding: 20px; flex: 1; display: flex; flex-direction: column; }
        .date-header { text-align: center; margin: 20px 0; color: var(--muted); font-size: 12px; font-weight: bold; border-top: 1px solid #eee; padding-top: 10px; }
        .message-container { display: flex; flex-direction: column; margin-bottom: 15px; max-width: 80%; }
        .message-container.sent { align-self: flex-end; align-items: flex-end; }
        .message-container.received { align-self: flex-start; align-items: flex-start; }
        .message-bubble { padding: 12px 16px; border-radius: 15px; font-size: 14px; }
        .sent .message-bubble { background: var(--primary); color: white; border-bottom-right-radius: 2px; }
        .received .message-bubble { background: #f1f5f9; border-bottom-left-radius: 2px; }
        .message-time { font-size: 10px; color: var(--muted); margin-top: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <header><h1>${thread.contactName}</h1><p>${thread.address}</p></header>
        <div class="chat-area">${messagesHtml}</div>
    </div>
</body>
</html>`;
};

/**
 * Generates a full portable version of the entire application.
 * Note: This relies on the browser environment to package currently active modules.
 */
export const generatePortableApp = (appSource: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SMS to FIG Portable</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Inter', sans-serif; background-color: #f8fafc; } </style>
<script type="importmap">
{
  "imports": {
    "react/": "https://esm.sh/react@^19.2.3/",
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "@google/genai": "https://esm.sh/@google/genai@^1.36.0",
    "lucide-react": "https://esm.sh/lucide-react@^0.562.0",
    "date-fns": "https://esm.sh/date-fns@^4.1.0"
  }
}
</script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    ${appSource}
  </script>
</body>
</html>`;
};
