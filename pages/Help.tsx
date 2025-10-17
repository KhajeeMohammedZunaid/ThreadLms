import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, SearchIcon, LessonsIcon, StudentsIcon, EnvelopeIcon } from '../components/icons';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    category: 'Getting Started',
    question: 'How do I enroll in a course?',
    answer: 'To enroll in a course, navigate to the Courses page, browse available courses, and click the "Enroll Now" button on the course you\'re interested in. You\'ll be redirected to a confirmation page where you can complete your enrollment.'
  },
  {
    id: '2',
    category: 'Getting Started',
    question: 'How do I track my progress?',
    answer: 'Your progress is automatically tracked as you complete lessons, quizzes, and assignments. You can view your overall progress on the Dashboard or check detailed progress for each course on the Course Detail page.'
  },
  {
    id: '3',
    category: 'Courses',
    question: 'Can I access course materials after completion?',
    answer: 'Yes! Once you enroll in a course, you have lifetime access to all course materials, including videos, notes, and assignments. You can revisit the content anytime from your enrolled courses.'
  },
  {
    id: '4',
    category: 'Courses',
    question: 'How do quizzes work?',
    answer: 'Each course section may contain quizzes to test your understanding. You can take quizzes multiple times, and your highest score will be recorded. Quizzes typically have a mix of multiple-choice, true/false, and short-answer questions.'
  },
  {
    id: '5',
    category: 'Projects',
    question: 'How do I submit a project?',
    answer: 'Navigate to the Projects section and click "Submit Project". Fill in the project details including title, description, tags, and project URL. You can also add screenshots or images to showcase your work.'
  },
  {
    id: '6',
    category: 'Projects',
    question: 'Can I edit my submitted projects?',
    answer: 'Yes! Go to "My Projects" page, find the project you want to edit, and click the edit button. You can update all project details and resubmit.'
  },
  {
    id: '7',
    category: 'Collaboration',
    question: 'How does collaboration work?',
    answer: 'The Collaborate page allows you to find team members for projects. You can post collaboration opportunities or join existing ones. Simply create a post with your project idea, required skills, and team size, then interested students can reach out to you.'
  },
  {
    id: '8',
    category: 'Certificates',
    question: 'How do I get a certificate?',
    answer: 'Certificates are automatically generated when you complete 100% of a course, including all lessons, quizzes, assignments, and the final project. You can download your certificates from the Accomplishments page.'
  },
  {
    id: '9',
    category: 'Certificates',
    question: 'Are certificates verifiable?',
    answer: 'Yes, all certificates include a unique verification code and can be verified by employers or institutions. Each certificate also contains a QR code for quick verification.'
  },
  {
    id: '10',
    category: 'Technical',
    question: 'What browsers are supported?',
    answer: 'Our platform works best on the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience with the IDE and interactive features, we recommend using Chrome or Firefox.'
  },
  {
    id: '11',
    category: 'Technical',
    question: 'Can I use the platform on mobile?',
    answer: 'Yes, the platform is fully responsive and works on tablets and smartphones. However, for the best coding experience in the IDE, we recommend using a desktop or laptop.'
  },
  {
    id: '12',
    category: 'Account',
    question: 'How do I update my profile?',
    answer: 'Click on your profile picture in the top right corner and select "Profile". From there, you can update your personal information, profile picture, bio, and other details.'
  },
  {
    id: '13',
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'On the login page, click "Forgot Password" and enter your email address. You\'ll receive a password reset link via email. Follow the instructions in the email to create a new password.'
  },
];

const categories = ['All', 'Getting Started', 'Courses', 'Projects', 'Collaboration', 'Certificates', 'Technical', 'Account'];

const Help: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-heading">Help Center</h1>
        <p className="text-content mt-2">Find answers to common questions and get support</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-content w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickLinkCard
          icon={LessonsIcon}
          title="User Guide"
          description="Complete guide to using the platform"
          color="bg-blue-50 text-blue-600"
        />
        <QuickLinkCard
          icon={StudentsIcon}
          title="Community Forum"
          description="Connect with other learners"
          color="bg-green-50 text-green-600"
        />
        <QuickLinkCard
          icon={EnvelopeIcon}
          title="Contact Support"
          description="Get help from our team"
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-content hover:bg-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-heading mb-4">
          Frequently Asked Questions
          <span className="text-sm font-normal text-content ml-2">
            ({filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'})
          </span>
        </h2>

        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-content">No questions found matching your search.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="mt-4 text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredFaqs.map(faq => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isExpanded={expandedFaq === faq.id}
              onToggle={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            />
          ))
        )}
      </div>

      {/* Contact Section */}
      <div className="mt-12 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
        <p className="mb-6 opacity-90">Our support team is here to assist you</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-primary hover:bg-slate-100 font-bold py-3 px-6 rounded-lg transition-colors">
            Send us a message
          </button>
          <button className="border-2 border-white hover:bg-white hover:text-primary font-bold py-3 px-6 rounded-lg transition-colors">
            Schedule a call
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// FAQ Item Component
const FAQItem: React.FC<{
  faq: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ faq, isExpanded, onToggle }) => (
  <motion.div
    className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    initial={false}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
    >
      <div className="flex-1">
        <span className="text-xs font-semibold text-primary mb-1 block">{faq.category}</span>
        <h3 className="font-semibold text-heading">{faq.question}</h3>
      </div>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDownIcon className="w-5 h-5 text-content" />
      </motion.div>
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="px-4 pb-4 text-content border-t border-slate-100">
            <p className="pt-3">{faq.answer}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// Quick Link Card Component
const QuickLinkCard: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}> = ({ icon: Icon, title, description, color }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white border border-slate-200 rounded-lg p-6 text-left hover:shadow-md transition-all"
  >
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-heading mb-1">{title}</h3>
    <p className="text-sm text-content">{description}</p>
  </motion.button>
);

export default Help;
