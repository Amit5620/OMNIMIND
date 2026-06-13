import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { 
  Plus, MessageSquare, Trash2, Edit3, Send, Edit2, 
  Paperclip, Image as ImageIcon, FileText, 
  Youtube, Globe, Languages, Code, ChevronDown, Bot, User, Loader2, Pencil, X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { chatAPI, chatHistoryAPI } from '../lib/api';
import type { ImageEditRequest } from '../lib/api';
import { useAuth } from '../components/FirebaseProvider';
import { MarkdownMessage } from '../components/MarkdownMessage';


type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'file';
  messageSource?: 'summary' | 'qa' | 'plain';
  imageData?: string;
  imageUrl?: string;  // For generated images
};


type Chat = {
  id: string;
  title: string;
  createdAt: number;
  messages?: Message[];  // Store messages with chat
};

const tools = [
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'summarize', label: 'Summarizer', icon: FileText },
  { id: 'generate', label: 'Image Gen', icon: ImageIcon },
  { id: 'youtube', label: 'YouTube AI', icon: Youtube },
  // Prefer the “second” (working) web summarization interface.
  // This tool id maps to the same backend endpoint as the header “Website Summarizer”.
  { id: 'web', label: 'Web Summarization', icon: Globe },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'coding', label: 'Coding AI', icon: Code },
];

const getToolTitle = (toolId: string) => {
  const tool = tools.find(t => t.id === toolId);
  return tool ? `${tool.label} Conversation` : 'New Conversation';
};

export default function Workspace() {
  const [searchParams] = useSearchParams();
const normalizeTool = (tool: string | null) => {
  if (!tool) return 'chat';
  if (tool === 'website') return 'web';
  return tool;
};
const [activeTool, setActiveTool] = useState(normalizeTool(searchParams.get('tool')));
  const { user, profile } = useAuth();
  const userId = user?.uid || 'anonymous';
  const userName = profile?.username || user?.displayName || 'User';
  const activeToolForHistory =
    activeTool === 'generate'
      ? 'image'
      : activeTool === 'web'
        ? 'website'
        : activeTool === 'summarize'
          ? 'document'
          : activeTool;
  const [chats, setChats] = useState<Chat[]>([
    { id: 'new_chat', title: 'New Conversation', createdAt: Date.now() },
  ]);
  const [activeChatId, setActiveChatId] = useState('new_chat');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', role: 'assistant', content: 'OmniMind system initialized. How can I assist your intelligence today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [selectedDocsError, setSelectedDocsError] = useState<string | null>(null);

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const MAX_DOCUMENT_UPLOADS = 3;
  const SUPPORTED_DOCUMENT_EXTENSIONS = ['txt', 'md', 'pdf', 'docx'];
  const BINARY_DOCUMENT_EXTENSIONS = ['pdf', 'docx'];
  const TRANSLATION_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'ru', label: 'Russian' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'ar', label: 'Arabic' },
    { code: 'hi', label: 'Hindi' },
    { code: 'bn', label: 'Bengali' },
    { code: 'ur', label: 'Urdu' },
    { code: 'fa', label: 'Persian' },
    { code: 'tr', label: 'Turkish' },
    { code: 'nl', label: 'Dutch' },
    { code: 'sv', label: 'Swedish' },
    { code: 'da', label: 'Danish' },
    { code: 'no', label: 'Norwegian' },
    { code: 'fi', label: 'Finnish' },
    { code: 'pl', label: 'Polish' },
    { code: 'ro', label: 'Romanian' },
    { code: 'cs', label: 'Czech' },
    { code: 'el', label: 'Greek' },
    { code: 'he', label: 'Hebrew' },
    { code: 'vi', label: 'Vietnamese' },
    { code: 'th', label: 'Thai' },
    { code: 'id', label: 'Indonesian' },
    { code: 'ms', label: 'Malay' },
    { code: 'hu', label: 'Hungarian' },
    { code: 'uk', label: 'Ukrainian' },
    { code: 'sr', label: 'Serbian' },
    { code: 'hr', label: 'Croatian' },
    { code: 'bg', label: 'Bulgarian' },
    { code: 'sk', label: 'Slovak' },
    { code: 'sl', label: 'Slovenian' },
    { code: 'sw', label: 'Swahili' },
    { code: 'tl', label: 'Filipino' },
    { code: 'ca', label: 'Catalan' },
  ];

useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

