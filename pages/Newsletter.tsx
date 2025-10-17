import React from 'react';
import { motion } from 'framer-motion';

const Newsletter: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Newsletter</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Automated tech news delivered to your inbox every 2 days
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6 text-center"
          >
            <div className="text-3xl font-bold text-gray-800 mb-2">Every 2 Days</div>
            <div className="text-sm text-gray-600">Delivery Schedule</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-6 text-center"
          >
            <div className="text-3xl font-bold text-gray-800 mb-2">9:00 AM</div>
            <div className="text-sm text-gray-600">IST Time</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-6 text-center"
          >
            <div className="text-3xl font-bold text-gray-800 mb-2">5-7</div>
            <div className="text-sm text-gray-600">Stories</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="text-3xl font-bold text-gray-800">Active</div>
            </div>
            <div className="text-sm text-gray-600">Subscription</div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Newsletter;
