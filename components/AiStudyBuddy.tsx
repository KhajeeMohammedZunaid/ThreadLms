import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Chat } from '@google/genai';
import { AppCourse } from '../App';
import { SparklesIcon, XIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from './icons';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const AiStudyBuddy: React.FC<{ course: AppCourse }> = ({ course }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const initializeChat = () => {
        if (chatRef.current) return;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Create a concise summary of the course content for the system instruction
        const courseContentSummary = course.content.map(section => 
            `Section: "${section.sectionTitle}" contains topics like: ${section.items.map(item => item.title).join(', ')}.`
        ).join('\n');
        
        const systemInstruction = `You are an AI Study Buddy, an expert tutor for the course titled "${course.title}". 
Your sole purpose is to help students understand the course material.
You must ONLY answer questions related to this specific course. 
If a question is not about this course, politely decline to answer and guide the user back to the course topics.
Do not answer any general knowledge questions.
Keep your answers concise, friendly, and easy to understand for a student.
Use the following course information as your knowledge base:
- Course Title: ${course.title}
- Course Description: ${course.description}
- What you'll learn: ${course.learnings.join(', ')}
- Course Content Structure:
${courseContentSummary}
`;

        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        setMessages([{ role: 'model', text: `Hi! I'm your AI study buddy for "${course.title}". How can I help you with the course material today?` }]);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: input });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Gemini API error:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        if (!chatRef.current) {
            initializeChat();
        }
    };
    
    return (
        <>
            <motion.button
                onClick={handleOpen}
                className="fixed bottom-6 right-6 bg-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-40"
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open AI Study Buddy"
            >
                <SparklesIcon className="w-8 h-8" />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-24 right-6 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-border"
                    >
                        {/* Header */}
                        <header className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary" />
                                <div>
                                    <h3 className="font-bold text-heading">AI Study Buddy</h3>
                                    <p className="text-xs text-content truncate max-w-[200px]">{course.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-slate-500 hover:bg-slate-200"><XIcon /></button>
                        </header>
                        
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                             {isLoading && (
                                <div className="flex justify-start">
                                    <div className="p-3 rounded-2xl bg-slate-200 rounded-bl-none flex items-center gap-1">
                                        <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
                                        <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }} />
                                        <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <footer className="p-4 border-t border-border flex-shrink-0">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about the course..."
                                    className="flex-1 w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    disabled={isLoading}
                                />
                                <button type="submit" disabled={isLoading || !input.trim()} className="w-10 h-10 bg-primary rounded-full text-white flex items-center justify-center flex-shrink-0 disabled:bg-slate-300">
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AiStudyBuddy;