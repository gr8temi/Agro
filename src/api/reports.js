import client from './client';

const endpoint = '/reports';

const getConfig = () => client.get(`${endpoint}/config/`);
const createConfig = (data) => client.post(`${endpoint}/config/`, data);
const updateConfig = (id, data) => client.patch(`${endpoint}/config/${id}/`, data);
const getSubmissions = () => client.get(`${endpoint}/submissions/`);
const getSubmission = (id) => client.get(`${endpoint}/submissions/${id}/`);
const createSubmission = (data) => client.post(`${endpoint}/submissions/`, data);

// Question Management
const getQuestions = () => client.get(`${endpoint}/questions/`);
const createQuestion = (data) => client.post(`${endpoint}/questions/`, data);
const updateQuestion = (id, data) => client.patch(`${endpoint}/questions/${id}/`, data);
const deleteQuestion = (id) => client.delete(`${endpoint}/questions/${id}/`);

export default {
  getConfig,
  createConfig,
  updateConfig,
  getSubmissions,
  getSubmission,
  createSubmission,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
