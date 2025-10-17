import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
    LayoutDashboard,
    GraduationCap,
    BookCopy,
    Code,
    Award,
    Star,
    Bell,
    Menu,
    X,
    ChevronLeft,
    ChevronDown,
    Users,
    BookOpen,
    Clock,
    CheckCircle2,
    UserCircle,
    Calendar,
    Tag,
    PlayCircle,
    FileText,
    Download,
    Smartphone,
    HelpCircle,
    ClipboardList,
    Search,
    FileCode2,
    Play,
    Loader2,
    ArrowUp,
    MessageSquare,
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Mail,
    Phone,
    Globe,
    MapPin,
    KanbanSquare,
    Heart,
    Eye,
    Camera,
    Users2,
    Folder,
    Pencil,
    Sparkles,
    GitMerge,
    LogOut,
    PlusCircle,
    FilePenLine,
    Beaker,
    Clipboard,
    Check,
    Lock,
    Trophy,
    ClipboardCheck,
    StickyNote,
    Bookmark,
    BarChart3,
    Filter,
    Bold,
    Italic,
    Underline,
    Heading,
    List,
    ListChecks,
    MessagesSquare,
    Send,
    Settings,
    CircleHelp,
    Briefcase,
    Building2,
} from 'lucide-react';

// Re-exporting with original names for minimal changes in other files
export const DashboardIcon: React.FC<{className?: string}> = ({className}) => <LayoutDashboard className={className} />;
export const CoursesIcon: React.FC<{className?: string}> = ({className}) => <BookCopy className={className} />;
export const IDEIcon: React.FC<{className?: string}> = ({className}) => <Code className={className} />;
export const CertificateIcon: React.FC<{className?: string}> = ({className}) => <Award className={className} />;
export const BadgeIcon: React.FC<{className?: string}> = ({className}) => <Star className={className} />; // Placeholder
export const BellIcon: React.FC<{className?: string}> = ({className}) => <Bell className={className} />;
export const LogoIcon: React.FC<{className?: string}> = ({className}) => <GraduationCap className={className} />;
export const MenuIcon: React.FC<{className?: string}> = ({className}) => <Menu className={className} />;
export const XIcon: React.FC<{className?: string}> = ({className}) => <X className={className} />;
export const ChevronLeftIcon: React.FC<{className?: string}> = ({className}) => <ChevronLeft className={className} />;
export const StudentsIcon: React.FC<{className?: string}> = ({className}) => <Users className={className} />;
export const LessonsIcon: React.FC<{className?: string}> = ({className}) => <BookOpen className={className} />;
export const ClockIcon: React.FC<{className?: string}> = ({className}) => <Clock className={className} />;
export const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => <CheckCircle2 className={className} />;
export const UserCircleIcon: React.FC<{className?: string}> = ({className}) => <UserCircle className={className} />;
export const CalendarIcon: React.FC<{className?: string}> = ({className}) => <Calendar className={className} />;
export const TagIcon: React.FC<{className?: string}> = ({className}) => <Tag className={className} />;
export const PlayIcon: React.FC<{className?: string}> = ({className}) => <PlayCircle className={className} />;
export const DocumentTextIcon: React.FC<{className?: string}> = ({className}) => <FileText className={className} />;
export const DownloadIcon: React.FC<{className?: string}> = ({className}) => <Download className={className} />;
export const DeviceMobileIcon: React.FC<{className?: string}> = ({className}) => <Smartphone className={className} />;
export const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => <ChevronDown className={className} />;
export const QuizIcon: React.FC<{ className?: string }> = ({ className }) => <HelpCircle className={className} />;
export const AssignmentIcon: React.FC<{ className?: string }> = ({ className }) => <ClipboardList className={className} />;
export const SearchIcon: React.FC<{className?: string}> = ({className}) => <Search className={className} />;
export const RunIcon: React.FC<{className?: string}> = ({className}) => <Play className={className} />;
export const SpinnerIcon: React.FC<{className?: string}> = ({className}) => <Loader2 className={`animate-spin ${className}`} />;
export const ArrowUpIcon: React.FC<{className?: string}> = ({className}) => <ArrowUp className={className} />;
export const MessageIcon: React.FC<{className?: string}> = ({className}) => <MessageSquare className={className} />;
export const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => <ArrowLeft className={className} />;
export const ResumeIcon: React.FC<{className?: string}> = ({className}) => <FileText className={className} />;
export const PlusIcon: React.FC<{className?: string}> = ({className}) => <Plus className={className} />;
export const TrashIcon: React.FC<{className?: string}> = ({className}) => <Trash2 className={className} />;
export const DragHandleIcon: React.FC<{className?: string}> = ({className}) => <GripVertical className={className} />;
export const EnvelopeIcon: React.FC<{className?: string}> = ({className}) => <Mail className={className} />;
export const NewsletterIcon: React.FC<{className?: string}> = ({className}) => <Mail className={className} />;
export const PhoneIcon: React.FC<{className?: string}> = ({className}) => <Phone className={className} />;
export const GlobeAltIcon: React.FC<{className?: string}> = ({className}) => <Globe className={className} />;
export const LocationMarkerIcon: React.FC<{className?: string}> = ({className}) => <MapPin className={className} />;
export const ProjectIcon: React.FC<{className?: string}> = ({className}) => <KanbanSquare className={className} />;
export const EyeIcon: React.FC<{className?: string}> = ({className}) => <Eye className={className} />;
export const CameraIcon: React.FC<{className?: string}> = ({className}) => <Camera className={className} />;
export const CollaborationIcon: React.FC<{className?: string}> = ({className}) => <Users2 className={className} />;
export const FolderIcon: React.FC<{className?: string}> = ({className}) => <Folder className={className} />;
export const PencilIcon: React.FC<{className?: string}> = ({className}) => <Pencil className={className} />;
export const SparklesIcon: React.FC<{className?: string}> = ({className}) => <Sparkles className={className} />;
export const RoadmapIcon: React.FC<{className?: string}> = ({className}) => <GitMerge className={className} />;
export const LogoutIcon: React.FC<{className?: string}> = ({className}) => <LogOut className={className} />;
export const PlusCircleIcon: React.FC<{className?: string}> = ({className}) => <PlusCircle className={className} />;
export const PencilAltIcon: React.FC<{className?: string}> = ({className}) => <FilePenLine className={className} />;
export const BeakerIcon: React.FC<{className?: string}> = ({className}) => <Beaker className={className} />;
export const ClipboardIcon: React.FC<{className?: string}> = ({className}) => <Clipboard className={className} />;
export const CheckIcon: React.FC<{className?: string}> = ({className}) => <Check className={className} />;
export const LockClosedIcon: React.FC<{className?: string}> = ({className}) => <Lock className={className} />;
export const TrophyIcon: React.FC<{className?: string}> = ({className}) => <Trophy className={className} />;
export const ClipboardCheckIcon: React.FC<{className?: string}> = ({className}) => <ClipboardCheck className={className} />;
export const ClipboardListIcon: React.FC<{className?: string}> = ({className}) => <ClipboardList className={className} />;
export const StickyWallIcon: React.FC<{className?: string}> = ({className}) => <StickyNote className={className} />;
export const BookmarkAltIcon: React.FC<{className?: string}> = ({className}) => <Bookmark className={className} />;
export const LeaderboardIcon: React.FC<{className?: string}> = ({className}) => <BarChart3 className={className} />;
export const FilterIcon: React.FC<{className?: string}> = ({className}) => <Filter className={className} />;

