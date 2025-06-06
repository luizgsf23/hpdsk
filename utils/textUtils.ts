
import React from 'react';

/**
 * Parses a string with markdown-like bold syntax (**text**) and returns an array of
 * React nodes where bolded parts are wrapped in <strong> tags.
 * @param text The input string.
 * @returns An array of strings and JSX elements.
 */
export const parseBoldMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];
  
  // Split by the ** delimiter.
  // "This is **important** and **very** cool."
  // -> ["This is ", "important", " and ", "very", " cool."]
  const parts = text.split('**');
  
  return parts.map((part, index) => {
    // Parts at odd indices were between ** delimiters
    if (index % 2 === 1) {
      // Use React.createElement for <strong>
      return React.createElement('strong', { key: index }, part);
    }
    // Parts at even indices are regular text
    return part;
  }).filter(part => part !== ''); // Filter out empty strings that might result from consecutive delimiters or start/end.
};
