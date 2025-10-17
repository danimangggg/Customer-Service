import { useState, useEffect } from 'react';

export const useAmharicNumbers = () => {
  const playNumber = (number) => {
    return new Promise((resolve, reject) => {
      // Dynamically create a new Audio object for the received number
      const audio = new Audio(`/audio/amharic/${number}.mp3`);
      
      const handleAudioEnd = () => {
        audio.removeEventListener('ended', handleAudioEnd);
        resolve();
      };
      
      const handleAudioError = (error) => {
        audio.removeEventListener('error', handleAudioError);
        console.error(`Error playing audio for number ${number}:`, error);
        reject(error);
      };

      audio.addEventListener('ended', handleAudioEnd);
      audio.addEventListener('error', handleAudioError);
      
      audio.play().catch(error => {
        console.error(`Playback failed for number ${number}:`, error);
        handleAudioError(error);
      });
    });
  };

  // We no longer need to pre-load audio sources, so we can return just the function
  return { playNumber };
};