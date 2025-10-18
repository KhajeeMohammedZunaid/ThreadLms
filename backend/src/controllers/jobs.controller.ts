import { Request, Response } from 'express';
import axios from 'axios';

export const searchJobs = async (req: Request, res: Response) => {
  try {
    const { query = 'developer', location = '', page = '1' } = req.query;

    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: location ? `${query} in ${location}` : query,
        page: page,
        num_pages: '1'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'RAPIDAPI_KEY',
        'x-rapidapi-host': 'jsearch.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    
    // Format the response
    const jobs = response.data.data.map((job: any) => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      companyLogo: job.employer_logo || 'https://via.placeholder.com/48',
      location: `${job.job_city || ''}${job.job_city && job.job_country ? ', ' : ''}${job.job_country || 'Remote'}`,
      employmentType: job.job_employment_type || 'Full-time',
      salary: job.job_min_salary && job.job_max_salary 
        ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`
        : 'Not specified',
      postedDate: job.job_posted_at_datetime_utc,
      description: job.job_description || '',
      applyUrl: job.job_apply_link,
      isRemote: job.job_is_remote || false
    }));

    res.status(200).json({
      status: 'success',
      data: jobs,
      total: response.data.data.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching jobs:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};
