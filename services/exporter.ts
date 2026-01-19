
import { ChatThread, AIAnalysisResult } from '../types';
import { format } from 'date-fns';

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

  const analysisHtml = analysis ? `
    <div class="analysis-section">
      <h3>AI Conversation Insights</h3>
      <div class="analysis-grid">
        <div class="analysis-card">
          <label>Summary</label>
          <p>${analysis.summary}</p>
        </div>
        <div class="analysis-row">
          <div class="analysis-card">
            <label>Sentiment</label>
            <span class="badge badge-indigo">${analysis.sentiment}</span>
          </div>
          <div class="analysis-card">
            <label>Tone</label>
            <span class="badge badge-emerald">${analysis.tone}</span>
          </div>
        </div>
        ${analysis.keyDates.length > 0 ? `
          <div class="analysis-card">
            <label>Key Dates & Appointments</label>
            <ul class="dates-list">
              ${analysis.keyDates.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat with ${thread.contactName}</title>
    <style>
        :root {
            --primary: #4f46e5;
            --primary-light: #eef2ff;
            --bg: #f8fafc;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --white: #ffffff;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            line-height: 1.5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: var(--white);
            border-radius: 24px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 90vh;
        }
        header {
            padding: 30px;
            background: var(--white);
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
        }
        header h1 { margin: 0; font-size: 24px; color: #0f172a; }
        header p { margin: 5px 0 0; color: var(--text-muted); font-size: 14px; }
        
        .analysis-section {
            padding: 25px;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
        }
        .analysis-section h3 { margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .analysis-grid { display: flex; flex-direction: column; gap: 15px; }
        .analysis-card { background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .analysis-card label { display: block; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; }
        .analysis-card p { margin: 0; font-size: 14px; }
        .analysis-row { display: flex; gap: 15px; }
        .analysis-row .analysis-card { flex: 1; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
        .badge-indigo { background: #eef2ff; color: #4f46e5; }
        .badge-emerald { background: #ecfdf5; color: #059669; }
        .dates-list { margin: 0; padding-left: 20px; font-size: 13px; color: #475569; }

        .chat-area { padding: 40px 20px; flex: 1; }
        .date-header { text-align: center; margin: 30px 0; position: relative; }
        .date-header::before { content: ''; position: absolute; left: 0; top: 50%; width: 100%; height: 1px; background: #e2e8f0; z-index: 1; }
        .date-header span { position: relative; z-index: 2; background: var(--white); padding: 0 15px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        
        .message-container { display: flex; flex-direction: column; margin-bottom: 20px; max-width: 80%; }
        .message-container.sent { align-self: flex-end; align-items: flex-end; margin-left: auto; }
        .message-container.received { align-self: flex-start; align-items: flex-start; }
        
        .message-bubble {
            padding: 12px 18px;
            border-radius: 18px;
            font-size: 15px;
            word-wrap: break-word;
        }
        .sent .message-bubble {
            background-color: var(--primary);
            color: white;
            border-bottom-right-radius: 4px;
        }
        .received .message-bubble {
            background-color: #f1f5f9;
            color: var(--text-main);
            border-bottom-left-radius: 4px;
        }
        .message-time {
            font-size: 10px;
            color: var(--text-muted);
            margin-top: 5px;
            padding: 0 5px;
        }
        
        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { min-height: 100vh; border-radius: 0; }
            .message-container { max-width: 90%; }
        }
        footer { padding: 20px; text-align: center; font-size: 12px; color: var(--text-muted); border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${thread.contactName}</h1>
            <p>${thread.address}</p>
        </header>
        
        ${analysisHtml}

        <div class="chat-area">
            ${messagesHtml}
        </div>

        <footer>
            Generated by SMS to FIG Converter
        </footer>
    </div>
</body>
</html>
  `;
};
