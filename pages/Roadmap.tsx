import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type } from '@google/genai';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import { jsPDF } from 'jspdf';
import RoadmapNode from '../components/RoadmapNode';
import { SparklesIcon, SpinnerIcon, ChevronDownIcon, RoadmapIcon, XIcon, DownloadIcon } from '../components/icons';
import RoadmapSkeleton from './RoadmapSkeleton';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

type Milestone = {
    milestoneTitle: string;
    keyTopics: string[];
    skills: string[];
    projectIdeas: string[];
    reasoning: string;
};

const nodeTypes = { roadmapNode: RoadmapNode };

const RoadmapFlowContent: React.FC<{ roadmap: Milestone[], onNewRoadmap: () => void, onDownloadPDF: () => void, onRefineMilestone: (index: number, prompt: string) => Promise<void>, refiningNodeIndex: number | null }> = ({ roadmap, onNewRoadmap, onDownloadPDF, onRefineMilestone, refiningNodeIndex }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
    const { fitView } = useReactFlow();
    const isInitialRender = useRef(true);

    const handleToggleNode = (nodeId: string) => {
        setExpandedNodeIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(nodeId)) {
                newIds.delete(nodeId);
            } else {
                newIds.add(nodeId);
            }
            return newIds;
        });
    };

    useEffect(() => {
        if (roadmap) {
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];
            
            roadmap.forEach((milestone, index) => {
                const nodeId = `milestone-${index + 1}`;
                newNodes.push({
                    id: nodeId,
                    type: 'roadmapNode',
                    position: { x: (index % 2) * 740, y: index * 300 },
                    data: { 
                        ...milestone, 
                        milestoneNumber: index + 1,
                        onToggle: () => handleToggleNode(nodeId),
                        onRefine: onRefineMilestone,
                        isRefining: refiningNodeIndex === index,
                    },
                });

                if (index > 0) {
                    newEdges.push({
                        id: `e${index}-${index + 1}`,
                        source: `milestone-${index}`,
                        target: `milestone-${index + 1}`,
                        type: 'smoothstep',
                        animated: true,
                        style: { strokeWidth: 2, stroke: '#6366f1' },
                    });
                }
            });

            setNodes(newNodes);
            setEdges(newEdges);
            if (isInitialRender.current && roadmap.length > 0) {
                setExpandedNodeIds(new Set(['milestone-1']));
                isInitialRender.current = false;
            }
        }
    }, [roadmap, setNodes, setEdges, refiningNodeIndex, onRefineMilestone]);
    
    useEffect(() => {
       setNodes((nds) => 
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    isExpanded: expandedNodeIds.has(node.id),
                }
            }))
       );
       // Delay fitView to allow nodes to re-render and get their new dimensions
       const timer = setTimeout(() => {
            fitView({ duration: 500, padding: 0.2 });
       }, 550);
       return () => clearTimeout(timer);

    }, [expandedNodeIds, setNodes, fitView]);

    return (
         <motion.div
            key="roadmap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-full"
        >
             <div className="absolute top-4 right-4 z-20 flex flex-col items-end lg:flex-row lg:items-center gap-2">
                <motion.button
                    onClick={onNewRoadmap}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-white shadow-lg rounded-full py-2 px-5 flex items-center gap-2 font-semibold text-heading"
                    aria-label="Generate new roadmap"
                >
                    <SparklesIcon className="w-5 h-5 text-primary" />
                    New Roadmap
                </motion.button>
                 <motion.button
                    onClick={onDownloadPDF}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-white shadow-lg rounded-full py-2 px-5 flex items-center gap-2 font-semibold text-heading"
                    aria-label="Download roadmap as PDF"
                >
                    <DownloadIcon className="w-5 h-5 text-primary" />
                    Download PDF
                </motion.button>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3, duration: 500 }}
                className="roadmap-flow"
            >
                <Background gap={24} color="#e2e8f0" />
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
            </ReactFlow>
        </motion.div>
    )
}

