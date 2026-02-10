import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Calculate waiting time in minutes between two timestamps
 */
export const calculateWaitingTime = (previousEndTime, currentStartTime) => {
  if (!previousEndTime || !currentStartTime) return 0;
  
  const prev = new Date(previousEndTime);
  const curr = new Date(currentStartTime);
  const diffMs = curr - prev;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  return diffMinutes > 0 ? diffMinutes : 0;
};

/**
 * Get the last end time for a service unit from service_time table
 */
export const getLastEndTime = async (processId, serviceUnit, isHP = false) => {
  try {
    const table = isHP ? 'hp' : 'rdf';
    const response = await axios.get(`${API_URL}/api/service-time/last-end-time`, {
      params: { 
        process_id: processId, 
        service_unit: serviceUnit,
        table: table
      }
    });
    return response.data.end_time;
  } catch (error) {
    console.error('Error getting last end time:', error);
    return null;
  }
};

/**
 * Record service time for RDF process
 */
export const recordRDFServiceTime = async ({
  processId,
  serviceUnit,
  startTime,
  endTime,
  waitingMinutes = 0,
  officerId,
  officerName,
  notes = ''
}) => {
  try {
    const serviceTimeData = {
      process_id: processId,
      service_unit: serviceUnit,
      start_time: startTime,
      end_time: endTime,
      waiting_minutes: waitingMinutes,
      officer_id: officerId,
      officer_name: officerName,
      status: 'completed',
      notes: notes
    };
    
    const response = await axios.post(`${API_URL}/api/service-time`, serviceTimeData);
    console.log(`✅ ${serviceUnit} service time recorded:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to record ${serviceUnit} service time:`, error);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};

/**
 * Record service time for HP process
 */
export const recordHPServiceTime = async ({
  processId,
  serviceUnit,
  startTime,
  endTime,
  waitingMinutes = 0,
  officerId,
  officerName,
  notes = ''
}) => {
  try {
    const serviceTimeData = {
      process_id: processId,
      service_unit: serviceUnit,
      start_time: startTime,
      end_time: endTime,
      waiting_minutes: waitingMinutes,
      officer_id: officerId,
      officer_name: officerName,
      status: 'completed',
      notes: notes
    };
    
    const response = await axios.post(`${API_URL}/api/service-time-hp`, serviceTimeData);
    console.log(`✅ ${serviceUnit} HP service time recorded:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to record ${serviceUnit} HP service time:`, error);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};

/**
 * Get current user info from localStorage
 */
export const getCurrentUser = () => {
  return {
    id: localStorage.getItem('EmployeeID'),
    name: localStorage.getItem('FullName'),
    jobTitle: localStorage.getItem('JobTitle')
  };
};

/**
 * Format timestamp for MySQL database (YYYY-MM-DD HH:MM:SS)
 */
export const formatTimestamp = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear() + '-' +
         String(d.getMonth() + 1).padStart(2, '0') + '-' +
         String(d.getDate()).padStart(2, '0') + ' ' +
         String(d.getHours()).padStart(2, '0') + ':' +
         String(d.getMinutes()).padStart(2, '0') + ':' +
         String(d.getSeconds()).padStart(2, '0');
};

/**
 * Record service time with automatic waiting time calculation
 * This is the main function to use in components
 */
export const recordServiceTimeAuto = async ({
  processId,
  serviceUnit,
  startTime,
  endTime = formatTimestamp(),
  previousServiceUnit = null,
  previousEndTime = null,
  isHP = false,
  notes = ''
}) => {
  const user = getCurrentUser();
  
  // Format timestamps for MySQL
  const formattedStartTime = typeof startTime === 'string' && startTime.includes('T') 
    ? formatTimestamp(new Date(startTime)) 
    : startTime;
  const formattedEndTime = typeof endTime === 'string' && endTime.includes('T')
    ? formatTimestamp(new Date(endTime))
    : endTime;
  
  // Calculate waiting time
  let waitingMinutes = 0;
  if (previousEndTime) {
    waitingMinutes = calculateWaitingTime(previousEndTime, startTime);
  } else if (previousServiceUnit) {
    // Try to get from database
    const lastEndTime = await getLastEndTime(processId, previousServiceUnit, isHP);
    if (lastEndTime) {
      waitingMinutes = calculateWaitingTime(lastEndTime, startTime);
    }
  }
  
  // Record service time
  const recordFunction = isHP ? recordHPServiceTime : recordRDFServiceTime;
  
  return await recordFunction({
    processId,
    serviceUnit,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    waitingMinutes,
    officerId: user.id,
    officerName: user.name,
    notes
  });
};

export default {
  calculateWaitingTime,
  getLastEndTime,
  recordRDFServiceTime,
  recordHPServiceTime,
  getCurrentUser,
  formatTimestamp,
  recordServiceTimeAuto
};
