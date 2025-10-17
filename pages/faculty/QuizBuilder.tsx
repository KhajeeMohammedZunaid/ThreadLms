import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenAI, Type } from '@google/genai';
import { AppCourse } from '../../App';
import { QuizQuestion } from '../../types';
import { SparklesIcon, SpinnerIcon, ChevronDownIcon, CheckCircleIcon, XIcon, ClipboardIcon, CheckIcon, BeakerIcon } from '../../components/icons';
import { useAuth } from '../../src/hooks/useAuth';
import courseService from '../../src/services/course.service';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

const QuizBuilder: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<AppCourse[]>([]);
    const [courseId, setCourseId] = useState<string>('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [topics, setTopics] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[] | null>(null);
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    // Fetch faculty courses
    useEffect(() => {
        const fetchCourses = async () => {
            if (!user || user.role !== 'faculty') return;
            try {
                const fetchedCourses = await courseService.getCoursesByFaculty(user._id);
                setCourses(fetchedCourses as any);
            } catch (err) {
                console.error('Error fetching courses:', err);
            }
        };
        fetchCourses();
    }, [user]);

    const facultyCourses = courses;

    useEffect(() => {
        if (facultyCourses.length > 0 && !courseId) {
            setCourseId(facultyCourses[0]._id || String(facultyCourses[0].id));
        }
    }, [facultyCourses, courseId]);

    const handleGenerateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topics.trim()) {
            setError('Please provide topics for the quiz.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedQuiz(null);

        const selectedCourse = facultyCourses.find(c => (c._id || String(c.id)) === courseId);
        if (!selectedCourse) {
            setError('Please select a valid course.');
            setIsLoading(false);
            return;
        }

        const prompt = `
            You are an expert quiz creator for a learning management system.
            Generate a quiz for the course: "${selectedCourse.title}".
            The quiz should focus on the following topics: "${topics}".
            The difficulty level should be "${difficulty}".
            Generate exactly ${numQuestions} multiple-choice questions.
            For each question, provide a "questionText", and a list of "answerOptions".
            Each "answerOptions" object must have an "answerText" and a boolean "isCorrect".
            Ensure there is exactly one correct answer for each question and at least 3 incorrect answers.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                questionText: { type: Type.STRING },
                                answerOptions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            answerText: { type: Type.STRING },
                                            isCorrect: { type: Type.BOOLEAN },
                                        },
                                        required: ['answerText', 'isCorrect'],
                                    },
                                },
                            },
                            required: ['questionText', 'answerOptions'],
                        },
                    },
                },
            });
            const jsonStr = response.text.trim();
            const quizData = JSON.parse(jsonStr);
            setGeneratedQuiz(quizData);
        } catch (e) {
            console.error(e);
            setError('Failed to generate quiz. Please check your topics or try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (!generatedQuiz) return;
        const jsonString = JSON.stringify(generatedQuiz, null, 2);
        navigator.clipboard.writeText(jsonString).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <h1 className="text-4xl font-bold text-heading mb-2">AI-Powered Quiz Builder</h1>
            <p className="text-lg text-content mb-8">Generate custom quizzes for your courses in seconds.</p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleGenerateQuiz} className="lg:col-span-4 bg-white p-6 rounded-xl border border-border lg:sticky top-10">
                    <h2 className="text-xl font-bold text-heading mb-4">Quiz Configuration</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Course</label>
                            <select value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none">
                                {facultyCourses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Topics</label>
                            <textarea value={topics} onChange={e => setTopics(e.target.value)} rows={3} placeholder="e.g., React Hooks, State Management, CSS Flexbox" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Difficulty</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['Easy', 'Medium', 'Hard'].map(d => (
                                    <button
                                        type="button"
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`relative flex-1 text-sm py-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-faculty-primary focus-visible:ring-offset-2 ${
                                            difficulty === d ? 'text-faculty-primary' : 'text-slate-600 hover:text-slate-800'
                                        }`}
                                        style={{ WebkitTapHighlightColor: "transparent" }}
                                    >
                                        {difficulty === d && (
                                            <motion.div
                                                layoutId="difficulty-pill"
                                                className="absolute inset-0 bg-white shadow-sm"
                                                style={{ borderRadius: '0.375rem' }}
                                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                        <span className={`relative z-10 ${difficulty === d ? 'font-semibold' : ''}`}>{d}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Number of Questions: <span className="font-bold text-faculty-primary">{numQuestions}</span></label>
                            <input type="range" min="1" max="10" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-faculty-primary" />
                        </div>
                        <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full flex items-center justify-center gap-2 bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2.5 px-5 rounded-lg disabled:bg-slate-300">
                            {isLoading ? <SpinnerIcon /> : <SparklesIcon />}
                            {isLoading ? 'Generating...' : 'Generate Quiz'}
                        </motion.button>
                    </div>
                </form>

                <div className="lg:col-span-8">
                    <div className="bg-white p-6 rounded-xl border border-border min-h-[60vh]">
                        {isLoading ? (
                             <div className="flex flex-col items-center justify-center h-full text-center">
                                <SpinnerIcon className="w-12 h-12 text-faculty-primary mb-4" />
                                <h3 className="text-lg font-bold text-heading">Generating your quiz...</h3>
                                <p className="text-content mt-1">This might take a moment.</p>
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-500">{error}</div>
                        ) : generatedQuiz ? (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-heading">Generated Quiz</h2>
                                    <motion.button onClick={handleCopyToClipboard} whileHover={{scale: 1.05}} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-sm">
                                        {copySuccess ? <CheckIcon /> : <ClipboardIcon />}
                                        {copySuccess ? 'Copied!' : 'Export JSON'}
                                    </motion.button>
                                </div>
                                <div className="space-y-6">
                                    {generatedQuiz.map((q, index) => (
                                        <div key={index} className="p-4 border border-border rounded-lg">
                                            <p className="font-semibold text-heading mb-3">{index + 1}. {q.questionText}</p>
                                            <div className="space-y-2">
                                                {q.answerOptions.map((opt, optIndex) => (
                                                    <div key={optIndex} className={`flex items-start gap-3 p-3 rounded-md text-sm ${opt.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                                                        {opt.isCorrect ? <CheckCircleIcon className="w-5 h-5 text-green-600 mt-px flex-shrink-0" /> : <div className="w-5 h-5 flex-shrink-0"></div>}
                                                        <span className={`flex-1 ${opt.isCorrect ? 'font-semibold text-green-800' : 'text-slate-700'}`}>{opt.answerText}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <BeakerIcon className="w-16 h-16 text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-heading">Your generated quiz will appear here</h3>
                                <p className="text-content mt-1">Fill out the form to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default QuizBuilder;