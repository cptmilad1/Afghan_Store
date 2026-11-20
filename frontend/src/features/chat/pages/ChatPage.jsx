import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api/client';
import { Spinner, EmptyState } from '../../../shared/components/Feedback';

export default function ChatPage() {
  const [conversations, setConversations] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/chat/conversations').then(setConversations).catch((err) => setError(err.message));
  }, []);
  const loadMessages = useCallback(async (conversation) => {
    const data = await apiRequest(`/chat/conversations/${conversation.id}/messages`);
    setMessages(data || []);
    await apiRequest(`/chat/conversations/${conversation.id}/read`, { method: 'POST' });
  }, []);

  const openConversation = async (conversation) => {
    setSelected(conversation);
    setError('');
    try { await loadMessages(conversation); } catch (err) { setError(err.message); }
  };

  useEffect(() => {
    if (!selected) return undefined;
    const timer = window.setInterval(() => loadMessages(selected).catch((err) => setError(err.message)), 5000);
    return () => window.clearInterval(timer);
  }, [selected, loadMessages]);
  const send = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    try {
      await apiRequest(`/chat/conversations/${selected.id}/messages`, { method: 'POST', body: { body } });
      setBody('');
      await loadMessages(selected);
    } catch (err) { setError(err.message); }
  };
  if (!conversations) return <Spinner />;
  return (
    <div className="container page"><span className="eyebrow">Messages</span><h1>Chat</h1>{error && <div className="form-error">{error}</div>}<div className="chat-layout"><aside className="conversation-list">{conversations?.length ? conversations.map((conversation) => <button className={selected?.id === conversation.id ? 'conversation active' : 'conversation'} key={conversation.id} onClick={() => openConversation(conversation)}><strong>{conversation.title || `${conversation.conversation_type} conversation`}</strong><small>{conversation.last_message || 'Open conversation'}</small></button>) : <EmptyState title="No conversations" />}</aside><section className="chat-window">{selected ? <><div className="chat-messages">{messages.map((message) => <div className="chat-message" key={message.id}><strong>{message.sender_id}</strong><p>{message.body}</p><small>{new Date(message.sent_at).toLocaleString()}</small></div>)}</div><form className="chat-compose" onSubmit={send}><textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} placeholder="Write a message" rows="1" /><button className="btn btn-primary">Send</button></form></> : <EmptyState title="Select a conversation" description="Choose a conversation to read and send messages." />}</section></div></div>
  );
}
