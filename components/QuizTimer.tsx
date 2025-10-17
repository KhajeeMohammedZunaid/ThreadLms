import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon } from './icons';

interface QuizTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
}

const QuizTimer: React.FC<QuizTimerProps> = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep the ref updated with the latest onTimeUp function
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);
  
  useEffect(() => {
    // Reset timer if duration changes, and set up the interval.
    setTimeLeft(duration);
    
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          onTimeUpRef.current();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts or duration changes.
    return () => clearInterval(timerId);
  }, [duration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const percentage = duration > 0 ? (timeLeft / duration) * 100 : 0;
  
  const timerStyle = useMemo(() => {
    const totalMinutes = duration / 60;
    const minutesLeft = timeLeft / 60;
    
    let redThreshold = 2; // Default 2 minutes
    if (totalMinutes <= 10) redThreshold = 1;
    if (totalMinutes <= 2) redThreshold = 0.5; // 30 seconds
    const yellowThreshold = totalMinutes / 2;

    if (minutesLeft <= redThreshold) return { text: 'text-red-500', bg: 'bg-red-500' };
    if (minutesLeft <= yellowThreshold) return { text: 'text-orange-500', bg: 'bg-orange-500' };
    return { text: 'text-slate-700', bg: 'bg-primary' };
  }, [timeLeft, duration]);

  return (
    <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-lg p-2">
        <ClockIcon className={`w-6 h-6 flex-shrink-0 ${timerStyle.text}`} />
        <div className="w-40">
            <div className="flex justify-between items-baseline mb-1">
                <span className={`font-bold text-lg tabular-nums ${timerStyle.text}`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-500 font-medium">Time Left</span>
            </div>
            <div className="w-full bg-slate-300 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                    className={`h-1.5 rounded-full ${timerStyle.bg}`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                />
            </div>
        </div>
    </div>
  );
};

export default QuizTimer;