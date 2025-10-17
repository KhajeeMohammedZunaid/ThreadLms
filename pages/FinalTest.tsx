import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppCourse } from '../App';
import { CheckCircleIcon, XIcon, ClockIcon, QuizIcon } from '../components/icons';
import QuizTimer from '../components/QuizTimer';
import { useAuth } from '../src/hooks/useAuth';
import courseService from '../src/services/course.service';
import userService from '../src/services/user.service';
import { handleError } from '../src/utils/errorHandler';

type QuestionStatus = 'answered' | 'notAnswered' | 'markedForReview' | 'answeredAndMarked' | 'notVisited';
const VALID_STATUSES: QuestionStatus[] = ['answered', 'notAnswered', 'markedForReview', 'answeredAndMarked', 'notVisited'];

const FinalTest: React.FC = () => {
  const { courseId } = useParams();
  const { user, refreshUser } = useAuth();
  const [course, setCourse] = useState<AppCourse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch course data to get final quiz
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId || !user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const fetchedCourse = await courseService.getCourseById(courseId);
        
        // Check if user is enrolled
        const enrollment = user.enrollments?.find((e: any) => {
          const enrollmentCourseId = typeof e.courseId === 'string' ? e.courseId : e.courseId?._id;
          return enrollmentCourseId === courseId;
        });
        
        // Map to AppCourse format with enrollment data
        const mappedCourse = {
          id: courseId, // Keep as string (MongoDB ObjectId)
          _id: fetchedCourse._id,
          finalQuiz: (fetchedCourse as any).finalQuiz || { isEnabled: false },
          enrollment: enrollment ? {
            courseId: enrollment.courseId,
            completedItems: enrollment.completedItems || [],
            enrollmentDate: enrollment.enrollmentDate,
            finalQuizScore: enrollment.finalQuizScore,
            inProgressQuizAnswers: enrollment.inProgressQuizAnswers
          } : undefined
        } as any;
        
        setCourse(mappedCourse);
      } catch (err) {
        console.error('❌ Error fetching course:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseId, user]);
  
  // Move all hooks BEFORE any conditional returns
  const questions = course?.finalQuiz?.questions || [];
  const title = course?.finalQuiz?.title || 'Final Quiz';
  const timeLimit = course?.finalQuiz?.timeLimit || 60;
  const itemId = 'finalQuiz';

  const initialData = useMemo(() => {
    const numQuestions = questions.length;
    const defaultAnswers = Array(numQuestions).fill(-1);
    const defaultStatuses: QuestionStatus[] = Array(numQuestions).fill('notVisited');
    if (numQuestions > 0) {
        defaultStatuses[0] = 'notAnswered';
    }

    const savedProgress = course?.enrollment?.inProgressQuizAnswers?.[itemId];

    if (savedProgress && Array.isArray(savedProgress.answers) && Array.isArray(savedProgress.statuses)) {
        let finalAnswers = [...savedProgress.answers];
        let finalStatuses = [...savedProgress.statuses as string[]].map(s => 
            VALID_STATUSES.includes(s as QuestionStatus) ? s as QuestionStatus : 'notVisited'
        );

        if (finalAnswers.length > numQuestions) {
            finalAnswers = finalAnswers.slice(0, numQuestions);
        } else if (finalAnswers.length < numQuestions) {
            finalAnswers = finalAnswers.concat(Array(numQuestions - finalAnswers.length).fill(-1));
        }
        
        if (finalStatuses.length > numQuestions) {
            finalStatuses = finalStatuses.slice(0, numQuestions);
        } else if (finalStatuses.length < numQuestions) {
            finalStatuses = finalStatuses.concat(Array(numQuestions - finalStatuses.length).fill('notVisited'));
        }

        const isPristine = finalStatuses.every(s => s === 'notVisited');
        if (isPristine && finalStatuses.length > 0) {
            finalStatuses[0] = 'notAnswered';
        }

        return {
            answers: finalAnswers,
            statuses: finalStatuses,
        };
    }

    return {
        answers: defaultAnswers,
        statuses: defaultStatuses,
    };
  }, [course?.enrollment, itemId, questions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(initialData.answers);
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>(initialData.statuses);
  const [showResults, setShowResults] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Handler functions for final quiz
  const handleFinalQuizCompletion = async (courseIdStr: string, score: number) => {
    if (!user) return;
    
    try {
      // Submit final quiz using the quiz submission endpoint
      await userService.submitQuizScore({
        courseId: courseIdStr,
        itemId: 'finalQuiz',
        score: score,
        answers: selectedAnswers
      });
      
      // Refresh user data to update enrollment with final quiz score
      await refreshUser();
    } catch (err) {
      console.error('❌ Error submitting final quiz:', err);
      handleError(err);
    }
  };

  const handleSaveQuizProgress = async (courseIdStr: string, itemIdStr: string, answers: number[], statuses: QuestionStatus[]) => {
    if (!user) return;
    
    try {
      // Save progress logic here if backend supports it
    } catch (err) {
      console.error('❌ Error saving final quiz progress:', err);
    }
  };

  useEffect(() => {
    const answersToSave = selectedAnswers;
    const statusesToSave = questionStatuses;
    return () => {
        if (!showResults && course) {
            handleSaveQuizProgress(course.id, itemId, answersToSave, statusesToSave);
        }
    };
  }, [selectedAnswers, questionStatuses, showResults, course, itemId]);
  
  const updateStatus = (index: number, newStatus: QuestionStatus) => {
    setQuestionStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = newStatus;
        return newStatuses;
    });
  };

  const navigateToQuestion = (index: number) => {
    const leavingIndex = currentQuestionIndex;
    if (questionStatuses[leavingIndex] === 'notVisited') {
        updateStatus(leavingIndex, 'notAnswered');
    }
    if (questionStatuses[index] === 'notVisited') {
        updateStatus(index, 'notAnswered');
    }
    setCurrentQuestionIndex(index);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);

    const currentStatus = questionStatuses[currentQuestionIndex];
    if (currentStatus === 'markedForReview' || currentStatus === 'answeredAndMarked') {
        updateStatus(currentQuestionIndex, 'answeredAndMarked');
    } else {
        updateStatus(currentQuestionIndex, 'answered');
    }
  };

  const handleClearResponse = () => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = -1;
    setSelectedAnswers(newSelectedAnswers);

    const currentStatus = questionStatuses[currentQuestionIndex];
    if (currentStatus === 'answeredAndMarked' || currentStatus === 'markedForReview') {
        updateStatus(currentQuestionIndex, 'markedForReview');
    } else {
        updateStatus(currentQuestionIndex, 'notAnswered');
    }
  };

  const handleMarkForReview = () => {
    const currentStatus = questionStatuses[currentQuestionIndex];
    if (currentStatus === 'answered') {
        updateStatus(currentQuestionIndex, 'answeredAndMarked');
    } else if (currentStatus === 'notAnswered' || currentStatus === 'notVisited') {
        updateStatus(currentQuestionIndex, 'markedForReview');
    } else if (currentStatus === 'markedForReview') {
        updateStatus(currentQuestionIndex, 'notAnswered');
    } else if (currentStatus === 'answeredAndMarked') {
        updateStatus(currentQuestionIndex, 'answered');
    }
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      const selectedAnswerIndex = selectedAnswers[index];
      if (selectedAnswerIndex !== -1 && question.answerOptions[selectedAnswerIndex]?.isCorrect) {
        return score + 1;
      }
      return score;
    }, 0);
  };
  
  const handleSubmit = () => {
    setIsConfirming(false);
    const correctAnswers = calculateScore();
    const finalScore = Math.round((correctAnswers / questions.length) * 10);
    handleFinalQuizCompletion(course.id, finalScore);
    handleSaveQuizProgress(course.id, itemId, Array(questions.length).fill(-1), []);
    setShowResults(true);
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    handleSubmit();
  };

  const score = useMemo(calculateScore, [showResults, questions, selectedAnswers]);
  const finalScoreOutOf10 = useMemo(() => Math.round((score / questions.length) * 10), [score, questions.length]);
  const unansweredQuestions = useMemo(() => selectedAnswers.filter(a => a === -1).length, [selectedAnswers]);

  // ALL CONDITIONAL RETURNS AT THE END AFTER ALL HOOKS
  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div>Loading final quiz...</div></div>;
  }

  // Check conditions AFTER all hooks
  if (!course || !course.finalQuiz?.isEnabled || !course.finalQuiz.questions || questions.length === 0) {
    return <Navigate to={`/courses/${courseId}`} replace />;
  }

  if (showResults) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-border">
        <h1 className="text-3xl font-bold text-heading mb-2">Quiz Results: {title}</h1>
        <p className="text-lg text-content mb-6">You scored <span className="font-bold text-primary">{finalScoreOutOf10}</span> out of <span className="font-bold text-heading">10</span> ({score} / {questions.length} correct)</p>
        
        {timeUp && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
            <h2 className="font-bold">Time's Up!</h2>
            <p>Your quiz was submitted automatically.</p>
          </div>
        )}

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="p-4 border border-border rounded-lg">
              <p className="font-semibold text-heading mb-3">{index + 1}. {question.questionText}</p>
              <div className="space-y-2">
                {question.answerOptions.map((option, optionIndex) => {
                    const isSelected = selectedAnswers[index] === optionIndex;
                    const isCorrect = option.isCorrect;
                    let styleClasses = 'bg-slate-100 border-slate-200 text-slate-800';
                    if (isSelected && !isCorrect) styleClasses = 'bg-red-100 border-red-300 text-red-800';
                    if (isCorrect) styleClasses = 'bg-green-100 border-green-300 text-green-800 font-semibold';

                  return (
                    <div key={optionIndex} className={`flex items-center gap-3 p-3 rounded-md border ${styleClasses}`}>
                        {isCorrect ? <CheckCircleIcon className="w-5 h-5 text-green-600"/> : isSelected ? <XIcon className="w-5 h-5 text-red-600"/> : <div className="w-5 h-5 flex-shrink-0"></div>}
                        <span className="flex-1">{option.answerText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Link to={`/courses/${courseId}`} className="inline-block mt-8 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Back to Course
        </Link>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const statusConfig = {
      answered: { color: 'bg-green-500', label: 'Answered' },
      notAnswered: { color: 'bg-red-500', label: 'Not Answered' },
      markedForReview: { color: 'bg-primary', label: 'Marked for Review' },
      answeredAndMarked: { color: 'bg-green-500', label: 'Answered & Marked' },
      notVisited: { color: 'bg-slate-200', label: 'Not Visited' },
  };

  return (
    <div className="max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-heading">{title}</h1>
            {timeLimit && timeLimit > 0 ? (
                <QuizTimer duration={timeLimit * 60} onTimeUp={handleTimeUp} />
            ) : (
                <div className="flex items-center gap-2 text-slate-500 font-medium mt-3 sm:mt-0">
                    <ClockIcon className="w-5 h-5"/> No time limit
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 lg:order-2 bg-white rounded-xl shadow-lg border border-border flex flex-col">
                <div className="p-6">
                    <p className="text-sm font-semibold text-primary">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <motion.div
                            className="bg-primary h-2 rounded-full"
                            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>
                </div>

                <div className="p-6 flex-grow">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className="text-xl font-bold text-heading mb-6">{currentQuestion.questionText}</h2>
                            <div className="space-y-3">
                            {currentQuestion.answerOptions.map((option, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => handleAnswerSelect(index)}
                                    className={`w-full text-left p-4 border rounded-lg transition-colors duration-200 flex items-center gap-4 ${selectedAnswers[currentQuestionIndex] === index ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}`}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selectedAnswers[currentQuestionIndex] === index ? 'border-primary bg-primary' : 'border-slate-300 bg-white'}`}>
                                        {selectedAnswers[currentQuestionIndex] === index && <div className="w-3 h-3 bg-white rounded-full"></div>}
                                    </div>
                                    <span className="text-slate-800 text-base">{option.answerText}</span>
                                </motion.button>
                            ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
                
                <div className="p-4 border-t border-border flex flex-wrap justify-between items-center gap-2">
                    <div className="flex gap-2">
                         <motion.button onClick={handleMarkForReview} whileHover={{ scale: 1.05 }} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg text-sm">
                            Mark for Review
                        </motion.button>
                        <motion.button onClick={handleClearResponse} whileHover={{ scale: 1.05 }} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg text-sm">
                            Clear Response
                        </motion.button>
                    </div>
                    <motion.button
                        onClick={handleSaveAndNext}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-colors disabled:bg-slate-300"
                        whileHover={{ scale: 1.05 }}
                    >
                        Save & Next
                    </motion.button>
                </div>
            </div>

            <div className="lg:col-span-1 lg:order-1">
                <div className="lg:sticky top-10 bg-white rounded-xl shadow-lg border border-border p-4">
                    <h3 className="font-bold text-heading mb-4">Question Palette</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((_, index) => {
                            const status = questionStatuses[index];
                            const isCurrent = index === currentQuestionIndex;
                            const statusStyle = statusConfig[status] || statusConfig.notVisited;
                            return (
                                <button key={index} onClick={() => navigateToQuestion(index)} className={`relative w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${statusStyle.color} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                    <span className="text-white">{index + 1}</span>
                                    {status === 'answeredAndMarked' && <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-primary ring-1 ring-white"></div>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-6 space-y-2 text-xs text-slate-600">
                        {Object.entries(statusConfig).map(([key, {color, label}]) => (
                            <div key={key} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${color} relative`}>
                                     {key === 'answeredAndMarked' && <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary ring-0.5 ring-white"></div>}
                                </div>
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                    <motion.button
                        onClick={() => setIsConfirming(true)}
                        className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                    >
                        Submit Quiz
                    </motion.button>
                </div>
            </div>
        </div>

        <AnimatePresence>
            {isConfirming && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsConfirming(false)}>
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }} onClick={(e) => e.stopPropagation()} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="text-center">
                            <QuizIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-heading mb-2">Confirm Submission</h2>
                            <p className="text-content mb-6">Are you sure you want to submit your answers? This action cannot be undone.</p>
                        </div>
                        <div className={`p-4 rounded-lg border mb-6 ${unansweredQuestions > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                            <h3 className="font-semibold text-heading mb-2">Summary</h3>
                            <div className="flex justify-between text-sm"><span>Total Questions:</span> <span className="font-bold">{questions.length}</span></div>
                            <div className="flex justify-between text-sm"><span>Answered:</span> <span className="font-bold">{questions.length - unansweredQuestions}</span></div>
                            {unansweredQuestions > 0 && <div className="flex justify-between text-sm text-orange-700"><span>Unanswered:</span> <span className="font-bold">{unansweredQuestions}</span></div>}
                        </div>
                        <div className="flex justify-center gap-4">
                            <motion.button onClick={() => setIsConfirming(false)} whileHover={{ scale: 1.05 }} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-6 rounded-lg">Cancel</motion.button>
                            <motion.button onClick={handleSubmit} whileHover={{ scale: 1.05 }} className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg">Submit</motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default FinalTest;