const RoadmapForm: React.FC<{ onGenerate: (formData: any) => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        branch: 'Computer Science',
        careerGoal: '',
        previousSkills: [] as string[],
        learningPace: 'Beginner',
        learningPreference: 'Balanced',
        weeklyCommitment: '5-10 hrs/week',
        otherInterests: '',
    });
    const [skillInput, setSkillInput] = useState('');

    const branches = ['Computer Science', 'Electrical', 'Mechanical', 'Civil'];
    const paces = ['Just starting out (Beginner)', 'Know the basics (Intermediate)', 'Comfortable with complex topics (Advanced)'];
    const preferences = ['Focus on Theory & Fundamentals', 'Learn by Building Projects', 'A Balanced Approach'];
    const commitments = ['Casual (1-5 hrs/week)', 'Steady (5-10 hrs/week)', 'Dedicated (10+ hrs/week)'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            if (!formData.previousSkills.includes(skillInput.trim())) {
                setFormData(prev => ({ ...prev, previousSkills: [...prev.previousSkills, skillInput.trim()] }));
            }
            setSkillInput('');
        }
    };
    
    const removeSkill = (skill: string) => {
        setFormData(prev => ({ ...prev, previousSkills: prev.previousSkills.filter(s => s !== skill) }));
    };

    const nextStep = () => setCurrentStep(s => s + 1);
    const prevStep = () => setCurrentStep(s => s - 1);

    return (
        <motion.div
            key="form-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
        >
             <div className="text-center mb-6">
                <RoadmapIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                <h1 className="text-3xl font-bold text-heading">Career Roadmap Guidance</h1>
                <p className="text-base text-content mt-2 max-w-2xl mx-auto">Tell us a bit about yourself for a truly personalized learning path.</p>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-4"
                >
                {currentStep === 1 && (
                    <>
                        <h2 className="font-bold text-lg text-heading text-center">Step 1: Your Goal</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Your Branch</label>
                                <div className="relative">
                                    <select name="branch" value={formData.branch} onChange={handleChange} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-3 pr-8 text-heading focus:ring-2 focus:ring-primary focus:outline-none">
                                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content pointer-events-none" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Your Career Goal</label>
                                <input name="careerGoal" value={formData.careerGoal} onChange={handleChange} type="text" placeholder="e.g., AI/ML Engineer, Robotics Developer" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" />
                            </div>
                        </div>
                    </>
                )}
                {currentStep === 2 && (
                     <>
                        <h2 className="font-bold text-lg text-heading text-center">Step 2: Your Background</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Previous Skills (optional)</label>
                             <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                {formData.previousSkills.map(skill => (
                                    <div key={skill} className="flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded">
                                        {skill}
                                        <button onClick={() => removeSkill(skill)}><XIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown} placeholder="e.g., Python, C++" className="flex-1 bg-transparent outline-none p-1" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">How would you rate your current skill level?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {paces.map(pace => (
                                <button key={pace} onClick={() => setFormData({...formData, learningPace: pace})} className={`p-3 rounded-lg border-2 text-sm text-center transition-colors ${formData.learningPace === pace ? 'bg-primary/10 border-primary font-semibold' : 'border-slate-200 hover:border-slate-300'}`}>{pace}</button>
                            ))}
                            </div>
                        </div>
                    </>
                )}
                {currentStep === 3 && (
                    <>
                        <h2 className="font-bold text-lg text-heading text-center">Step 3: Your Learning Style</h2>
                         <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">How do you prefer to learn?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {preferences.map(pref => (
                                <button key={pref} onClick={() => setFormData({...formData, learningPreference: pref})} className={`p-3 rounded-lg border-2 text-sm text-center transition-colors ${formData.learningPreference === pref ? 'bg-primary/10 border-primary font-semibold' : 'border-slate-200 hover:border-slate-300'}`}>{pref}</button>
                            ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">How much time can you commit per week?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {commitments.map(commit => (
                                <button key={commit} onClick={() => setFormData({...formData, weeklyCommitment: commit})} className={`p-3 rounded-lg border-2 text-sm text-center transition-colors ${formData.weeklyCommitment === commit ? 'bg-primary/10 border-primary font-semibold' : 'border-slate-200 hover:border-slate-300'}`}>{commit}</button>
                            ))}
                            </div>
                        </div>
                    </>
                )}
                {currentStep === 4 && (
                    <>
                        <h2 className="font-bold text-lg text-heading text-center">Step 4: Anything Else?</h2>
                        <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Are there any other domains or topics you're interested in?</label>
                           <textarea name="otherInterests" value={formData.otherInterests} onChange={handleChange} rows={4} placeholder="e.g., I'm also interested in data visualization and project management." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"></textarea>
                        </div>
                    </>
                )}
                </motion.div>
            </AnimatePresence>

             <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                <motion.button onClick={prevStep} disabled={currentStep === 1} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg disabled:opacity-50">Back</motion.button>
                {currentStep < 4 ? (
                    <motion.button onClick={nextStep} disabled={currentStep === 1 && !formData.careerGoal.trim()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg disabled:bg-slate-300">Next</motion.button>
                ) : (
                    <motion.button onClick={() => onGenerate(formData)} disabled={isLoading} whileHover={{ scale: isLoading ? 1 : 1.05 }} whileTap={{ scale: isLoading ? 1 : 0.95 }} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-5 rounded-lg text-base flex items-center justify-center gap-2 disabled:bg-slate-400">
                         {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon />}
                         <span>{isLoading ? 'Generating...' : 'Generate Roadmap'}</span>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};


const RoadmapFlow: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<Milestone[] | null>(null);
    const [roadmapTitle, setRoadmapTitle] = useState('');
    const [refiningNodeIndex, setRefiningNodeIndex] = useState<number | null>(null);
    const isFormVisible = !isLoading && !roadmap;

    const handleDownloadPDF = () => {
        if (!roadmap || !roadmapTitle) return;

        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let y = 20;

        const checkPageBreak = (spaceNeeded: number) => {
            if (y + spaceNeeded > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
        };

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(`Your Roadmap to: ${roadmapTitle}`, pageWidth / 2, y, { align: 'center' });
        y += 15;

        roadmap.forEach((milestone, index) => {
            checkPageBreak(50); // Estimate
            
            // Milestone Title
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#6366f1'); // Primary color
            doc.text(`Milestone ${index + 1}: ${milestone.milestoneTitle}`, margin, y);
            y += 8;
            doc.setTextColor(0); // Black

            // Reasoning
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100); // Gray
            const reasoningLines = doc.splitTextToSize(`Personalized for you: ${milestone.reasoning}`, pageWidth - (margin * 2));
            doc.text(reasoningLines, margin, y);
            y += reasoningLines.length * 4 + 6;
            doc.setTextColor(0);

            const renderSection = (title: string, items: string[]) => {
                checkPageBreak(10 + items.length * 5);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(title, margin, y);
                y += 6;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                items.forEach(item => {
                    const lines = doc.splitTextToSize(`• ${item}`, pageWidth - (margin * 2) - 5);
                    checkPageBreak(lines.length * 4 + 2);
                    doc.text(lines, margin + 5, y);
                    y += lines.length * 4 + 1;
                });
                y += 5;
            };

            if (milestone.keyTopics?.length > 0) renderSection('Key Topics', milestone.keyTopics);
            if (milestone.skills?.length > 0) renderSection('Skills to Acquire', milestone.skills);
            if (milestone.projectIdeas?.length > 0) renderSection('Project Ideas', milestone.projectIdeas);

            if (index < roadmap.length - 1) {
                y += 2;
                checkPageBreak(5);
                doc.setDrawColor(226, 232, 240); // border color
                doc.line(margin, y, pageWidth - margin, y);
                y += 8;
            }
        });

        doc.save(`Roadmap-${roadmapTitle.replace(/[\s/]/g, '-')}.pdf`);
    };

    const handleRefineMilestone = useCallback(async (milestoneIndex: number, userPrompt: string) => {
        if (!roadmap) return;
        setRefiningNodeIndex(milestoneIndex);
        setError(null);
    
        const originalMilestone = roadmap[milestoneIndex];
        const roadmapContext = roadmap.map((m, i) => `${i + 1}. ${m.milestoneTitle}`).join('\n');
    
        const prompt = `
            You are an expert career guidance counselor revising a personalized learning roadmap.
            The student wants to change one specific milestone.
            Overall roadmap context: ${roadmapContext}
            Original milestone (Milestone ${milestoneIndex + 1}) to refine:
            - Title: ${originalMilestone.milestoneTitle}
            - Key Topics: ${originalMilestone.keyTopics.join(', ')}
            - Skills: ${originalMilestone.skills.join(', ')}
            - Project Ideas: ${originalMilestone.projectIdeas.join(', ')}
            The student's instruction is: "${userPrompt}"
            Generate a new version of ONLY this milestone based on the instruction.
            The new "reasoning" must be a concise (max 15 words) explanation of why this refined milestone is a good next step based on their request.
            Output a single, valid JSON object with the exact structure: { milestoneTitle, keyTopics, skills, projectIdeas, reasoning }.`;
    
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            milestoneTitle: { type: Type.STRING },
                            keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            projectIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
                            reasoning: { type: Type.STRING },
                        },
                        required: ["milestoneTitle", "keyTopics", "skills", "projectIdeas", "reasoning"]
                    },
                },
            });
            const jsonStr = response.text.trim();
            const newMilestone = JSON.parse(jsonStr);
            setRoadmap(prev => prev ? prev.map((m, i) => i === milestoneIndex ? newMilestone : m) : null);
        } catch (e) {
            console.error(e);
            setError('Failed to refine milestone. Please try a different prompt.');
        } finally {
            setRefiningNodeIndex(null);
        }
    }, [roadmap]);


    const handleGenerate = async (formData: any) => {
        setIsLoading(true);
        setError(null);
        setRoadmap(null);
        setRoadmapTitle(formData.careerGoal);

        const prompt = `
            You are an expert career guidance counselor for university students.
            A student in "${formData.branch}" wants to become a "${formData.careerGoal}".
            Here is their profile:
            - Previous Skills: ${formData.previousSkills.length > 0 ? formData.previousSkills.join(', ') : 'None specified.'}
            - Current Skill Level: ${formData.learningPace}
            - Learning Preference: ${formData.learningPreference}
            - Weekly Commitment: ${formData.weeklyCommitment}
            - Other Interests: ${formData.otherInterests || 'None specified.'}

            Based on this detailed profile, generate a highly personalized career roadmap. The roadmap should be structured in 3 to 5 clear milestones, starting from fundamentals to advanced topics, tailored to their background and preferences. For each milestone, provide:
            1. A "milestoneTitle".
            2. An array of "keyTopics" to learn.
            3. An array of essential "skills" to acquire.
            4. An array of 2-3 "projectIdeas" that match their learning preference (e.g., more foundational projects for beginners, more complex ones for advanced users).
            5. A "reasoning" string (max 15 words) that concisely explains why this milestone is tailored to the student's specific profile inputs.

            Format the output as a single JSON object with a key "roadmap" which is an array of these milestone objects.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            roadmap: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        milestoneTitle: { type: Type.STRING },
                                        keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        projectIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        reasoning: { type: Type.STRING },
                                    },
                                    required: ["milestoneTitle", "keyTopics", "skills", "projectIdeas", "reasoning"]
                                }
                            }
                        },
                        required: ["roadmap"]
                    },
                },
            });
            
            const jsonStr = response.text.trim();
            const generatedData = JSON.parse(jsonStr);
            setRoadmap(generatedData.roadmap);
        } catch (e) {
            console.error(e);
            setError('Failed to generate roadmap. The model may be unable to provide guidance for this specific career path. Please try a different goal.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNewRoadmap = () => {
        setRoadmap(null);
        setError(null);
        setRoadmapTitle('');
    };

    return (
        <motion.div 
            initial="initial" 
            animate="in" 
            exit="out" 
            variants={pageVariants} 
            transition={pageTransition}
            className={`h-full w-full relative bg-light-bg ${isFormVisible ? 'flex items-center justify-center p-4' : '-m-6 lg:-m-10'}`}
        >
            <AnimatePresence mode="wait">
                {isLoading && <RoadmapSkeleton key="skeleton" />}
                {!isLoading && roadmap && (
                    <RoadmapFlowContent 
                        roadmap={roadmap} 
                        onNewRoadmap={handleNewRoadmap} 
                        onDownloadPDF={handleDownloadPDF} 
                        onRefineMilestone={handleRefineMilestone}
                        refiningNodeIndex={refiningNodeIndex}
                    />
                )}
                {!isLoading && !roadmap && (
                    <RoadmapForm onGenerate={handleGenerate} isLoading={isLoading} />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const Roadmap: React.FC = () => (
    <ReactFlowProvider>
        <RoadmapFlow />
    </ReactFlowProvider>
);

export default Roadmap;
