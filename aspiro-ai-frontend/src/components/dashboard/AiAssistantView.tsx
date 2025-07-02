// src/components/dashboard/AiAssistantView.tsx
// AiAssistantView: Placeholder for future AI chat assistant UI. Not yet functional.
import React from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

/**
 * AiAssistantView functional component.
 * Renders a placeholder UI for an AI chat assistant.
 */
const AiAssistantView: React.FC = () => {
  // Future: Add state, input, and API logic for AI assistant chat.

  return (
    <div className="flex flex-col h-[calc(100vh-20rem)] bg-surface rounded-xl shadow-2xl animate-fadeIn">
      {/* Chat messages area */}
      <div className="flex-grow p-6 space-y-4 overflow-y-auto">
        {/* Example AI Message (Placeholder) */}
        <div className="flex justify-start">
          <div className="bg-background/50 text-text-DEFAULT p-3 rounded-lg max-w-xs lg:max-w-md shadow">
            Hello! I am your AI Career Assistant. How can I help you today? (This is a placeholder UI)
          </div>
        </div>
        {/* Example User Message (Placeholder) */}
        <div className="flex justify-end">
          <div className="bg-primary text-white p-3 rounded-lg max-w-xs lg:max-w-md shadow">
            I'd like to know more about transitioning into data science.
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-background">
        <div className="flex items-center bg-background/30 rounded-lg shadow-inner">
          <input
            type="text"
            placeholder="Ask me anything..."
            className="flex-grow p-3 bg-transparent focus:outline-none placeholder-text-secondary/70 text-text-DEFAULT"
          />
          <button className="p-3 text-primary hover:text-primary-dark transition-colors duration-300">
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantView;