// Load chat history on mount and tool change
  useEffect(() => {
    let isMounted = true;
    const loadChatHistory = async () => {
      if (!userId || userId === 'anonymous') return;
      
      // Show loading animation
      setIsChatLoading(true);
      
      try {
        const history = await chatHistoryAPI.getHistory({ 
          user_id: userId, 
          tool: activeToolForHistory, 
          limit: 50 
        });
        
        if (!isMounted) return;
        
        if (history.chats && history.chats.length > 0) {
          const loadedChats: Chat[] = history.chats.map(c => ({
            id: c.chat_id,
            title: c.title || getToolTitle(activeTool),
            createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
            messages: (c.messages || []).map((m: any, idx: number) => ({
              id: m.message_id || `msg_${idx}_${Date.now()}`,
              role: m.role || 'assistant',
              content: m.content || '',
              type: m.type,
              messageSource: m.message_source ? (m.message_source as 'summary' | 'qa' | 'plain') : undefined,
              imageData: m.image_data,
              imageUrl: m.image_url
            }))
          }));
          
          setChats(loadedChats);
          
          // Set active chat to the most recent one
          const mostRecentChat = loadedChats[0];
          setActiveChatId(mostRecentChat.id);
          
          // Load messages from the active chat
          const msgs = mostRecentChat.messages || [];
          if (msgs.length > 0) {
            setMessages(msgs);
          } else {
            setMessages([{ id: 'm1', role: 'assistant', content: `Ready for ${tools.find(t => t.id === activeTool)?.label}. How can I help?` }]);
          }
        } else {
          // No chats for this tool, show new chat
          const newChat = { id: 'new_chat', title: getToolTitle(activeTool), createdAt: Date.now() };
          setChats([newChat]);
          setActiveChatId('new_chat');
          setMessages([{ id: 'm1', role: 'assistant', content: `Ready for ${tools.find(t => t.id === activeTool)?.label}. How can I help?` }]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Fallback to new chat
        const newChat = { id: 'new_chat', title: getToolTitle(activeTool), createdAt: Date.now() };
        setChats([newChat]);
        setActiveChatId('new_chat');
        setMessages([{ id: 'm1', role: 'assistant', content: `Ready for ${tools.find(t => t.id === activeTool)?.label}. How can I help?` }]);
      } finally {
        if (isMounted) {
          setIsChatLoading(false);
        }
      }
    };
    
    loadChatHistory();
    
    return () => {
      isMounted = false;
    };
  }, [userId, activeTool]); // Re-run on tool change

  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    if (chatId === activeChatId) return;
    
    const selectedChat = chats.find(c => c.id === chatId);
    if (selectedChat) {
      setActiveChatId(chatId);
      const msgs = (selectedChat.messages || []) as Message[];
      setMessages(msgs.length > 0 ? msgs : [{ id: 'm1', role: 'assistant', content: `Ready for ${tools.find(t => t.id === activeTool)?.label}. How can I help?` }]);
    }
  };

  // Handle new chat creation
  const handleNewChat = () => {
    const newChat = { id: 'new_chat', title: getToolTitle(activeTool), createdAt: Date.now() };
    setChats([newChat, ...chats]);
    setActiveChatId('new_chat');
    setMessages([{ id: 'm1', role: 'assistant', content: `Ready for ${tools.find(t => t.id === activeTool)?.label}. How can I help?` }]);
  };

  const handleSend = async () => {

  if (activeTool === 'summarize') return; // Summarizer runs via Upload + Analyze only.
  if (!input.trim() || isLoading) return;




  const contentToSend = input;
  const userMsg: Message = { id: Date.now().toString(), role: 'user', content: contentToSend };
  const currentMessages = [...messages, userMsg];

  setMessages(currentMessages);
  setInput('');
  setIsLoading(true);

  const toolAtSend = activeTool;
  const chatIdAtSend = activeChatId;
  const chatIdToUse = chatIdAtSend !== 'new_chat' ? chatIdAtSend : undefined;

  // Determine message source for markdown rendering
  let messageSource: 'summary' | 'qa' | 'plain' = 'plain';
  if (toolAtSend === 'youtube' && /^https?:\/\/.+/.test(contentToSend)) {
    messageSource = 'summary';
  } else if (toolAtSend === 'web' && /^https?:\/\/.+/.test(contentToSend)) {
    messageSource = 'summary';
  } else if ((toolAtSend === 'youtube' || toolAtSend === 'web') && chatIdToUse && !/^https?:\/\/.+/.test(contentToSend)) {
    messageSource = 'qa';
  }

  try {
    let response = '';

    let newChatId = chatIdAtSend;

    switch (toolAtSend) {
      case 'chat': {
        const chatRes = await chatAPI.sendMessage({
          message: contentToSend,
          chat_id: chatIdToUse,
          user_id: userId,
        });
        response = chatRes.response;
        newChatId = chatRes.chat_id;
        break;
      }

      case 'coding': {
        const codeRes = await chatAPI.coding({
          message: contentToSend,
          chat_id: chatIdToUse,
          user_id: userId,
          language: 'python',
        });
        response = codeRes.response;
        newChatId = codeRes.chat_id;
        break;
      }

      case 'youtube': {
        // If the input looks like a URL, run summarization; otherwise treat as QA against the chat
        if (/^https?:\/\/.+/.test(contentToSend)) {
          const ytRes = await chatAPI.youtubeSummarize({
            url: contentToSend,
            chat_id: chatIdToUse,
            user_id: userId,
          });
          response = ytRes.response;
          newChatId = ytRes.chat_id;
        } else if (chatIdToUse) {
          const qaRes = await chatAPI.qa({ chat_id: chatIdToUse, question: contentToSend, user_id: userId });
          response = qaRes.response;
          newChatId = qaRes.chat_id;
        } else {
          // no chat to ask against
          response = 'Please summarize a video first, then ask follow-up questions.';
        }
        break;
      }

      case 'web': {
        if (/^https?:\/\/.+/.test(contentToSend)) {
          const webRes = await chatAPI.websiteSummarize({
            url: contentToSend,
            chat_id: chatIdToUse,
            user_id: userId,
          });
          response = webRes.response;
          newChatId = webRes.chat_id;
        } else if (chatIdToUse) {
          const qaRes = await chatAPI.qa({ chat_id: chatIdToUse, question: contentToSend, user_id: userId });
          response = qaRes.response;
          newChatId = qaRes.chat_id;
        } else {
          response = 'Please summarize a website first, then ask follow-up questions.';
        }
        break;
      }

      case 'generate': {
        const imgRes = await chatAPI.generateImage({
          prompt: contentToSend,
          chat_id: chatIdToUse,
          user_id: userId,
        });

        newChatId = imgRes.chat_id;
        const imageMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Here's your generated image:`,
          type: 'image',
          imageUrl: imgRes.images[0],
        };

        const finalMessages = [...currentMessages, imageMsg];
        setMessages(finalMessages);

        setActiveChatId(newChatId);
        setChats(prevChats => {
          const updatedChat = {
            id: newChatId,
            title: contentToSend.slice(0, 30) + '...',
            createdAt: Date.now(),
            messages: finalMessages,
          };

          const existingChatIndex = prevChats.findIndex(c => c.id === newChatId);
          if (existingChatIndex >= 0) {
            return prevChats.map(chat =>
              chat.id === newChatId ? { ...chat, messages: finalMessages } : chat
            );
          }

          return [updatedChat, ...prevChats.filter(c => c.id !== 'new_chat')];
        });

        return;
      }

      case 'translate': {
        const transRes = await chatAPI.translate({
          text: contentToSend,
          source_language: 'auto',
          target_language: targetLanguage,
          chat_id: chatIdToUse,
          user_id: userId,
        });
        response = transRes.translated_text;
        newChatId = transRes.chat_id;
        break;
      }

      default: {
        const defaultRes = await chatAPI.sendMessage({
          message: contentToSend,
          chat_id: chatIdToUse,
          user_id: userId,
        });
        response = defaultRes.response;
        newChatId = defaultRes.chat_id;
      }
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      messageSource,
    };

    const finalMessages = [...currentMessages, assistantMsg];
    setMessages(finalMessages);

    setActiveChatId(newChatId);
    setChats(prevChats => {
      const existingChatIndex = prevChats.findIndex(c => c.id === newChatId);
      if (existingChatIndex >= 0) {
        return prevChats.map(chat =>
          chat.id === newChatId ? { ...chat, messages: finalMessages } : chat
        );
      }

      const newChat: Chat = {
        id: newChatId,
        title: contentToSend.slice(0, 30) + '...',
        createdAt: Date.now(),
        messages: finalMessages,
      };
      return [newChat, ...prevChats.filter(c => c.id !== 'new_chat')];
 });
  } catch (error: any) {
    console.error('API Error:', error);

    const assistantContent =
      error?.message?.toLowerCase().includes('timeout')
        ? 'The YouTube summarization request timed out. Please try again in a moment.'
        : error?.message
        ? `I apologize, but I encountered an error processing your request: ${error.message}`
        : 'I apologize, but I encountered an error processing your request. Please try again.';

    const errorMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: assistantContent,
    };
    setMessages((prev) => [...prev, errorMsg]);
  } finally {
    setIsLoading(false);
  }
};

