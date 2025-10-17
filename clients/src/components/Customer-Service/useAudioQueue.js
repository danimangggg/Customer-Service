import { useEffect, useRef } from 'react';
import { useAmharicNumbers } from './useAmharicNumbers';

const ANNOUNCEMENT_REPEAT_INTERVAL_MS = 5 * 1000;

export const useAudioQueue = (filteredCustomers, audioStarted) => {
  const audioQueueRef = useRef([]);
  const lastCallTimes = useRef(new Map());
  const isPlayingAudio = useRef(false);
  const { playNumber } = useAmharicNumbers();

  // Function to process and play the next audio in the queue
  const playNextAudio = async () => {
    if (isPlayingAudio.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingAudio.current = true;
    const nextCustomerId = audioQueueRef.current.shift();
    
    await playNumber(nextCustomerId);

    setTimeout(() => {
      isPlayingAudio.current = false;
      playNextAudio();
    }, 5000);
  };

  // This effect handles adding customers to the queue
  useEffect(() => {
    if (!audioStarted) return;

    const now = Date.now();
    const customersToAnnounce = filteredCustomers.filter(c => c.status?.toLowerCase() === 'notifying');
    
    // Clean up customers who are no longer notifying
    const currentNotifyingIds = new Set(customersToAnnounce.map(c => c.id));
    for (let customerId of lastCallTimes.current.keys()) {
      if (!currentNotifyingIds.has(customerId)) {
        lastCallTimes.current.delete(customerId);
      }
    }
    
    // Add new customers to the queue if they haven't been called recently
    customersToAnnounce.forEach(cust => {
      const lastCalled = lastCallTimes.current.get(cust.id);
      const shouldAnnounce = !lastCalled || (now - lastCalled > ANNOUNCEMENT_REPEAT_INTERVAL_MS);

      if (shouldAnnounce) {
        if (!audioQueueRef.current.includes(cust.id)) {
          audioQueueRef.current.push(cust.id);
        }
        lastCallTimes.current.set(cust.id, now);
      }
    });

    if (!isPlayingAudio.current && audioQueueRef.current.length > 0) {
      playNextAudio();
    }
  }, [filteredCustomers, audioStarted, playNumber]);
};