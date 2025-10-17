import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Course, CourseSection, CourseContentItem, QuizQuestion, CourseResource } from '../../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon, DragHandleIcon, XIcon, PlayIcon, QuizIcon, AssignmentIcon, ClipboardIcon } from '../../components/icons';
import { useAuth } from '../../src/hooks/useAuth';
import courseService from '../../src/services/course.service';
import { handleError } from '../../src/utils/errorHandler';
import { uploadLectureVideo, validateFileSize, validateFileType, FileValidationError } from '../../src/utils/uploadHelpers';
import { MAX_FILE_SIZES, ALLOWED_FILE_TYPES } from '../../src/config/api.config';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
    </div>
);
const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hideScrollbar?: boolean }> = ({ label, hideScrollbar, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <textarea {...props} className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-faculty-primary focus:outline-none min-h-[100px] ${hideScrollbar ? 'scrollbar-hide' : ''}`} />
    </div>
);

const JsonPasteModal: React.FC<{
    onClose: () => void;
    onSave: (questions: QuizQuestion[]) => void;
}> = ({ onClose, onSave }) => {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState('');

    const handleImport = () => {
        setError('');
        if (!jsonText.trim()) {
            setError('Textarea cannot be empty.');
            return;
        }

        try {
            const importedQuestions: QuizQuestion[] = JSON.parse(jsonText);
            
            if (!Array.isArray(importedQuestions) || !importedQuestions.every(q => 
                q.questionText && 
                Array.isArray(q.answerOptions) &&
                q.answerOptions.length > 0 &&
                q.answerOptions.some(opt => opt.isCorrect)
            )) {
                throw new Error("Invalid JSON format. Make sure it's an array of questions, each with questionText and answerOptions (with at least one correct answer).");
            }
            
            onSave(importedQuestions);
            onClose();

        } catch (err: any) {
            setError(`Failed to parse JSON: ${err.message}`);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-heading">Import Questions from JSON</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon /></button>
                </div>
                <p className="text-sm text-content mb-4">Paste your JSON array of questions into the text area below. The questions will be appended to the current list.</p>
                <TextareaField
                    label=""
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    rows={12}
                    placeholder='[{"questionText": "...", "answerOptions": [{"answerText": "...", "isCorrect": true}]}]'
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg">Cancel</button>
                    <button onClick={handleImport} className="bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg">Append Questions</button>
                </div>
            </motion.div>
        </motion.div>
    );
};


type EditableCourseContentItem = CourseContentItem & { id: string };
type EditableCourseSection = Omit<CourseSection, 'items'> & { id: string; items: EditableCourseContentItem[] };
type EditableCourse = Omit<Course, 'content'> & {
  content: EditableCourseSection[];
};

const SectionResourcesEditor: React.FC<{
    section: EditableCourseSection;
    onSectionChange: (updatedSection: EditableCourseSection) => void;
}> = ({ section, onSectionChange }) => {
    const [newResource, setNewResource] = useState({ name: '', url: '' });

    const addResource = () => {
        if (newResource.name.trim() && newResource.url.trim()) {
            const updatedSection = {
                ...section,
                resources: [...(section.resources || []), newResource]
            };
            onSectionChange(updatedSection);
            setNewResource({ name: '', url: '' });
        }
    };

    const deleteResource = (index: number) => {
        const updatedSection = {
            ...section,
            resources: (section.resources || []).filter((_, i) => i !== index)
        };
        onSectionChange(updatedSection);
    };

    return (
        <div className="space-y-3 pt-3 mt-3 border-t border-slate-200">
            <h4 className="font-semibold text-heading">Section Resources</h4>
            {(section.resources || []).length > 0 && (
                <div className="space-y-2">
                    {section.resources.map((res, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md border">
                            <span className="text-sm font-medium">{res.name}</span>
                            <button onClick={() => deleteResource(index)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex items-end gap-2 p-3 bg-white rounded-lg border">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Resource Name</label>
                    <input type="text" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-faculty-primary focus:outline-none"/>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Resource URL</label>
                    <input type="text" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-faculty-primary focus:outline-none"/>
                </div>
                <button type="button" onClick={addResource} className="p-2 bg-faculty-primary text-white rounded-md h-9 flex-shrink-0 hover:bg-faculty-primary-dark">
                    <PlusIcon />
                </button>
            </div>
        </div>
    );
};

const CourseEditor: React.FC = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!courseId;
    const [courseData, setCourseData] = useState<EditableCourse | null>(null);
    const [initialCourseData, setInitialCourseData] = useState<EditableCourse | null>(null);
    const [activeTab, setActiveTab] = useState('details');
    const [editingItem, setEditingItem] = useState<{ sIndex: number, iIndex: number } | null>(null);
    const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'section' | 'item', sIndex: number, iIndex?: number, title: string } | null>(null);
    const [isUnsavedChangesModalOpen, setIsUnsavedChangesModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasChanges = useMemo(() => {
        if (!courseData || !initialCourseData) return false;
        return JSON.stringify(courseData) !== JSON.stringify(initialCourseData);
    }, [courseData, initialCourseData]);

    // Fetch course data from backend if editing
    useEffect(() => {
        const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
        
        const fetchCourseData = async () => {
            if (isEditMode && courseId) {
                try {
                    const fetchedCourse = await courseService.getCourseById(courseId);
                    const contentWithIds: EditableCourseSection[] = ((fetchedCourse as any).content || []).map(section => ({
                        ...section,
                        id: uid(),
                        items: section.items.map(item => ({
                            ...item,
                            id: uid(),
                        })),
                        resources: section.resources || [] // Explicitly preserve resources when adding IDs
                    }));
                    const editableCourse = { 
                        ...fetchedCourse, 
                        id: (fetchedCourse as any)._id, // Keep as string (MongoDB ObjectId)
                        _id: (fetchedCourse as any)._id, // Store original _id
                        content: contentWithIds,
                        finalQuiz: (fetchedCourse as any).finalQuiz || { title: 'Final Quiz', isEnabled: false, questions: [], timeLimit: 60 },
                    } as any;
                    setCourseData(editableCourse);
                    setInitialCourseData(JSON.parse(JSON.stringify(editableCourse)));
                } catch (err) {
                    console.error('Error fetching course:', err);
                    navigate('/faculty/courses');
                }
            } else {
                // New course template
                const newCourseTemplate = {
                    id: Date.now(),
                    title: '',
                    subtitle: '',
                    description: '',
                    branch: 'Computer Science' as const,
                    category: '',
                    imageUrl: '',
                    authorId: user?._id || '',
                    content: [],
                    isEnrolled: false,
                    bestseller: false,
                    duration: '0h',
                    totalLength: '0h',
                    progress: 0,
                    students: 0,
                    lessons: 0,
                    rating: 0,
                    reviews: 0,
                    updated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    learnings: [],
                    previewUrl: '',
                    requirements: [],
                    includes: [],
                    finalQuiz: { title: 'Final Quiz', isEnabled: false, questions: [], timeLimit: 60 },
                };
                setCourseData(newCourseTemplate);
                setInitialCourseData(JSON.parse(JSON.stringify(newCourseTemplate)));
            }
        };

        fetchCourseData();
    }, [courseId, isEditMode, navigate, user]);
    
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasChanges) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasChanges]);


    const updateItem = (sIndex: number, iIndex: number, updatedItem: EditableCourseContentItem) => {
        if (!courseData) return;
        const newContent = [...courseData.content];
        newContent[sIndex].items[iIndex] = updatedItem;
        setCourseData({ ...courseData, content: newContent });
    };

    const confirmSave = async () => {
        if (!courseData) return;
        
        setSaving(true);
        setError(null);

        const courseToSave: Course = {
            ...courseData,
            content: courseData.content.map(({ id, ...sectionWithoutId }) => ({
                ...sectionWithoutId,
                items: sectionWithoutId.items.map(({ id: itemId, ...itemWithoutId }) => itemWithoutId),
                resources: sectionWithoutId.resources || [] // Explicitly preserve resources
            }))
        };

        // Save to backend if user authenticated
        if (user && user.role === 'faculty') {
            try {
                const coursePayload: any = {
                    title: courseToSave.title,
                    subtitle: courseToSave.subtitle,
                    branch: courseToSave.branch,
                    description: courseToSave.description,
                    category: courseToSave.category,
                    difficulty: 'Intermediate',
                    duration: courseToSave.duration,
                    totalLength: courseToSave.totalLength,
                    imageUrl: courseToSave.imageUrl,
                    previewUrl: courseToSave.previewUrl,
                    learnings: courseToSave.learnings || [],
                    requirements: courseToSave.requirements || [],
                    includes: courseToSave.includes || [],
                    content: courseToSave.content || [],
                    finalQuiz: courseToSave.finalQuiz || { title: 'Final Quiz', isEnabled: false, questions: [], timeLimit: 60 }
                };

                if (isEditMode && (courseToSave as any)._id) {
                    await courseService.updateCourse((courseToSave as any)._id, coursePayload);
                } else {
                    const newCourse = await courseService.createCourse(coursePayload);
                    (courseToSave as any)._id = newCourse._id;
                }
            } catch (err) {
                console.error('Error saving course to backend:', err);
                setError(handleError(err));
            }
        }

        setInitialCourseData(JSON.parse(JSON.stringify(courseData)));
        setIsSaveConfirmOpen(false);
        setSaving(false);
    };    const requestSave = () => {
        setIsSaveConfirmOpen(true);
    };

    const handleBackNavigation = () => {
        if (hasChanges) {
            setIsUnsavedChangesModalOpen(true);
        } else {
            navigate('/faculty/courses');
        }
    };

    const requestDeleteSection = (sIndex: number) => {
        if (!courseData) return;
        setItemToDelete({
            type: 'section',
            sIndex,
            title: courseData.content[sIndex].sectionTitle
        });
    };
    
    const requestDeleteItem = (sIndex: number, iIndex: number) => {
        if (!courseData) return;
        setItemToDelete({
            type: 'item',
            sIndex,
            iIndex,
            title: courseData.content[sIndex].items[iIndex].title
        });
    };
    
    const handleConfirmDelete = () => {
        if (!itemToDelete || !courseData) return;
    
        if (itemToDelete.type === 'section') {
            const newContent = courseData.content.filter((_, i) => i !== itemToDelete.sIndex);
            setCourseData({ ...courseData, content: newContent });
        } else if (itemToDelete.type === 'item' && itemToDelete.iIndex !== undefined) {
            const newContent = [...courseData.content];
            newContent[itemToDelete.sIndex].items.splice(itemToDelete.iIndex, 1);
            setCourseData({ ...courseData, content: newContent });
        }
        setItemToDelete(null);
    };

    if (!courseData) return <div>Loading...</div>;
    
    const itemToEdit = editingItem ? courseData.content[editingItem.sIndex].items[editingItem.iIndex] : null;


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setCourseData({ ...courseData, [e.target.name]: e.target.value });
    };

    const handleListChange = (name: 'learnings' | 'requirements' | 'includes', value: string) => {
        setCourseData({ ...courseData, [name]: value.split('\n') });
    };

    const TABS = [{ id: 'details', label: 'Course Details' }, { id: 'curriculum', label: 'Curriculum' }, { id: 'assessments', label: 'Final Assessments' }];

    return (
        <>
            <AnimatePresence>
                {isSaveConfirmOpen && (
                     <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsSaveConfirmOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
                        >
                            <h2 className="text-xl font-bold text-heading text-center mb-2">Confirm Changes</h2>
                            <p className="text-center text-content mb-6">Are you sure you want to save the changes to this course?</p>
                            <div className="flex justify-center gap-4">
                                <motion.button
                                    onClick={confirmSave}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex-1 bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2.5 px-6 rounded-lg"
                                >
                                    Save
                                </motion.button>
                                <motion.button
                                    onClick={() => setIsSaveConfirmOpen(false)}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-6 rounded-lg"
                                >
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                 {itemToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        onClick={() => setItemToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
                        >
                            <h2 className="text-xl font-bold text-heading text-center mb-2">Confirm Deletion</h2>
                            <p className="text-center text-content mb-6">
                                Are you sure you want to delete the {itemToDelete.type} "<strong>{itemToDelete.title}</strong>"?
                                {itemToDelete.type === 'section' && ' This will also delete all content within this section.'}
                            </p>
                            <div className="flex justify-center gap-4">
                                <motion.button
                                    onClick={handleConfirmDelete}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-lg"
                                >
                                    Delete
                                </motion.button>
                                <motion.button
                                    onClick={() => setItemToDelete(null)}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-6 rounded-lg"
                                >
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {isUnsavedChangesModalOpen && (
                     <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsUnsavedChangesModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
                        >
                            <h2 className="text-xl font-bold text-heading text-center mb-2">Discard Changes?</h2>
                            <p className="text-center text-content mb-6">You have unsaved changes. Are you sure you want to leave without saving?</p>
                            <div className="flex justify-center gap-4">
                                <motion.button
                                    onClick={() => {
                                        setIsUnsavedChangesModalOpen(false);
                                        navigate('/faculty/courses');
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-lg"
                                >
                                    Discard
                                </motion.button>
                                <motion.button
                                    onClick={() => setIsUnsavedChangesModalOpen(false)}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-6 rounded-lg"
                                >
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <button onClick={handleBackNavigation} className="flex items-center gap-2 font-semibold text-content hover:text-heading mb-6">
                    <ArrowLeftIcon /> Back to My Courses
                </button>
                <h1 className="text-4xl font-bold text-heading mb-2">{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
                <p className="text-lg text-content mb-8">{isEditMode ? courseData.title : 'Fill in the details to create your course.'}</p>

                <div className="bg-white p-6 rounded-xl border border-border">
                    <div className="border-b border-border mb-6">
                        <nav className="-mb-px flex space-x-8">
                            {TABS.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-faculty-primary text-faculty-primary' : 'border-transparent text-content hover:text-heading hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <AnimatePresence mode="wait">
                       <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {activeTab === 'details' && <DetailsEditor courseData={courseData} onInputChange={handleInputChange} onListChange={handleListChange} />}
                            {activeTab === 'curriculum' && <CurriculumEditor courseData={courseData} setCourseData={setCourseData} setEditingItem={setEditingItem} requestDeleteSection={requestDeleteSection} requestDeleteItem={requestDeleteItem} />}
                            {activeTab === 'assessments' && <FinalAssessmentsEditor courseData={courseData} setCourseData={setCourseData} />}
                       </motion.div>
                    </AnimatePresence>
                </div>

                 <div className="mt-8 flex justify-end">
                    <motion.button onClick={requestSave} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2.5 px-6 rounded-lg">
                        {isEditMode ? 'Save Changes' : 'Create Course'}
                    </motion.button>
                </div>
            </motion.div>
            <AnimatePresence>
                 {itemToEdit && itemToEdit.type === 'quiz' ? (
                     <SectionQuizEditorModal 
                        item={itemToEdit} 
                        onSave={(updatedItem) => {
                             updateItem(editingItem!.sIndex, editingItem!.iIndex, updatedItem);
                             setEditingItem(null);
                        }} 
                        onClose={() => setEditingItem(null)} 
                     />
                ) : itemToEdit ? (
                     <ItemEditorModal 
                        item={itemToEdit} 
                        onSave={(updatedItem) => {
                             updateItem(editingItem!.sIndex, editingItem!.iIndex, updatedItem);
                             setEditingItem(null);
                        }} 
                        onClose={() => setEditingItem(null)} 
                     />
                ) : null}
            </AnimatePresence>
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
};

const DetailsEditor = ({ courseData, onInputChange, onListChange }: { courseData: EditableCourse, onInputChange: any, onListChange: any }) => {
    const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
    const [previewSource, setPreviewSource] = useState<'url' | 'upload'>('url');
    
    useEffect(() => {
        if (courseData.imageUrl && courseData.imageUrl.startsWith('data:image')) {
        setImageSource('upload');
        } else {
        setImageSource('url');
        }
        if (courseData.previewUrl && courseData.previewUrl.startsWith('data:image')) {
        setPreviewSource('upload');
        } else {
        setPreviewSource('url');
        }
    }, [courseData.imageUrl, courseData.previewUrl]);

    const handleFileChange = (fieldName: 'imageUrl' | 'previewUrl') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('File is too large. Please select an image under 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const syntheticEvent = {
            target: {
                name: fieldName,
                value: reader.result as string,
            }
            } as React.ChangeEvent<HTMLInputElement>;
            onInputChange(syntheticEvent);
        };
        reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Course Title" name="title" value={courseData.title} onChange={onInputChange} />
                <InputField label="Course Subtitle" name="subtitle" value={courseData.subtitle} onChange={onInputChange} />
                <InputField label="Category" name="category" value={courseData.category} onChange={onInputChange} />
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Branch</label>
                    <select name="branch" value={courseData.branch} onChange={onInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none">
                        <option>Computer Science</option><option>Electrical</option><option>Mechanical</option><option>Civil</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Course Image</label>
                    <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="imageSource" value="url" checked={imageSource === 'url'} onChange={() => setImageSource('url')} className="h-4 w-4 text-faculty-primary focus:ring-faculty-primary" />
                        <span className="text-sm font-medium text-slate-700">From URL</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="imageSource" value="upload" checked={imageSource === 'upload'} onChange={() => setImageSource('upload')} className="h-4 w-4 text-faculty-primary focus:ring-faculty-primary" />
                        <span className="text-sm font-medium text-slate-700">Upload File</span>
                        </label>
                    </div>
                    {imageSource === 'url' ? (
                        <input type="text" name="imageUrl" value={courseData.imageUrl.startsWith('data:image') ? '' : courseData.imageUrl} onChange={onInputChange} placeholder="https://images.unsplash.com/..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
                    ) : (
                        <div>
                        <input type="file" accept="image/*" onChange={handleFileChange('imageUrl')} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-faculty-primary/10 file:text-faculty-primary hover:file:bg-faculty-primary/20" />
                        <p className="text-xs text-slate-500 mt-1">Max file size: 2MB.</p>
                        </div>
                    )}
                    {courseData.imageUrl && <img src={courseData.imageUrl} alt="Course Preview" className="mt-2 rounded-lg w-full h-24 object-cover border border-slate-200" />}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Preview Image</label>
                    <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="previewSource" value="url" checked={previewSource === 'url'} onChange={() => setPreviewSource('url')} className="h-4 w-4 text-faculty-primary focus:ring-faculty-primary" />
                        <span className="text-sm font-medium text-slate-700">From URL</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="previewSource" value="upload" checked={previewSource === 'upload'} onChange={() => setPreviewSource('upload')} className="h-4 w-4 text-faculty-primary focus:ring-faculty-primary" />
                        <span className="text-sm font-medium text-slate-700">Upload File</span>
                        </label>
                    </div>
                    {previewSource === 'url' ? (
                        <input type="text" name="previewUrl" value={courseData.previewUrl.startsWith('data:image') ? '' : courseData.previewUrl} onChange={onInputChange} placeholder="https://images.unsplash.com/..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
                    ) : (
                        <div>
                        <input type="file" accept="image/*" onChange={handleFileChange('previewUrl')} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-faculty-primary/10 file:text-faculty-primary hover:file:bg-faculty-primary/20" />
                        <p className="text-xs text-slate-500 mt-1">Max file size: 2MB.</p>
                        </div>
                    )}
                    {courseData.previewUrl && <img src={courseData.previewUrl} alt="Preview" className="mt-2 rounded-lg w-full h-24 object-cover border border-slate-200" />}
                </div>
            </div>
            <TextareaField label="Description" name="description" value={courseData.description} onChange={onInputChange} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TextareaField label="What you'll learn" name="learnings" value={courseData.learnings.join('\n')} onChange={(e) => onListChange('learnings', e.target.value)} hideScrollbar />
                <TextareaField label="Requirements" name="requirements" value={courseData.requirements.join('\n')} onChange={(e) => onListChange('requirements', e.target.value)} hideScrollbar />
                <TextareaField label="This course includes" name="includes" value={courseData.includes.join('\n')} onChange={(e) => onListChange('includes', e.target.value)} hideScrollbar />
            </div>
        </div>
    );
};

const CurriculumEditor = ({ courseData, setCourseData, setEditingItem, requestDeleteSection, requestDeleteItem }: { courseData: EditableCourse, setCourseData: (data: EditableCourse) => void, setEditingItem: (item: { sIndex: number, iIndex: number } | null) => void, requestDeleteSection: (sIndex: number) => void, requestDeleteItem: (sIndex: number, iIndex: number) => void }) => {
    
    const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;

    const updateCourse = (newContent: EditableCourseSection[]) => {
        setCourseData({ ...courseData, content: newContent });
    };

    const addSection = () => {
        const newSection: EditableCourseSection = { id: uid(), sectionTitle: 'New Section', items: [], resources: [] };
        updateCourse([...courseData.content, newSection]);
    };

    const updateSectionTitle = (sIndex: number, newTitle: string) => {
        const newContent = [...courseData.content];
        newContent[sIndex].sectionTitle = newTitle;
        updateCourse(newContent);
    };

    const addItemToSection = (sIndex: number, type: 'lecture' | 'quiz' | 'assignment') => {
        const newItem: EditableCourseContentItem = {
            id: uid(),
            type,
            title: `New ${type}`,
            duration: '5m',
            isGraded: false,
            questions: type === 'quiz' ? [{ questionText: 'What is...?', answerOptions: [{answerText: 'Correct Answer', isCorrect: true}, {answerText: 'Incorrect Answer', isCorrect: false}]}] : undefined,
        };
        const newContent = [...courseData.content];
        newContent[sIndex].items.push(newItem);
        updateCourse(newContent);
        setEditingItem({ sIndex, iIndex: newContent[sIndex].items.length - 1 });
    };
    
    return (
        <div className="space-y-4">
            <Reorder.Group axis="y" values={courseData.content} onReorder={updateCourse} className="space-y-4">
                {courseData.content.map((section, sIndex) => (
                    <Reorder.Item 
                        key={section.id} 
                        value={section}
                        className="bg-slate-50 border border-border rounded-lg"
                        whileDrag={{ scale: 1.02, zIndex: 10 }}
                    >
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <DragHandleIcon className="cursor-grab text-slate-400" />
                                <input value={section.sectionTitle} onChange={(e) => updateSectionTitle(sIndex, e.target.value)} className="font-bold text-lg text-heading bg-transparent flex-grow focus:outline-none focus:bg-white px-2 py-1 rounded-md" />
                                <button onClick={() => requestDeleteSection(sIndex)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                            <Reorder.Group axis="y" values={section.items} onReorder={(newItems: EditableCourseContentItem[]) => {
                                const newContent = [...courseData.content];
                                newContent[sIndex].items = newItems;
                                updateCourse(newContent);
                            }} className="space-y-2">
                                {section.items.map((item, iIndex) => (
                                    <Reorder.Item 
                                        key={item.id} 
                                        value={item}
                                        className="bg-white border border-border rounded-md"
                                        whileDrag={{ scale: 1.03, zIndex: 10 }}
                                    >
                                       <div className="p-2 flex items-center gap-2">
                                           <DragHandleIcon className="cursor-grab text-slate-400" />
                                           {item.type === 'lecture' && <PlayIcon className="text-content" />}
                                           {item.type === 'quiz' && <QuizIcon className="text-content" />}
                                           {item.type === 'assignment' && <AssignmentIcon className="text-content" />}
                                           <span className="font-medium flex-grow">{item.title}</span>
                                           <button onClick={() => setEditingItem({ sIndex, iIndex })} className="text-sm font-semibold text-faculty-primary">Edit</button>
                                           <button onClick={() => requestDeleteItem(sIndex, iIndex)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                                       </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                             <div className="mt-4 flex items-center gap-2">
                                <button onClick={() => addItemToSection(sIndex, 'lecture')} className="text-sm font-semibold text-faculty-primary flex items-center gap-1 hover:underline"><PlusIcon className="w-4 h-4" /> Lecture</button>
                                <button onClick={() => addItemToSection(sIndex, 'quiz')} className="text-sm font-semibold text-faculty-primary flex items-center gap-1 hover:underline"><PlusIcon className="w-4 h-4" /> Quiz</button>
                                <button onClick={() => addItemToSection(sIndex, 'assignment')} className="text-sm font-semibold text-faculty-primary flex items-center gap-1 hover:underline"><PlusIcon className="w-4 h-4" /> Assignment</button>
                            </div>
                             <SectionResourcesEditor
                                section={section}
                                onSectionChange={(updatedSection) => {
                                    const newContent = [...courseData.content];
                                    newContent[sIndex] = updatedSection;
                                    updateCourse(newContent);
                                }}
                            />
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>
            <button onClick={addSection} className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors">
                <PlusIcon className="w-4 h-4"/> Add Section
            </button>
        </div>
    );
};

const FinalAssessmentsEditor: React.FC<{ courseData: EditableCourse, setCourseData: (data: EditableCourse) => void }> = ({ courseData, setCourseData }) => {
    const [isQuizModalOpen, setQuizModalOpen] = useState(false);

    const handleFinalQuizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumeric = name === 'timeLimit';
        const processedValue = isNumeric
            ? (value === '' ? undefined : parseInt(value, 10))
            : value;
    
        setCourseData({
            ...courseData,
            finalQuiz: {
                ...courseData.finalQuiz!,
                [name]: processedValue,
            },
        });
    };

    const toggleFinalQuizEnabled = () => {
        setCourseData({
            ...courseData,
            finalQuiz: { ...courseData.finalQuiz!, isEnabled: !courseData.finalQuiz?.isEnabled }
        });
    };

    return (
        <>
            <div className="space-y-8">
                {/* Final Quiz Section */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-heading">Final Quiz</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">{courseData.finalQuiz?.isEnabled ? 'Enabled' : 'Disabled'}</span>
                            <button onClick={toggleFinalQuizEnabled} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${courseData.finalQuiz?.isEnabled ? 'bg-faculty-primary' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${courseData.finalQuiz?.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                    {courseData.finalQuiz?.isEnabled && (
                        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="space-y-4">
                            <InputField label="Quiz Title" name="title" value={courseData.finalQuiz.title || ''} onChange={handleFinalQuizChange} />
                            <InputField label="Quiz Time Limit (minutes)" name="timeLimit" type="number" min="0" value={courseData.finalQuiz.timeLimit || ''} onChange={handleFinalQuizChange} />
                            <button type="button" onClick={() => setQuizModalOpen(true)} className="font-semibold text-faculty-primary hover:underline text-sm">
                                Edit Questions ({courseData.finalQuiz.questions.length})
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
            {isQuizModalOpen && courseData.finalQuiz && (
                <FinalQuizEditorModal
                    initialQuestions={courseData.finalQuiz.questions}
                    onClose={() => setQuizModalOpen(false)}
                    onSave={(questions) => {
                        setCourseData({
                            ...courseData,
                            finalQuiz: { ...courseData.finalQuiz!, questions }
                        });
                        setQuizModalOpen(false);
                    }}
                />
            )}
        </>
    );
};

const FinalQuizEditorModal: React.FC<{initialQuestions: QuizQuestion[], onClose: () => void, onSave: (questions: QuizQuestion[]) => void}> = ({ initialQuestions, onClose, onSave }) => {
    const [questions, setQuestions] = useState(initialQuestions);
    const [isJsonModalOpen, setJsonModalOpen] = useState(false);

    const handleJsonImport = (importedQuestions: QuizQuestion[]) => {
        setQuestions(prevQuestions => [...prevQuestions, ...importedQuestions]);
        alert(`${importedQuestions.length} questions imported successfully!`);
    };
    
    const handleQuestionChange = (qIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].questionText = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answerOptions[optIndex].answerText = value;
        setQuestions(newQuestions);
    };

    const handleCorrectChange = (qIndex: number, optIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answerOptions = newQuestions[qIndex].answerOptions.map((opt, i) => ({...opt, isCorrect: i === optIndex}));
        setQuestions(newQuestions);
    };
    
    const addQuestion = () => {
        setQuestions([...questions, { questionText: '', answerOptions: [{answerText: '', isCorrect: true}, {answerText: '', isCorrect: false}]}]);
    };
    
    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answerOptions.push({ answerText: '', isCorrect: false });
        setQuestions(newQuestions);
    };
    
    const deleteQuestion = (qIndex: number) => setQuestions(questions.filter((_, i) => i !== qIndex));
    
    const deleteOption = (qIndex: number, optIndex: number) => {
        const newQuestions = [...questions];
        const options = newQuestions[qIndex].answerOptions;
        if (options.length <= 2) return;
        options.splice(optIndex, 1);
        if (options.every(opt => !opt.isCorrect) && options.length > 0) {
            options[0].isCorrect = true;
        }
        setQuestions(newQuestions);
    };

    return (
        <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-heading">Final Quiz Editor</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon /></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4 scrollbar-hide">
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-slate-50 p-4 rounded-lg border space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-600 flex-1">Question {qIndex + 1}</label>
                                <button onClick={() => deleteQuestion(qIndex)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                            <textarea value={q.questionText} onChange={e => handleQuestionChange(qIndex, e.target.value)} rows={2} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
                            <div className="mt-2 space-y-2">
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Answer Options (select the correct one)</h4>
                                {q.answerOptions.map((opt, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-3">
                                        <input type="radio" name={`correct-answer-${qIndex}`} checked={opt.isCorrect} onChange={() => handleCorrectChange(qIndex, optIndex)} className="w-4 h-4 text-faculty-primary focus:ring-faculty-primary"/>
                                        <input value={opt.answerText} onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm" placeholder={`Option ${optIndex + 1}`} />
                                        {q.answerOptions.length > 2 && <button onClick={() => deleteOption(qIndex, optIndex)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"><TrashIcon className="w-4 h-4"/></button>}
                                    </div>
                                ))}
                                <button onClick={() => addOption(qIndex)} className="text-sm text-faculty-primary font-semibold mt-2 flex items-center gap-1 hover:underline"><PlusIcon className="w-3 h-3"/> Add Option</button>
                            </div>
                        </div>
                    ))}
                     <div className="flex gap-2">
                         <button onClick={() => setJsonModalOpen(true)} type="button" className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors">
                             <ClipboardIcon className="w-4 h-4"/> Import from JSON
                         </button>
                         <button onClick={addQuestion} className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors">
                            <PlusIcon className="w-4 h-4"/> Add Question
                         </button>
                     </div>
                </div>
                <div className="mt-6 flex justify-end gap-2 flex-shrink-0">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg">Cancel</button>
                    <button onClick={() => onSave(questions)} className="bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg">Save Questions</button>
                </div>
            </motion.div>
        </motion.div>
        {isJsonModalOpen && (
            <JsonPasteModal
                onClose={() => setJsonModalOpen(false)}
                onSave={handleJsonImport}
            />
        )}
        </>
    )
};

const SectionQuizEditorModal: React.FC<{item: EditableCourseContentItem, onClose: () => void, onSave: (item: EditableCourseContentItem) => void}> = ({ item, onClose, onSave }) => {
    const [editableItem, setEditableItem] = useState(item);
    const [isJsonModalOpen, setJsonModalOpen] = useState(false);

    const handleJsonImport = (importedQuestions: QuizQuestion[]) => {
        setEditableItem(prev => ({
            ...prev,
            questions: [...(prev.questions || []), ...importedQuestions],
        }));
        alert(`${importedQuestions.length} questions imported successfully!`);
    };

    const handleQuestionChange = (qIndex: number, value: string) => {
        const newQuestions = [...(editableItem.questions || [])];
        newQuestions[qIndex].questionText = value;
        setEditableItem(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
        const newQuestions = [...(editableItem.questions || [])];
        newQuestions[qIndex].answerOptions[optIndex].answerText = value;
        setEditableItem(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleCorrectChange = (qIndex: number, optIndex: number) => {
        const newQuestions = [...(editableItem.questions || [])];
        newQuestions[qIndex].answerOptions = newQuestions[qIndex].answerOptions.map((opt, i) => ({...opt, isCorrect: i === optIndex}));
        setEditableItem(prev => ({ ...prev, questions: newQuestions }));
    };
    
    const addQuestion = () => {
        const newQuestions = [...(editableItem.questions || []), { questionText: '', answerOptions: [{answerText: '', isCorrect: true}, {answerText: '', isCorrect: false}]}];
        setEditableItem(prev => ({ ...prev, questions: newQuestions }));
    };
    
    const addOption = (qIndex: number) => {
        const newQuestions = [...(editableItem.questions || [])];
        newQuestions[qIndex].answerOptions.push({ answerText: '', isCorrect: false });
        setEditableItem(prev => ({ ...prev, questions: newQuestions }));
    };
    
    const deleteQuestion = (qIndex: number) => {
        const newQuestions = (editableItem.questions || []).filter((_, i) => i !== qIndex);
        setEditableItem(prev => ({ ...prev, questions: newQuestions }));
    };
    
    const deleteOption = (qIndex: number, optIndex: number) => {
        const newQuestions = [...(editableItem.questions || [])];
        const options = newQuestions[qIndex].answerOptions;
        if (options.length <= 2) return;
        options.splice(optIndex, 1);
        if (options.every(opt => !opt.isCorrect) && options.length > 0) {
            options[0].isCorrect = true;
        }
        setEditableItem(prev => ({ ...prev, questions: newQuestions }));
    };

    return (
        <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-heading">Edit Section Quiz</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon /></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4 scrollbar-hide">
                    <InputField 
                        label="Quiz Title"
                        value={editableItem.title} 
                        onChange={e => setEditableItem({...editableItem, title: e.target.value})} 
                    />
                     <InputField 
                        label="Time Limit (minutes)"
                        type="number"
                        min="0"
                        value={editableItem.timeLimit ?? ''} 
                        onChange={e => setEditableItem({...editableItem, timeLimit: e.target.value === '' ? undefined : parseInt(e.target.value, 10)})} 
                    />
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id={`isGraded-quiz-${editableItem.id}`}
                            checked={!!editableItem.isGraded}
                            onChange={e => setEditableItem({ ...editableItem, isGraded: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-faculty-primary focus:ring-faculty-primary"
                        />
                        <label htmlFor={`isGraded-quiz-${editableItem.id}`} className="text-sm font-medium text-slate-700">This is a graded quiz</label>
                    </div>
                    {(editableItem.questions || []).map((q, qIndex) => (
                        <div key={qIndex} className="bg-slate-50 p-4 rounded-lg border space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-600 flex-1">Question {qIndex + 1}</label>
                                <button onClick={() => deleteQuestion(qIndex)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                            <textarea value={q.questionText} onChange={e => handleQuestionChange(qIndex, e.target.value)} rows={2} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
                            <div className="mt-2 space-y-2">
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Answer Options (select the correct one)</h4>
                                {q.answerOptions.map((opt, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-3">
                                        <input type="radio" name={`correct-answer-${editableItem.id}-${qIndex}`} checked={opt.isCorrect} onChange={() => handleCorrectChange(qIndex, optIndex)} className="w-4 h-4 text-faculty-primary focus:ring-faculty-primary"/>
                                        <input value={opt.answerText} onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm" placeholder={`Option ${optIndex + 1}`} />
                                        {q.answerOptions.length > 2 && <button onClick={() => deleteOption(qIndex, optIndex)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"><TrashIcon className="w-4 h-4"/></button>}
                                    </div>
                                ))}
                                <button onClick={() => addOption(qIndex)} className="text-sm text-faculty-primary font-semibold mt-2 flex items-center gap-1 hover:underline"><PlusIcon className="w-3 h-3"/> Add Option</button>
                            </div>
                        </div>
                    ))}
                     <div className="flex gap-2">
                         <button onClick={() => setJsonModalOpen(true)} type="button" className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors">
                             <ClipboardIcon className="w-4 h-4"/> Import from JSON
                         </button>
                         <button onClick={addQuestion} className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors">
                            <PlusIcon className="w-4 h-4"/> Add Question
                         </button>
                     </div>
                </div>
                <div className="mt-6 flex justify-end gap-2 flex-shrink-0">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg">Cancel</button>
                    <button onClick={() => onSave(editableItem)} className="bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg">Save Quiz</button>
                </div>
            </motion.div>
        </motion.div>
        {isJsonModalOpen && (
            <JsonPasteModal
                onClose={() => setJsonModalOpen(false)}
                onSave={handleJsonImport}
            />
        )}
        </>
    );
};


const ItemEditorModal: React.FC<{item: EditableCourseContentItem, onClose: () => void, onSave: (item: EditableCourseContentItem) => void}> = ({ item, onClose, onSave }) => {
    const [localItem, setLocalItem] = useState(item);
    const [videoSourceType, setVideoSourceType] = useState(item.videoType || 'none');
    const [youtubeInput, setYoutubeInput] = useState(item.videoType === 'youtube' ? item.videoUrl : '');
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return null;
        let videoId = null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
            }
        } catch (e) {
            const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = url.match(regex);
            if (match) videoId = match[1];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };
    
    const handleYoutubeUrlApply = () => {
        const embedUrl = getYouTubeEmbedUrl(youtubeInput);
        if (embedUrl) {
            setLocalItem(prev => ({ ...prev, videoUrl: embedUrl, videoType: 'youtube' }));
        } else {
            alert('Invalid YouTube URL provided.');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset states
        setUploadError(null);
        setUploadProgress(0);

        try {
            // Validate file using helper functions
            validateFileType(file, ALLOWED_FILE_TYPES.VIDEOS);
            validateFileSize(file, MAX_FILE_SIZES.LECTURE_VIDEO);

            setIsUploading(true);

            // Upload video using the helper function with progress tracking
            const result = await uploadLectureVideo(file, (progress) => {
                setUploadProgress(progress);
            });
            
            // Update local item with Cloudinary URL
            setLocalItem(prev => ({ 
                ...prev, 
                videoUrl: result.videoUrl, 
                videoType: result.videoType
            }));

            console.log('✅ Video uploaded successfully:', result.videoUrl);

        } catch (error: any) {
            console.error('❌ Video upload error:', error);
            
            // Handle validation errors with user-friendly messages
            if (error instanceof FileValidationError) {
                setUploadError(error.message);
            } else {
                setUploadError(error.message || 'Failed to upload video. Please try again.');
            }
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleRemoveVideo = () => {
        setLocalItem(prev => {
            const { videoUrl, videoType, ...rest } = prev;
            return rest as EditableCourseContentItem;
        });
        setVideoSourceType('none');
        setYoutubeInput('');
        setUploadProgress(0);
        setUploadError(null);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-heading">Edit {localItem.type}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon /></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4 scrollbar-hide">
                    <InputField label="Title" value={localItem.title} onChange={e => setLocalItem({...localItem, title: e.target.value})} />
                    <InputField label="Duration" value={localItem.duration} onChange={e => setLocalItem({...localItem, duration: e.target.value})} />
                    {(localItem.type === 'assignment' || localItem.type === 'lecture') && (
                         <TextareaField label="Description" value={localItem.description || ''} onChange={e => setLocalItem({...localItem, description: e.target.value})} />
                    )}
                    {localItem.type === 'assignment' && (
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id={`isGraded-assignment-${localItem.id}`}
                                checked={!!localItem.isGraded}
                                onChange={e => setLocalItem({ ...localItem, isGraded: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-faculty-primary focus:ring-faculty-primary"
                            />
                            <label htmlFor={`isGraded-assignment-${localItem.id}`} className="text-sm font-medium text-slate-700">This is a graded assignment</label>
                        </div>
                    )}
                    {localItem.type === 'lecture' && (
                        <div className="pt-2">
                            <h3 className="text-sm font-medium text-slate-600 mb-2">Lecture Video</h3>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                                <div className="flex gap-2">
                                    <label className="flex-1">
                                        <input type="radio" name="videoSource" value="none" checked={videoSourceType === 'none'} onChange={() => setVideoSourceType('none')} className="sr-only" />
                                        <div className={`p-2 rounded-md text-center text-sm font-medium cursor-pointer ${videoSourceType === 'none' ? 'bg-primary/20 text-primary ring-2 ring-primary' : 'bg-slate-200 text-slate-600'}`}>No Video</div>
                                    </label>
                                    <label className="flex-1">
                                        <input type="radio" name="videoSource" value="youtube" checked={videoSourceType === 'youtube'} onChange={() => setVideoSourceType('youtube')} className="sr-only" />
                                        <div className={`p-2 rounded-md text-center text-sm font-medium cursor-pointer ${videoSourceType === 'youtube' ? 'bg-primary/20 text-primary ring-2 ring-primary' : 'bg-slate-200 text-slate-600'}`}>YouTube URL</div>
                                    </label>
                                    <label className="flex-1">
                                        <input type="radio" name="videoSource" value="upload" checked={videoSourceType === 'upload'} onChange={() => setVideoSourceType('upload')} className="sr-only" />
                                        <div className={`p-2 rounded-md text-center text-sm font-medium cursor-pointer ${videoSourceType === 'upload' ? 'bg-primary/20 text-primary ring-2 ring-primary' : 'bg-slate-200 text-slate-600'}`}>Upload File</div>
                                    </label>
                                </div>
                                {videoSourceType === 'youtube' && (
                                    <div className="flex gap-2">
                                        <input type="url" value={youtubeInput} onChange={e => setYoutubeInput(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2 bg-white border-slate-300 rounded-md text-sm"/>
                                        <button type="button" onClick={handleYoutubeUrlApply} className="bg-slate-600 text-white px-3 rounded-md text-sm font-semibold">Apply</button>
                                    </div>
                                )}
                                {videoSourceType === 'upload' && (
                                    <div className="space-y-2">
                                        <input 
                                            type="file" 
                                            accept="video/*" 
                                            onChange={handleFileChange} 
                                            disabled={isUploading}
                                            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed" 
                                        />
                                        {isUploading && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-600">Uploading to Cloudinary...</span>
                                                    <span className="text-faculty-primary font-semibold">{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="bg-faculty-primary h-full transition-all duration-300 rounded-full"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {uploadError && (
                                            <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                                        )}
                                        <p className="text-xs text-slate-500">Maximum file size: 100MB. Supported formats: MP4, WebM, MOV</p>
                                    </div>
                                )}
                                {localItem.videoUrl && (
                                    <div className="relative pt-2">
                                        <p className="text-xs font-semibold text-slate-500 mb-1">Preview:</p>
                                        <div className="aspect-video bg-black rounded-md overflow-hidden">
                                            {localItem.videoType === 'youtube' ? (
                                                <iframe src={localItem.videoUrl} title="YouTube Preview" className="w-full h-full" />
                                            ) : (
                                                <>
                                                    {localItem.videoUrl.startsWith('blob:') ? (
                                                        <div className="flex items-center justify-center h-full">
                                                            <p className="text-white text-sm">Video ready for upload. Click Save to continue.</p>
                                                        </div>
                                                    ) : (
                                                        <video src={localItem.videoUrl} controls className="w-full h-full">
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <button type="button" onClick={handleRemoveVideo} className="absolute top-3 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/80"><XIcon className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end gap-2 flex-shrink-0">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg" disabled={isUploading}>Cancel</button>
                    <button 
                        onClick={() => onSave(localItem)} 
                        className="bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Save'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CourseEditor;