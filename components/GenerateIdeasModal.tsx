
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type } from '@google/genai';
import { XIcon, SparklesIcon, SpinnerIcon } from './icons';

interface Idea {
    title: string;
    description: string;
    requiredSkills: string[];
}

interface GenerateIdeasModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUseIdea: (idea: Idea) => void;
}

const GenerateIdeasModal: React.FC<GenerateIdeasModalProps> = ({ isOpen, onClose, onUseIdea }) => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic to generate ideas.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setIdeas([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Based on the topic "${topic}", generate 3 innovative project collaboration ideas suitable for university students. For each idea, provide a unique and creative "title", a brief "description" (2-3 sentences), and a list of 3 to 5 "requiredSkills".`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                requiredSkills: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                },
                            },
                            required: ["title", "description", "requiredSkills"],
                        },
                    },
                },
            });
            
            const jsonStr = response.text.trim();
            const generatedIdeas = JSON.parse(jsonStr);
            setIdeas(generatedIdeas);

        } catch (e) {
            console.error(e);
            setError('Failed to generate ideas. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state after a short delay to allow for exit animation
        setTimeout(() => {
            setTopic('');
            setIdeas([]);
            setError(null);
            setIsLoading(false);
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ ease: 'easeInOut', duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-secondary/10 p-2 rounded-lg">
                                    <SparklesIcon className="w-6 h-6 text-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-heading">Generate Project Ideas</h2>
                                    <p className="text-sm text-content">Let AI help you brainstorm your next project.</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-100">
                                <XIcon className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., A web app for music lovers using React"
                                className="flex-grow w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <motion.button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                                className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon />}
                                <span>{isLoading ? 'Generating...' : 'Generate'}</span>
                            </motion.button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-hide">
                             {error && <p className="text-red-500 text-center">{error}</p>}
                             {ideas.length > 0 && (
                                <div className="space-y-4">
                                    {ideas.map((idea, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-slate-50 border border-border rounded-lg p-4"
                                        >
                                            <h3 className="font-bold text-heading">{idea.title}</h3>
                                            <p className="text-sm text-content my-2">{idea.description}</p>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {idea.requiredSkills.map(skill => (
                                                        <span key={skill} className="text-xs font-medium text-slate-600 bg-slate-200 py-1 px-2 rounded-md">{skill}</span>
                                                    ))}
                                                </div>
                                                <motion.button
                                                    onClick={() => onUseIdea(idea)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-4 rounded-lg text-sm"
                                                >
                                                    Use this Idea
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                             )}
                             {!isLoading && ideas.length === 0 && !error && (
                                <div className="text-center text-content py-10">
                                    <p>Enter a topic above and click "Generate" to see project ideas.</p>
                                </div>
                             )}
                        </div>
                    </motion.div>
                    <style>{`
                        .scrollbar-hide::-webkit-scrollbar { display: none; }
                        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GenerateIdeasModal;
