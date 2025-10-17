import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { initialResumeData, sectionsConfig, ResumeData, Section, SectionType, Experience, Education, Project, Skill } from '../data/resume';
import { ChevronDownIcon, DownloadIcon, PlusIcon, TrashIcon, DragHandleIcon, EnvelopeIcon, PhoneIcon, LocationMarkerIcon, GlobeAltIcon, CheckIcon, SparklesIcon } from '../components/icons';
import { User } from '../types';


const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
} as const;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;

// A simple textarea that grows with content
const AutoGrowTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${e.target.scrollHeight}px`;
        }
        if (props.onChange) {
            props.onChange(e);
        }
    };

    return <textarea ref={ref} {...props} onChange={handleInput} />;
};

// Reusable input component
const InputField = ({ label, ...props }: {label: string} & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none" />
    </div>
);

// Reusable collapsible component for editor sections
const CollapsibleSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 font-semibold text-slate-700">
                <span>{title}</span>
                <ChevronDownIcon className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 border-t border-slate-200">{children}</div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    )
};

// Editor Components
const PersonalDetailsEditor = ({ data, setData }: {data: ResumeData['personalDetails'], setData: (field: keyof ResumeData['personalDetails'], value: string) => void}) => {
    const [imageSource, setImageSource] = useState<'url' | 'upload'>(
        data.profilePicture.startsWith('data:image') ? 'upload' : 'url'
    );

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('File is too large. Please select an image under 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setData('profilePicture', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
    <CollapsibleSection title="Personal Details">
        <div className="space-y-4">
            {/* Profile Picture Section */}
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                    <img src={data.profilePicture} alt="Profile Preview" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
                    <div className="flex-grow space-y-2">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="imageSource" value="url" checked={imageSource === 'url'} onChange={() => setImageSource('url')} className="h-4 w-4 text-primary focus:ring-primary" /><span className="text-sm">From URL</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="imageSource" value="upload" checked={imageSource === 'upload'} onChange={() => setImageSource('upload')} className="h-4 w-4 text-primary focus:ring-primary" /><span className="text-sm">Upload File</span></label>
                        </div>
                        {imageSource === 'url' ? (
                            <input type="text" value={data.profilePicture.startsWith('data:image') ? '' : data.profilePicture} onChange={e => setData('profilePicture', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none" />
                        ) : (
                            <div>
                                <input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                                <p className="text-xs text-slate-500 mt-1">Max file size: 2MB.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Other fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <InputField label="Full Name" value={data.fullName} onChange={e => setData('fullName', e.target.value)} />
                <InputField label="Job Title" value={data.jobTitle} onChange={e => setData('jobTitle', e.target.value)} />
                <InputField label="Email Address" type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
                <InputField label="Phone Number" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                <div className="sm:col-span-2"><InputField label="Address" value={data.address} onChange={e => setData('address', e.target.value)} /></div>
                <InputField label="LinkedIn Profile" value={data.linkedin} onChange={e => setData('linkedin', e.target.value)} />
                <InputField label="Website/Portfolio" value={data.website} onChange={e => setData('website', e.target.value)} />
            </div>
        </div>
    </CollapsibleSection>
)};

const SectionEditor = ({ title, items, onUpdate, onRemove, onAdd, children }: {title: string, items: any[], onUpdate: any, onRemove: any, onAdd: any, children: (item: any, index: number) => React.ReactNode}) => {
    const [openItems, setOpenItems] = useState<string[]>(items.map(i => i.id));
    const toggleItem = (id: string) => setOpenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-lg">
                    <div className="p-2 flex justify-between items-center border-b border-slate-200">
                        <button onClick={() => toggleItem(item.id)} className="flex-grow text-left font-medium text-slate-700 flex items-center gap-2">
                             <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${openItems.includes(item.id) ? 'rotate-180' : ''}`} />
                             <span>{(item.role && `${item.role} at ${item.company}`) || (item.degree && `${item.degree} at ${item.institution}`) || item.name || `Item ${index + 1}`}</span>
                        </button>
                         <button onClick={() => onRemove(item.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                     <AnimatePresence>
                        {openItems.includes(item.id) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                               <div className="p-4">{children(item, index)}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
            <button onClick={onAdd} className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors">
                <PlusIcon className="w-4 h-4"/> Add {title}
            </button>
        </div>
    )
};

type TemplateProps = { data: ResumeData, font: string, orderedSections: Section[], accentColor: string };

// Templates
const ModernTemplate = ({ data, font, orderedSections, accentColor }: TemplateProps) => (
    <div style={{ fontFamily: font }} className="text-[9pt] leading-snug text-gray-800">
        <div className="text-center pb-4 border-b-2 border-gray-300">
            <img src={data.personalDetails.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-slate-100" />
            <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ color: accentColor }}>{data.personalDetails.fullName}</h1>
            <h2 className="text-md font-semibold text-gray-600">{data.personalDetails.jobTitle}</h2>
            <div className="flex justify-center gap-x-4 gap-y-1 text-xs mt-2 flex-wrap">
                <span>{data.personalDetails.email}</span>
                <span>{data.personalDetails.phone}</span>
                <span>{data.personalDetails.address}</span>
                <a href={`https://${data.personalDetails.linkedin}`} style={{ color: accentColor }} className="hover:underline">{data.personalDetails.linkedin}</a>
                <a href={`https://${data.personalDetails.website}`} style={{ color: accentColor }} className="hover:underline">{data.personalDetails.website}</a>
            </div>
        </div>
        <div className="mt-4">
             {orderedSections.map(section => {
                 switch(section.id) {
                     case 'summary': return (
                        <div key={section.id} className="mb-4">
                             <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{section.title}</h3>
                             <p className="text-gray-700">{data.summary}</p>
                         </div>
                     );
                     case 'experience': return (
                        <div key={section.id} className="mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{section.title}</h3>
                            {data.experience.map(exp => (
                                <div key={exp.id} className="mb-3">
                                    <div className="flex justify-between items-baseline">
                                        <h4 className="font-bold text-md">{exp.role}</h4>
                                        <span className="text-xs font-medium text-gray-500">{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <h5 className="font-semibold text-gray-600 mb-1">{exp.company}</h5>
                                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                                        {exp.description.split('\n').map((line, i) => line && <li key={i}>{line.replace(/^- /, '')}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                     );
                      case 'education': return (
                        <div key={section.id} className="mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{section.title}</h3>
                            {data.education.map(edu => (
                                <div key={edu.id} className="mb-2">
                                     <div className="flex justify-between items-baseline">
                                        <h4 className="font-bold text-md">{edu.institution}</h4>
                                        <span className="text-xs font-medium text-gray-500">{edu.startDate} - {edu.endDate}</span>
                                    </div>
                                    <h5 className="font-semibold text-gray-600">{edu.degree} {edu.gpa && `• GPA: ${edu.gpa}`}</h5>
                                </div>
                            ))}
                        </div>
                     );
                     case 'projects': return (
                        <div key={section.id} className="mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{section.title}</h3>
                             {data.projects.map(proj => (
                                <div key={proj.id} className="mb-2">
                                     <h4 className="font-bold text-md">{proj.name} <a href={`https://${proj.link}`} style={{ color: accentColor }} className="hover:underline text-xs font-normal">({proj.link})</a></h4>
                                     <p className="text-gray-700">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                     );
                     case 'skills': return (
                        <div key={section.id} className="mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{section.title}</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map(skill => <span key={skill.id} className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded-md">{skill.name}</span>)}
                            </div>
                        </div>
                     );
                     default: return null;
                 }
             })}
        </div>
    </div>
);

const ClassicTemplate = ({ data, font, orderedSections, accentColor }: TemplateProps) => (
     <div style={{ fontFamily: font }} className="text-[10pt] leading-normal text-gray-900 flex">
        <div className="w-1/3 pr-6 border-r border-gray-200">
            <img src={data.personalDetails.profilePicture} alt="Profile" className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-slate-100" />
             <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-700 uppercase mb-2">Contact</h2>
                <div className="text-xs space-y-1">
                    <p>{data.personalDetails.phone}</p>
                    <p>{data.personalDetails.email}</p>
                    <p>{data.personalDetails.address}</p>
                    <a href={`https://${data.personalDetails.linkedin}`} style={{ color: accentColor }} className="hover:underline block">{data.personalDetails.linkedin}</a>
                    <a href={`https://${data.personalDetails.website}`} style={{ color: accentColor }} className="hover:underline block">{data.personalDetails.website}</a>
                </div>
            </div>
            {orderedSections.some(s => s.id === 'education') && (
                 <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-700 uppercase mb-2">Education</h2>
                    {data.education.map(edu => (
                         <div key={edu.id} className="mb-2 text-xs">
                             <h4 className="font-bold">{edu.degree}</h4>
                             <p>{edu.institution}</p>
                             <p className="text-gray-500">{edu.startDate} - {edu.endDate}</p>
                         </div>
                    ))}
                </div>
            )}
             {orderedSections.some(s => s.id === 'skills') && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-700 uppercase mb-2">Skills</h2>
                    <ul className="text-xs list-disc pl-4 space-y-1">
                        {data.skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
                    </ul>
                </div>
             )}
        </div>
        <div className="w-2/3 pl-6">
            <div className="mb-4">
                <h1 className="text-3xl font-bold" style={{ color: accentColor }}>{data.personalDetails.fullName}</h1>
                <h2 className="text-lg font-semibold text-gray-600">{data.personalDetails.jobTitle}</h2>
            </div>
            {orderedSections.map(section => {
                 switch(section.id) {
                     case 'summary': return (
                        <div key={section.id} className="mb-4">
                             <h3 className="text-lg font-bold text-gray-700 uppercase mb-1">{section.title}</h3>
                             <p className="text-sm">{data.summary}</p>
                         </div>
                     );
                     case 'experience': return (
                        <div key={section.id} className="mb-4">
                            <h3 className="text-lg font-bold text-gray-700 uppercase mb-1">{section.title}</h3>
                            {data.experience.map(exp => (
                                <div key={exp.id} className="mb-3 text-sm">
                                    <h4 className="font-bold">{exp.role} <span className="font-normal text-gray-600">| {exp.company}</span></h4>
                                    <p className="text-xs text-gray-500 mb-1">{exp.startDate} - {exp.endDate}</p>
                                    <ul className="list-disc pl-5 space-y-1 text-xs">
                                        {exp.description.split('\n').map((line, i) => line && <li key={i}>{line.replace(/^- /, '')}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                     );
                      case 'projects': return (
                        <div key={section.id} className="mb-4">
                            <h3 className="text-lg font-bold text-gray-700 uppercase mb-1">{section.title}</h3>
                             {data.projects.map(proj => (
                                <div key={proj.id} className="mb-2 text-sm">
                                     <h4 className="font-bold">{proj.name} <a href={`https://${proj.link}`} style={{ color: accentColor }} className="hover:underline text-xs font-normal">({proj.link})</a></h4>
                                     <p className="text-xs">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                     );
                     default: return null;
                 }
             })}
        </div>
     </div>
);

const CreativeTemplate = ({ data, font, orderedSections, accentColor }: TemplateProps) => (
    <div style={{ fontFamily: font }} className="text-[10pt] leading-normal text-gray-800">
        <div className="text-white p-6 rounded-t-lg -m-8 mb-4 flex items-center gap-6" style={{ backgroundColor: accentColor }}>
            <img src={data.personalDetails.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white/50 shadow-md" />
            <div>
                <h1 className="text-4xl font-bold tracking-tight">{data.personalDetails.fullName}</h1>
                <h2 className="text-lg font-light opacity-90 mt-1">{data.personalDetails.jobTitle}</h2>
            </div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-600 border-b pb-4 mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2"><span style={{ color: accentColor }}><LocationMarkerIcon className="w-4 h-4"/></span><span>{data.personalDetails.address}</span></div>
            <div className="flex items-center gap-2"><span style={{ color: accentColor }}><PhoneIcon className="w-4 h-4"/></span><span>{data.personalDetails.phone}</span></div>
            <div className="flex items-center gap-2"><span style={{ color: accentColor }}><EnvelopeIcon className="w-4 h-4"/></span><span>{data.personalDetails.email}</span></div>
            <a href={`https://${data.personalDetails.website}`} style={{ color: accentColor }} className="flex items-center gap-2 hover:underline"><GlobeAltIcon className="w-4 h-4"/><span>{data.personalDetails.website}</span></a>
        </div>
        <div>
            {orderedSections.map(section => {
                const Title = () => <h3 className="text-md font-bold uppercase tracking-widest mb-2 pb-1 border-b-2" style={{ color: accentColor, borderColor: `${accentColor}33` }}>{section.title}</h3>;
                switch(section.id) {
                     case 'summary': return <div key={section.id} className="mb-4"><Title/><p>{data.summary}</p></div>;
                     case 'experience': return <div key={section.id} className="mb-4"><Title/>{data.experience.map(exp => (
                        <div key={exp.id} className="mb-3">
                            <div className="flex justify-between items-baseline"><h4 className="font-bold text-md">{exp.company}</h4><span className="text-xs font-medium text-gray-500">{exp.startDate} - {exp.endDate}</span></div>
                            <h5 className="font-semibold text-gray-600 mb-1">{exp.role}</h5>
                            <ul className="list-disc list-outside pl-5 text-gray-700 space-y-1 text-sm">{exp.description.split('\n').map((line, i) => line && <li key={i}>{line.replace(/^- /, '')}</li>)}</ul>
                        </div>))}
                     </div>;
                     case 'education': return <div key={section.id} className="mb-4"><Title/>{data.education.map(edu => (
                        <div key={edu.id} className="mb-2">
                             <div className="flex justify-between items-baseline"><h4 className="font-bold text-md">{edu.degree}</h4><span className="text-xs font-medium text-gray-500">{edu.startDate} - {edu.endDate}</span></div>
                             <h5 className="font-semibold text-gray-600">{edu.institution}</h5>
                         </div>))}
                     </div>;
                     case 'projects': return <div key={section.id} className="mb-4"><Title/>{data.projects.map(proj => (
                        <div key={proj.id} className="mb-2">
                            <h4 className="font-bold text-md">{proj.name}</h4>
                            <p className="text-sm">{proj.description} <a href={`https://${proj.link}`} style={{ color: accentColor }} className="hover:underline text-xs">({proj.link})</a></p>
                        </div>))}
                     </div>;
                     case 'skills': return <div key={section.id} className="mb-4"><Title/><div className="flex flex-wrap gap-2">{data.skills.map(skill => <span key={skill.id} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}>{skill.name}</span>)}</div></div>;
                     default: return null;
                }
            })}
        </div>
    </div>
);

const CompactTemplate = ({ data, font, orderedSections, accentColor }: TemplateProps) => (
    <div style={{ fontFamily: font }} className="text-[9.5pt] leading-snug text-gray-800 flex">
        <div className="w-[35%] pr-5 border-r border-gray-200">
            <div className="text-center mb-4">
                <img src={data.personalDetails.profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover mx-auto mb-2 border-2 border-slate-100" />
                 <h1 className="text-xl font-bold" style={{ color: accentColor }}>{data.personalDetails.fullName}</h1>
                 <h2 className="text-sm font-semibold text-gray-600">{data.personalDetails.jobTitle}</h2>
            </div>
            <div className="mb-4">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2" style={{ color: accentColor }}>Contact</h3>
                <div className="text-xs space-y-1 text-gray-600">
                    <p>{data.personalDetails.phone}</p><p>{data.personalDetails.email}</p><p>{data.personalDetails.address}</p>
                    <a href={`https://${data.personalDetails.linkedin}`} style={{ color: accentColor }} className="hover:underline block break-words">{data.personalDetails.linkedin}</a>
                    <a href={`https://${data.personalDetails.website}`} style={{ color: accentColor }} className="hover:underline block break-words">{data.personalDetails.website}</a>
                </div>
            </div>
            {orderedSections.some(s => s.id === 'education') && <div className="mb-4">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2" style={{ color: accentColor }}>Education</h3>
                {data.education.map(edu => <div key={edu.id} className="mb-2 text-xs"><h4 className="font-bold">{edu.degree}</h4><p className="text-gray-600">{edu.institution}</p><p className="text-gray-500">{edu.startDate} - {edu.endDate}</p></div>)}
            </div>}
            {orderedSections.some(s => s.id === 'skills') && <div className="mb-4">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2" style={{ color: accentColor }}>Skills</h3>
                <div className="flex flex-wrap gap-1">{data.skills.map(skill => <span key={skill.id} className="bg-slate-200 text-slate-700 text-[8pt] font-medium px-2 py-1 rounded">{skill.name}</span>)}</div>
            </div>}
        </div>
        <div className="w-[65%] pl-5">
            {orderedSections.map(section => {
                 const Title = () => <h3 className="font-bold text-sm uppercase tracking-wider mb-2" style={{ color: accentColor }}>{section.title}</h3>;
                 switch(section.id) {
                     case 'summary': return <div key={section.id} className="mb-3"><Title/><p className="text-xs text-gray-700">{data.summary}</p></div>;
                     case 'experience': return <div key={section.id} className="mb-3"><Title/>{data.experience.map(exp => (
                        <div key={exp.id} className="mb-2">
                            <div className="flex justify-between items-baseline"><h4 className="font-bold">{exp.role}</h4><span className="text-[8pt] font-medium text-gray-500">{exp.startDate} - {exp.endDate}</span></div>
                            <h5 className="font-semibold text-gray-600 text-xs mb-1">{exp.company}</h5>
                            <ul className="list-disc pl-4 text-gray-700 space-y-0.5 text-[8.5pt]">{exp.description.split('\n').map((line, i) => line && <li key={i}>{line.replace(/^- /, '')}</li>)}</ul>
                        </div>))}
                     </div>;
                     case 'projects': return <div key={section.id} className="mb-3"><Title/>{data.projects.map(proj => (
                        <div key={proj.id} className="mb-2">
                            <h4 className="font-bold">{proj.name} <a href={`https://${proj.link}`} style={{ color: accentColor }} className="hover:underline text-xs font-normal">({proj.link})</a></h4>
                            <p className="text-xs text-gray-700">{proj.description}</p>
                        </div>))}
                     </div>;
                     default: return null;
                 }
             })}
        </div>
    </div>
);

const ChronologicalTemplate = ({ data, font, orderedSections, accentColor }: TemplateProps) => (
    <div style={{ fontFamily: font }} className="text-[10pt] leading-normal text-gray-900">
        <div className="text-center mb-6">
            <img src={data.personalDetails.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-slate-100" />
            <h1 className="text-3xl font-bold" style={{ color: accentColor }}>{data.personalDetails.fullName}</h1>
            <h2 className="text-lg font-semibold text-gray-600">{data.personalDetails.jobTitle}</h2>
            <div className="flex justify-center gap-x-4 gap-y-1 text-xs mt-2 text-gray-600 flex-wrap">
                <span>{data.personalDetails.phone}</span><span>&bull;</span><span>{data.personalDetails.email}</span><span>&bull;</span>
                <a href={`https://${data.personalDetails.linkedin}`} style={{ color: accentColor }} className="hover:underline">{data.personalDetails.linkedin}</a>
            </div>
        </div>
        <div>
            {orderedSections.map(section => {
                const Title = () => <h3 className="text-lg font-bold text-gray-700 mb-2">{section.title}</h3>;
                switch(section.id) {
                     case 'summary': return <div key={section.id} className="mb-4"><p className="text-center text-gray-700">{data.summary}</p></div>;
                     case 'experience': return <div key={section.id} className="mb-4"><Title/><div className="relative border-l-2 pl-6 space-y-4" style={{ borderColor: `${accentColor}4D` }}>
                        {data.experience.map(exp => (
                            <div key={exp.id} className="relative">
                                <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-4 border-white" style={{ backgroundColor: accentColor }}></div>
                                <p className="text-xs font-bold uppercase" style={{ color: accentColor }}>{exp.startDate} - {exp.endDate}</p>
                                <h4 className="font-bold text-md">{exp.role} at {exp.company}</h4>
                                <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">{exp.description.split('\n').map((line, i) => line && <li key={i}>{line.replace(/^- /, '')}</li>)}</ul>
                            </div>
                        ))}</div>
                     </div>;
                     case 'education': return <div key={section.id} className="mb-4"><Title/><div className="relative border-l-2 pl-6 space-y-4" style={{ borderColor: `${accentColor}4D` }}>
                        {data.education.map(edu => (
                            <div key={edu.id} className="relative">
                                <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-4 border-white" style={{ backgroundColor: accentColor }}></div>
                                <p className="text-xs font-bold uppercase" style={{ color: accentColor }}>{edu.startDate} - {edu.endDate}</p>
                                <h4 className="font-bold text-md">{edu.degree}</h4>
                                <h5 className="font-semibold text-gray-600">{edu.institution}</h5>
                            </div>
                        ))}</div>
                     </div>;
                     case 'projects': return <div key={section.id} className="mb-4"><Title/>{data.projects.map(proj => (
                        <div key={proj.id} className="mb-2">
                            <h4 className="font-bold">{proj.name} <a href={`https://${proj.link}`} style={{ color: accentColor }} className="hover:underline text-xs font-normal">({proj.link})</a></h4>
                            <p className="text-sm">{proj.description}</p>
                        </div>))}
                     </div>;
                     case 'skills': return <div key={section.id} className="mb-4"><Title/><p className="text-gray-700">{data.skills.map(s => s.name).join(' • ')}</p></div>;
                     default: return null;
                }
            })}
        </div>
    </div>
);


const ResumeBuilder: React.FC = () => {
    const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
    const [orderedSections, setOrderedSections] = useState<Section[]>(sectionsConfig);
    const [selectedTemplate, setSelectedTemplate] = useState('creative');
    const [selectedFont, setSelectedFont] = useState('Inter');
    const [accentColor, setAccentColor] = useState('#6366f1');
    const previewRef = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const { profileData, triggerAtsAnalysis } = useOutletContext<{ profileData: User, triggerAtsAnalysis: (resumeText: string, jobTitle: string) => void }>();


    const templates = { 
        creative: { name: 'Creative', component: CreativeTemplate },
        modern: { name: 'Modern', component: ModernTemplate }, 
        compact: { name: 'Compact', component: CompactTemplate },
        chronological: { name: 'Chronological', component: ChronologicalTemplate },
        classic: { name: 'Classic', component: ClassicTemplate } 
    };
    const fonts = ['Inter', 'Roboto', 'Lato', 'Merriweather', 'Georgia'];
    const colorPalettes = ['#6366f1', '#10b981', '#0ea5e9', '#f97316', '#ef4444', '#8b5cf6'];

    const handlePrint = () => {
        const previewContent = previewRef.current;
        if (!previewContent) return;

        const printWindow = window.open('', '', 'height=1123,width=794');
        if (!printWindow) return;
        
        const sanitizedUserName = profileData.fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const resumeFilename = `${sanitizedUserName}_resume`;
        printWindow.document.write(`<html><head><title>${resumeFilename}</title>`);
        
        const links = document.head.querySelectorAll('link');
        const styles = document.head.querySelectorAll('style');
        links.forEach(link => {
            printWindow.document.head.appendChild(link.cloneNode(true));
        });
        styles.forEach(style => {
            printWindow.document.head.appendChild(style.cloneNode(true));
        });
        
        printWindow.document.write(`
            <style>
                @media print {
                    @page { size: A4; margin: 0; }
                    body { 
                        margin: 0; 
                        font-family: ${selectedFont}, sans-serif !important; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                    }
                    .resume-print-container { padding: 2rem; }
                }
            </style>
        `);
        
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<div class="resume-print-container">${previewRef.current.innerHTML}</div>`);
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        
        printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        };
    };
    
    const updatePersonalDetails = (field: keyof ResumeData['personalDetails'], value: string) => {
        setResumeData(prev => ({ ...prev, personalDetails: { ...prev.personalDetails, [field]: value }}));
    };

    const updateSummary = (value: string) => setResumeData(prev => ({ ...prev, summary: value }));

    const updateListItem = (section: SectionType, id: string, field: string, value: string) => {
        setResumeData(prev => ({
            ...prev,
            [section]: prev[section as keyof Omit<ResumeData, 'personalDetails'|'summary'>].map((item: any) =>
                item.id === id ? { ...item, [field]: value } : item
            ),
        }));
    };
    
    const addListItem = (section: SectionType) => {
        let newItem: Experience | Education | Project | Skill;
        switch(section) {
            case 'experience': newItem = {id: uid(), role: '', company: '', startDate: '', endDate: '', description: ''}; break;
            case 'education': newItem = {id: uid(), degree: '', institution: '', startDate: '', endDate: '', gpa: ''}; break;
            case 'projects': newItem = {id: uid(), name: '', description: '', link: ''}; break;
            case 'skills': newItem = {id: uid(), name: ''}; break;
            default: return;
        }
        setResumeData(prev => ({ ...prev, [section]: [...prev[section as keyof Omit<ResumeData, 'personalDetails'|'summary'>], newItem] }));
    };

    const removeListItem = (section: SectionType, id: string) => {
        setResumeData(prev => ({
            ...prev,
            [section]: prev[section as keyof Omit<ResumeData, 'personalDetails'|'summary'>].filter((item: any) => item.id !== id),
        }));
    };

    const formatResumeForApi = (data: ResumeData): string => {
        let resumeText = `Name: ${data.personalDetails.fullName}\nTitle: ${data.personalDetails.jobTitle}\nContact: ${data.personalDetails.email}, ${data.personalDetails.phone}\n\n`;
        
        orderedSections.forEach(section => {
            switch(section.id) {
                case 'summary':
                    if(data.summary) resumeText += `## ${section.title.toUpperCase()}\n${data.summary}\n\n`;
                    break;
                case 'experience':
                    if(data.experience.length > 0) {
                        resumeText += `## ${section.title.toUpperCase()}\n`;
                        data.experience.forEach(exp => {
                            resumeText += `${exp.role} at ${exp.company} | ${exp.startDate} - ${exp.endDate}\n${exp.description.replace(/^- /gm, '  * ')}\n\n`;
                        });
                    }
                    break;
                case 'education':
                    if(data.education.length > 0) {
                        resumeText += `## ${section.title.toUpperCase()}\n`;
                        data.education.forEach(edu => {
                            resumeText += `${edu.degree}, ${edu.institution} (${edu.startDate} - ${edu.endDate})\nGPA: ${edu.gpa}\n\n`;
                        });
                    }
                    break;
                case 'projects':
                    if(data.projects.length > 0) {
                        resumeText += `## ${section.title.toUpperCase()}\n`;
                        data.projects.forEach(proj => {
                            resumeText += `${proj.name} (${proj.link})\n${proj.description}\n\n`;
                        });
                    }
                    break;
                case 'skills':
                    if(data.skills.length > 0) {
                        resumeText += `## ${section.title.toUpperCase()}\n${data.skills.map(s => s.name).join(', ')}\n\n`;
                    }
                    break;
            }
        });
        return resumeText;
    };

     const handleAtsAnalysisClick = () => {
        const formattedResume = formatResumeForApi(resumeData);
        triggerAtsAnalysis(formattedResume, resumeData.personalDetails.jobTitle);
    };
    
    const renderSectionEditor = (section: Section) => {
        switch(section.id) {
            case 'summary': return <>
                 <label className="block text-sm font-medium text-slate-600 mb-1">{section.title}</label>
                 <AutoGrowTextarea value={resumeData.summary} onChange={e => updateSummary(e.target.value)} rows={5} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none" />
            </>;
            case 'experience': return <SectionEditor title="Experience" items={resumeData.experience} onAdd={() => addListItem('experience')} onRemove={(id) => removeListItem('experience', id)} onUpdate={(id, field, value) => updateListItem('experience', id, field, value)} children={(item: Experience) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Role" value={item.role} onChange={e => updateListItem('experience', item.id, 'role', e.target.value)} />
                    <InputField label="Company" value={item.company} onChange={e => updateListItem('experience', item.id, 'company', e.target.value)} />
                    <InputField label="Start Date" value={item.startDate} onChange={e => updateListItem('experience', item.id, 'startDate', e.target.value)} />
                    <InputField label="End Date" value={item.endDate} onChange={e => updateListItem('experience', item.id, 'endDate', e.target.value)} />
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                        <AutoGrowTextarea value={item.description} onChange={e => updateListItem('experience', item.id, 'description', e.target.value)} rows={4} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                </div>}
            />;
            case 'education': return <SectionEditor title="Education" items={resumeData.education} onAdd={() => addListItem('education')} onRemove={(id) => removeListItem('education', id)} onUpdate={(id, field, value) => updateListItem('education', id, field, value)} children={(item: Education) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Degree" value={item.degree} onChange={e => updateListItem('education', item.id, 'degree', e.target.value)} />
                    <InputField label="Institution" value={item.institution} onChange={e => updateListItem('education', item.id, 'institution', e.target.value)} />
                    <InputField label="Start Date" value={item.startDate} onChange={e => updateListItem('education', item.id, 'startDate', e.target.value)} />
                    <InputField label="End Date" value={item.endDate} onChange={e => updateListItem('education', item.id, 'endDate', e.target.value)} />
                    <InputField label="GPA" value={item.gpa} onChange={e => updateListItem('education', item.id, 'gpa', e.target.value)} />
                </div>}
            />;
            case 'projects': return <SectionEditor title="Project" items={resumeData.projects} onAdd={() => addListItem('projects')} onRemove={(id) => removeListItem('projects', id)} onUpdate={(id, field, value) => updateListItem('projects', id, field, value)} children={(item: Project) => <div className="space-y-4">
                    <InputField label="Project Name" value={item.name} onChange={e => updateListItem('projects', item.id, 'name', e.target.value)} />
                    <InputField label="Link" value={item.link} onChange={e => updateListItem('projects', item.id, 'link', e.target.value)} />
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                        <AutoGrowTextarea value={item.description} onChange={e => updateListItem('projects', item.id, 'description', e.target.value)} rows={3} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                </div>}
            />;
             case 'skills': return <SectionEditor title="Skill" items={resumeData.skills} onAdd={() => addListItem('skills')} onRemove={(id) => removeListItem('skills', id)} onUpdate={(id, field, value) => updateListItem('skills', id, field, value)} children={(item: Skill) => <InputField label="Skill" value={item.name} onChange={e => updateListItem('skills', item.id, 'name', e.target.value)} />}
            />;
            default: return null;
        }
    };

    return (
        <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="flex flex-col h-full">
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-heading">Resume Builder</h1>
                    <p className="text-content mt-1">Create and customize your professional resume.</p>
                </div>
                 <button onClick={handlePrint} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200">
                    <DownloadIcon /> Download PDF
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-grow min-h-0">
                {/* Editor Panel */}
                <div className="bg-white p-6 rounded-xl border border-border overflow-y-auto">
                    <h2 className="text-xl font-bold text-heading mb-4">Editor</h2>
                    <div className="space-y-6">
                        <CollapsibleSection title="Analysis Tools">
                            <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg">
                                <p className="text-sm text-center text-content mb-4">Get an AI-powered score on how well your resume is optimized for Applicant Tracking Systems (ATS).</p>
                                <motion.button
                                    type="button"
                                    onClick={handleAtsAnalysisClick}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200"
                                >
                                    <SparklesIcon />
                                    Calculate ATS Score
                                </motion.button>
                            </div>
                        </CollapsibleSection>
                        <PersonalDetailsEditor data={resumeData.personalDetails} setData={updatePersonalDetails} />
                        <Reorder.Group axis="y" values={orderedSections} onReorder={setOrderedSections} className="space-y-4">
                            {orderedSections.map(section => (
                                <Reorder.Item key={section.id} value={section}>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center mb-4">
                                            <div className="cursor-grab text-slate-400"><DragHandleIcon /></div>
                                            <h3 className="text-lg font-bold text-heading ml-2 flex-grow">{section.title}</h3>
                                        </div>
                                        {renderSectionEditor(section)}
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="overflow-y-auto">
                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 mb-4 sticky top-0 bg-light-bg py-4 z-10">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Template</label>
                            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                                {Object.entries(templates).map(([key, { name }]) => <option key={key} value={key}>{name}</option>)}
                            </select>
                        </div>
                         <div className="flex-1">
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Font</label>
                            <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                                {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                             <label className="text-sm font-medium text-slate-600 mb-1 block">Accent Color</label>
                             <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-1.5">
                                {colorPalettes.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setAccentColor(color)}
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: color }}
                                    >
                                        {accentColor === color && <CheckIcon className="w-4 h-4 text-white m-auto"/>}
                                    </button>
                                ))}
                                 <button
                                    type="button"
                                    onClick={() => colorInputRef.current?.click()}
                                    className="relative w-6 h-6 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 flex items-center justify-center"
                                >
                                     {!colorPalettes.includes(accentColor) && <CheckIcon className="w-4 h-4 text-white" />}
                                    <input
                                        ref={colorInputRef}
                                        type="color"
                                        value={accentColor}
                                        onChange={e => setAccentColor(e.target.value)}
                                        className="absolute w-full h-full opacity-0 cursor-pointer"
                                    />
                                </button>
                             </div>
                        </div>
                    </div>
                    <div ref={previewRef} className="bg-white p-8 rounded-xl border border-border shadow-lg w-full">
                        {React.createElement(templates[selectedTemplate as keyof typeof templates].component, { data: resumeData, font: selectedFont, orderedSections, accentColor })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ResumeBuilder;