const createNewChat = async () => {
  handleNewChat();
};

const deleteChat = async (id: string) => {
    // Optimistically remove from local state first for better UX
    const remaining = chats.filter(c => c.id !== id);
    
    try {
      // Call backend API to delete chat
      await chatHistoryAPI.deleteChat(userId, id);
      console.log('Chat deleted:', id);
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Revert on error - restore the chat
      setChats(chats);
      return;
    }
    
    // Update local state only after successful delete
    setChats(remaining);
    if (activeChatId === id) {
if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
        const msgs = remaining[0].messages;
        setMessages(msgs && msgs.length > 0 ? msgs : [{ id: 'm1', role: 'assistant', content: 'How can I help you?' }]);
      } else {
        // Create new empty chat if no chats remain - use placeholder ID
        setActiveChatId('new_chat');
        setChats([{ id: 'new_chat', title: 'New Conversation', createdAt: Date.now() }]);
        setMessages([{ id: 'm1', role: 'assistant', content: 'How can I help you?' }]);
      }
    }
  };

const editChatTitle = async (id: string, newTitle: string) => {
    // Store original title for revert on error
    const originalChat = chats.find(c => c.id === id);
    const originalTitle = originalChat?.title;
    
    // Optimistically update local state
    setChats(chats.map(c => c.id === id ? { ...c, title: newTitle } : c));
    
    try {
      await chatHistoryAPI.editChatTitle(userId, id, newTitle);
      console.log('Chat title updated:', id, newTitle);
    } catch (error) {
      console.error('Error editing chat title:', error);
      // Revert on error (ensure title is always a string)
      setChats(chats.map(c => (c.id === id ? { ...c, title: originalTitle ?? c.title } : c)));
    }
  };

  // Handle document upload
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setUploadError(null);
    setSelectedDocsError(null);
    if (files.length === 0) return;

    if (files.length > MAX_DOCUMENT_UPLOADS) {
      const msg = `Please upload up to ${MAX_DOCUMENT_UPLOADS} documents at once.`;
      setSelectedDocsError(msg);
      e.target.value = '';
      return;
    }

    const invalid = files.find(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return !SUPPORTED_DOCUMENT_EXTENSIONS.includes(ext);
    });

    if (invalid) {
      setSelectedDocsError(
        `Unsupported file type: ${invalid.name}. Supported formats are .txt, .md, .pdf, .docx.`
      );
      e.target.value = '';
      return;
    }

    setSelectedDocs(files);
  };

  const handleAnalyzeDocuments = async () => {
    if (!userId || userId === 'anonymous') {
      setSelectedDocsError('Please login to use the summarizer.');
      return;
    }
    if (selectedDocs.length === 0) return;

    setUploadError(null);
    setSelectedDocsError(null);
    setIsUploading(true);

    try {
      const docChatIdToUse = activeChatId && activeChatId.startsWith('doc_') ? activeChatId : undefined;
      let currentChatId = docChatIdToUse;

      for (const file of selectedDocs) {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        let fileContent: string;
        let contentEncoding: 'utf-8' | 'base64' = 'utf-8';

        if (BINARY_DOCUMENT_EXTENSIONS.includes(extension)) {
          const buffer = await file.arrayBuffer();
          fileContent = arrayBufferToBase64(buffer);
          contentEncoding = 'base64';
        } else {
          fileContent = await file.text();
        }

        const docRes = await chatAPI.documentSummarize({
          file_content: fileContent,
          file_name: file.name,
          chat_id: currentChatId,
          user_id: userId,
          content_encoding: contentEncoding,
        });

        if (docRes.chat_id && docRes.chat_id !== activeChatId) {
          currentChatId = docRes.chat_id;
          setActiveChatId(docRes.chat_id);
          const newChat: Chat = {
            id: docRes.chat_id,
            title: file.name.slice(0, 30) + '...',
            createdAt: Date.now(),
            messages: []
          };
          setChats(prevChats => [newChat, ...prevChats.filter(c => c.id !== 'new_chat')]);
        }

        const docMsg: Message = {
          id: `${Date.now()}-${file.name}`,
          role: 'assistant',
          content: docRes.response,
          type: 'file',
          messageSource: 'summary',
        };

        setMessages(prev => [...prev, docMsg]);
      }

      setSelectedDocs([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error('Error analyzing documents:', error);
      setUploadError(error?.message || 'Sorry, I had trouble processing those documents.');
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble processing those documents.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsUploading(false);
    }
  };


  // Handle image edit
  const handleImageEdit = (imageUrl: string) => {
    setEditingImageUrl(imageUrl);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editPrompt.trim() || !editingImageUrl || !userId) return;
    
    setIsLoading(true);
    setShowEditModal(false);
    
    try {
      const editRes = await chatAPI.editImage({
        edit_prompt: editPrompt,
        base_image_url: editingImageUrl,
        chat_id: activeChatId,
        user_id: userId
      });
      
      const editMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Edited image: ${editPrompt}`,
        type: 'image',
        imageUrl: editRes.images[0]
      };
      setMessages(prev => [...prev, editMsg]);
      setEditPrompt('');
    } catch (error) {
      console.error('Edit error:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, image edit failed. Try again.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        // For now, just show the image in chat
        const imgMsg: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `Uploaded: ${file.name}`,
          type: 'image',
          imageData: reader.result as string
        };
        setMessages(prev => [...prev, imgMsg]);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderToolSpecificInput = () => {
    switch (activeTool) {
      case 'youtube':
      case 'web':
        return (
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              {activeTool === 'youtube' ? <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" /> : <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />}
              <input 
                type="url"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeTool === 'youtube' ? "Paste YouTube Video URL..." : "Paste Website URL..."}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-sm"
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-primary text-white px-6 rounded-xl font-bold hover:scale-105 transition-all text-xs uppercase"
            >
              Analyze
            </button>
          </div>
        );

      case 'generate':
        return (
          <div className="w-full space-y-4">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Describe the image you want to generate in detail..."
               className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[80px] focus:outline-none focus:border-primary transition-all text-sm resize-none"
             />
             <div className="flex justify-end">
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all text-sm shadow-lg shadow-rose-500/20"
                >
                  Generate Art
                </button>
             </div>
          </div>
        )
      case 'translate':
        return (
          <div className="w-full space-y-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Enter text to translate to ${TRANSLATION_LANGUAGES.find(lang => lang.code === targetLanguage)?.label || 'English'}...`}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-primary transition-all text-sm resize-none"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <label htmlFor="targetLanguage" className="font-semibold">Target language:</label>
                <select
                  id="targetLanguage"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="bg-dark/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                >
                  {TRANSLATION_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="self-start bg-primary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all text-sm uppercase"
              >
                Translate
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative bg-dark/40 border border-white/10 focus-within:border-primary/50 rounded-2xl p-2 transition-all shadow-2xl backdrop-blur-xl">
              {activeTool === 'summarize' ? (
                <div className="w-full space-y-4 p-3">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.docx,.md"
                    multiple
                    className="hidden"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-primary/30 px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Paperclip className="h-5 w-5" />
                      Upload Documents
                    </button>

                    <button 
                      onClick={() => {
                        setSelectedDocs([]);
                        setSelectedDocsError(null);
                        setUploadError(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={isUploading || selectedDocs.length === 0}
                      className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>

                  {selectedDocs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedDocs.map((f) => (
                        <span
                          key={`${f.name}-${f.size}`}
                          className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold"
                        >
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {(selectedDocsError || uploadError) && (
                    <div className="text-xs text-amber-300">
                      {selectedDocsError || uploadError}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button 
                      onClick={handleAnalyzeDocuments}
                      disabled={isUploading || selectedDocs.length === 0}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {isUploading ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Talk to ${tools.find(t => t.id === activeTool)?.label}...`}
                    className="w-full bg-transparent p-4 min-h-[60px] max-h-[200px] text-white resize-none focus:outline-none"

                    rows={1}
                  />
                  <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-1">
                      <input 
                        type="file" 
                        ref={imageInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button 
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Code className="h-5 w-5" /></button>
                    </div>
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all",
                        input.trim() ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105" : "bg-white/5 text-gray-600"
                      )}
                    >
                      Send <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-dark">
{/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col hidden md:flex">
        <div className="p-4">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 p-3 rounded-xl transition-all"
          >
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">New Chat</span>
          </button>
        </div>
        
        {/* Loading indicator for chat history */}
        {isChatLoading && (
          <div className="px-4 py-2 flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading chats...</span>
          </div>
        )}

<div className="flex-1 overflow-y-auto px-2 space-y-1">
          {chats.map(chat => (
            <div 
              key={chat.id}
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                activeChatId === chat.id ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              )}
              onClick={() => handleChatSelect(chat.id)}
            >
              <MessageSquare className="h-4 w-4" />
<span className="text-sm truncate pr-8">{chat.title}</span>
              <div className="absolute right-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const newTitle = prompt('Enter new title:', chat.title);
                    if (newTitle && newTitle.trim()) editChatTitle(chat.id, newTitle.trim());
                  }} 
                  className="p-1 hover:text-white"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} 
                  className="p-1 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
           <div className="flex items-center gap-3 p-2 rounded-xl bg-dark/40 border border-white/5">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">AK</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-white">Amit Kumar</p>
                <p className="text-[10px] text-gray-500 truncate">Premium Plan</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Tool Selector Top Bar */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-dark/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
             <div className="relative group">
                <button className="flex items-center gap-2 text-sm font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-primary/30 transition-all">
                   {tools.find(t => t.id === activeTool)?.label || 'AI Chat'}
                   <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-white/10 bg-dark/95 p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                   {tools.map(tool => (
                      <button 
                        key={tool.id}
                        onClick={() => {
                          // Force correct tool mode + correct chat collection.
                          // Particularly fixes: switching to web summaries should not show AI Chat UI.
                          setActiveTool(tool.id);
                          setInput('');
                          setChats([]); // Clear chats, will reload for new tool
                          setActiveChatId('new_chat');
                          setMessages([{ id: 'm1', role: 'assistant', content: `Switched to ${tool.label}. Ready to help!` }]);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors",
                          activeTool === tool.id && "bg-primary/10 text-primary"
                        )}
                      >
                        <tool.icon className="h-4 w-4" /> {tool.label}
                      </button>
                   ))}
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <button className="p-2 text-gray-500 hover:text-white transition-colors"><Plus className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((m, i) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 md:gap-6",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center border",
                  m.role === 'user' ? "border-primary/20 bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-gray-400"
                )}>
                  {m.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div className={cn(
                  "max-w-[85%] md:max-w-[70%] space-y-2",
                  m.role === 'user' ? "items-end text-right" : "items-start text-left"
                )}>
                <div className={cn(
                    "rounded-2xl text-sm md:text-base leading-relaxed shadow-inner",
                    m.role === 'user' ? "bg-primary text-white rounded-tr-none" : "rounded-tl-none"
                  )}>
                    {m.role === 'assistant' ? (
                      <div className="space-y-3">
                        <MarkdownMessage content={m.content} isUser={false} />
                        {(m.type === 'image' || m.imageUrl) && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                            <img
                              src={m.imageUrl || m.imageData}
                              alt="AI Generated"
                              className="w-full max-h-[500px] object-contain rounded-lg"
                              style={{ maxHeight: '500px', width: 'auto', height: 'auto' }}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<div class="text-center p-4 text-gray-500">Image could not be loaded</div>';
                              }}
                            />
                          </div>
                        )}
                        {m.imageData && !m.imageUrl && (
                          <div className="mt-3 overflow-hidden rounded-xl">
                            <img
                              src={m.imageData}
                              alt="AI Generated"
                              className="w-full object-cover"
                              crossOrigin="anonymous"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={cn(
                        "p-4 md:p-5 rounded-2xl whitespace-pre-wrap",
                        "bg-primary text-white"
                      )}>
                        {m.content}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-6 items-center animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500"><Bot className="h-5 w-5" /></div>
                <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]" />
                  <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 md:p-10 bg-gradient-to-t from-dark via-dark to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
             {renderToolSpecificInput()}
             <p className="text-[10px] text-center text-gray-600">
               OmniMind Intelligence Gate v1.0. All interactions are monitored for safety.
             </p>
          </div>
        </div>

        {/* Image Edit Modal */}
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-dark border border-white/10 rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">✏️ Edit Image</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="What changes would you like? (e.g. 'add chocolate toppings', 'make it nighttime')"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-primary resize-none mb-4 text-sm"
              />
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditSubmit}
                  disabled={!editPrompt.trim() || isLoading}
                  className="flex-1 bg-primary text-white py-3 px-6 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Generate Edit'
                  )}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-white/20 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
