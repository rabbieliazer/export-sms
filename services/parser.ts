
import { SMSMessage, ChatThread } from '../types';

export const parseSMSXml = async (xmlString: string): Promise<ChatThread[]> => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const smsNodes = xmlDoc.getElementsByTagName('sms');
  const mmsNodes = xmlDoc.getElementsByTagName('mms');

  const messages: SMSMessage[] = [];

  // Parse standard SMS
  for (let i = 0; i < smsNodes.length; i++) {
    const node = smsNodes[i];
    const address = node.getAttribute('address') || 'Unknown';
    const body = node.getAttribute('body') || '';
    const date = parseInt(node.getAttribute('date') || '0', 10);
    const typeCode = node.getAttribute('type'); // 1 = received, 2 = sent
    const contactName = node.getAttribute('contact_name') || undefined;

    messages.push({
      id: `sms-${i}`,
      address,
      body,
      date,
      type: typeCode === '2' ? 'sent' : 'received',
      contactName: contactName === '(Unknown)' ? undefined : contactName
    });
  }

  // Parse MMS (Simplified)
  for (let i = 0; i < mmsNodes.length; i++) {
    const node = mmsNodes[i];
    const address = node.getAttribute('address') || 'Unknown';
    const date = parseInt(node.getAttribute('date') || '0', 10);
    const msgBox = node.getAttribute('msg_box'); // 1 = received, 2 = sent
    
    // MMS body is often in text parts
    const parts = node.getElementsByTagName('part');
    let body = '';
    for (let j = 0; j < parts.length; j++) {
        if (parts[j].getAttribute('ct') === 'text/plain') {
            body += parts[j].getAttribute('text') || '';
        }
    }

    if (body) {
        messages.push({
          id: `mms-${i}`,
          address,
          body,
          date,
          type: msgBox === '2' ? 'sent' : 'received',
        });
    }
  }

  // Group by address
  const threadsMap = new Map<string, ChatThread>();

  messages.sort((a, b) => a.date - b.date).forEach(msg => {
    const cleanAddress = msg.address.replace(/\s+/g, '');
    const existing = threadsMap.get(cleanAddress);
    if (existing) {
      existing.messages.push(msg);
      existing.lastMessageDate = Math.max(existing.lastMessageDate, msg.date);
      if (!existing.contactName && msg.contactName) {
        existing.contactName = msg.contactName;
      }
    } else {
      threadsMap.set(cleanAddress, {
        address: cleanAddress,
        contactName: msg.contactName || cleanAddress,
        messages: [msg],
        lastMessageDate: msg.date
      });
    }
  });

  return Array.from(threadsMap.values()).sort((a, b) => b.lastMessageDate - a.lastMessageDate);
};
