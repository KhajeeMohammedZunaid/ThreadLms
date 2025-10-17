import api from './api';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  employmentType: string;
  salary: string;
  postedDate: string;
  description: string;
  applyUrl: string;
  isRemote: boolean;
}

interface SearchJobsParams {
  query?: string;
  location?: string;
  page?: number;
}

const searchJobs = async (params: SearchJobsParams): Promise<Job[]> => {
  const { query = 'developer', location = '', page = 1 } = params;
  
  const response = await api.get('/jobs/search', {
    params: { query, location, page }
  });
  
  return response.data.data;
};

export default {
  searchJobs
};