// Note Editor Icons
export const BoldIcon: React.FC<{className?: string}> = ({className}) => <Bold className={className} />;
export const ItalicIcon: React.FC<{className?: string}> = ({className}) => <Italic className={className} />;
export const UnderlineIcon: React.FC<{className?: string}> = ({className}) => <Underline className={className} />;
export const HeadingIcon: React.FC<{className?: string}> = ({className}) => <Heading className={className} />;
export const ListIcon: React.FC<{className?: string}> = ({className}) => <List className={className} />;
export const ListCheckIcon: React.FC<{className?: string}> = ({className}) => <ListChecks className={className} />;

// Chat icons
export const ChatBubbleLeftRightIcon: React.FC<{className?: string}> = ({className}) => <MessagesSquare className={className} />;
export const PaperAirplaneIcon: React.FC<{className?: string}> = ({className}) => <Send className={className} />;

// Settings and Help icons
export const SettingsIcon: React.FC<{className?: string}> = ({className}) => <Settings className={className} />;
export const HelpIcon: React.FC<{className?: string}> = ({className}) => <CircleHelp className={className} />;

// Jobs icons
export const BriefcaseIcon: React.FC<{className?: string}> = ({className}) => <Briefcase className={className} />;
export const BuildingIcon: React.FC<{className?: string}> = ({className}) => <Building2 className={className} />;

// Special icons that need fill or specific handling
export const StarIcon: React.FC<{className?: string}> = ({className}) => <Star className={`${className} fill-current`} />;
export const HeartIcon: React.FC<{className?: string, filled?: boolean}> = ({className, filled}) => <Heart className={`${className} ${filled ? 'fill-current' : ''}`} />;

// Generic replacement for language-specific icons
export const HtmlIcon: React.FC<{className?: string}> = ({className}) => <FileCode2 className={className} />;
export const CssIcon: React.FC<{className?: string}> = ({className}) => <FileCode2 className={className} />;
export const JavaScriptIcon: React.FC<{className?: string}> = ({className}) => <FileCode2 className={className} />;
export const PythonIcon: React.FC<{className?: string}> = ({className}) => <FileCode2 className={className} />;

// Replacement for the animated checkmark component
export const AnimatedCheckmark: React.FC<{ completed: boolean }> = ({ completed }) => {
  return (
    <div className={`w-5 h-5 flex-shrink-0 mt-1 rounded border-2 flex items-center justify-center transition-colors ${completed ? 'bg-primary border-primary' : 'bg-transparent border-slate-300'}`}>
      <AnimatePresence>
        {completed && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
