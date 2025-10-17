
import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
    <div>
        <p className="text-sm text-content">{title}</p>
        <p className="text-3xl font-bold text-heading">{value}</p>
    </div>
);

const ContributionGraph: React.FC<{ lastUpdateTime: Date }> = ({ lastUpdateTime }) => {
    const [tooltipData, setTooltipData] = useState<{ date: string; time: number } | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const graphRef = useRef<HTMLDivElement>(null);

    const { weeks, stats, monthLabels } = useMemo(() => {
        const activityData = JSON.parse(localStorage.getItem('userActivityData') || '{}');
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const year = new Date().getFullYear();
        const days = [];
        
        for (let i = 0; i < 366; i++) {
            const date = new Date(year, 0, i + 1);
            if (date.getFullYear() !== year) continue;

            const dateStringKey = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });

            days.push({
                date: date,
                time: activityData[dateStringKey] || 0,
            });
        }
        
        const startDay = days[0]?.date.getDay() || 0;
        const emptyStartCells = Array(startDay).fill(null);
        const allCells = [...emptyStartCells, ...days];

        const weeks = [];
        for (let i = 0; i < allCells.length; i += 7) {
            weeks.push(allCells.slice(i, i + 7));
        }

        const totalSeconds = Object.values(activityData).reduce((sum: number, time: unknown) => {
            const value = Number(time);
            return sum + (isFinite(value) ? value : 0);
        }, 0);
        const contributionDays = Object.keys(activityData).length;
        const totalHours = (Number(totalSeconds) / 3600).toFixed(2);
        const avgHours = contributionDays > 0 ? (Number(totalSeconds) / contributionDays / 3600).toFixed(2) : "0.00";

        const stats = {
            totalContributionDays: contributionDays,
            totalHours,
            avgHours,
        };
        
        return { weeks, stats, monthLabels };
    }, [lastUpdateTime]);
    
    const getColorForTime = (seconds: number) => {
        if (seconds <= 0) return 'bg-slate-200';
        if (seconds <= 1800) return 'bg-[#c6e48b]';
        if (seconds <= 3600) return 'bg-[#7bc96f]';
        if (seconds <= 7200) return 'bg-[#239a3b]';
        return 'bg-[#196127]';
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, cell: any) => {
        if (cell && cell.time > 0 && graphRef.current) {
            const graphRect = graphRef.current.getBoundingClientRect();
            const cellRect = e.currentTarget.getBoundingClientRect();

            setTooltipData({
                date: cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: cell.time,
            });
            setTooltipPos({ 
                x: cellRect.left - graphRect.left + cellRect.width / 2, 
                y: cellRect.top - graphRect.top 
            });
        }
    };

    const handleMouseLeave = () => {
        setTooltipData(null);
    };
    
    return (
        <motion.div 
            ref={graphRef}
            className="bg-white p-6 rounded-xl border border-border mt-10 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Contribution Days" value={`${stats.totalContributionDays}`} />
                <StatCard title="Total Hours Spent" value={`${stats.totalHours}`} />
                <StatCard title="Average Time" value={`${stats.avgHours} hrs/day`} />
            </div>

            {/* Graph and Legend */}
            <div className="overflow-x-auto pb-2" onMouseLeave={handleMouseLeave}>
                <div className="flex w-full gap-3">
                    {/* Day labels column */}
                    <div className="flex flex-col gap-1.5 text-xs text-content pt-5 shrink-0">
                        <div className="h-4"></div>
                        <div className="h-4 leading-tight">Mon</div>
                        <div className="h-4"></div>
                        <div className="h-4 leading-tight">Wed</div>
                        <div className="h-4"></div>
                        <div className="h-4 leading-tight">Fri</div>
                        <div className="h-4"></div>
                    </div>
                    
                    {/* Weeks columns */}
                    <div className="flex flex-grow justify-between pt-5">
                    {weeks.map((week, weekIndex) => {
                        const firstDayOfWeekWithDate = week.find(d => d);
                        // Show month label if it's the first week, or if the month changes from the previous week
                        const showMonth = firstDayOfWeekWithDate && (
                            weekIndex === 0 || 
                            (weeks[weekIndex-1].find(d => d) && weeks[weekIndex-1].find(d => d)!.date.getMonth() !== firstDayOfWeekWithDate.date.getMonth())
                        );

                        return (
                            <div key={weekIndex} className="relative flex flex-col gap-1.5">
                                {showMonth && (
                                    <div className="absolute -top-5 left-0 text-xs text-content whitespace-nowrap">
                                        {monthLabels[firstDayOfWeekWithDate.date.getMonth()]}
                                    </div>
                                )}
                                {week.map((cell, dayIndex) => {
                                    if (!cell) return <div key={`empty-${weekIndex}-${dayIndex}`} className="w-4 h-4" />;
                                    return (
                                        <div
                                            key={cell.date.toISOString()}
                                            className={`w-4 h-4 rounded-sm ${getColorForTime(cell.time)}`}
                                            onMouseEnter={(e) => handleMouseEnter(e, cell)}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                    </div>
                </div>
            </div>
             {/* Legend */}
            <div className="flex justify-end items-center gap-2 mt-4 text-xs text-content">
                <span>Less</span>
                <div className="w-4 h-4 rounded-sm bg-[#c6e48b]"></div>
                <div className="w-4 h-4 rounded-sm bg-[#7bc96f]"></div>
                <div className="w-4 h-4 rounded-sm bg-[#239a3b]"></div>
                <div className="w-4 h-4 rounded-sm bg-[#196127]"></div>
                <span>More</span>
                <div className="w-4 h-4 rounded-sm bg-slate-200 ml-2"></div>
                <span>None</span>
            </div>
             {/* Tooltip */}
            <AnimatePresence>
                {tooltipData && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{ 
                            top: tooltipPos.y, 
                            left: tooltipPos.x,
                            transform: 'translate(-50%, -110%)' 
                        }}
                        className="absolute pointer-events-none z-50 bg-slate-800 text-white text-xs rounded py-1.5 px-2.5 shadow-lg whitespace-nowrap"
                    >
                         <strong>{(tooltipData.time / 3600).toFixed(2)} hours</strong> on {tooltipData.date}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ContributionGraph;
