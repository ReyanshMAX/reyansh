export interface SiteSettings {
  nowText: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  resumePath: string | null;
}

export const EMPTY_SETTINGS: SiteSettings = { nowText: '', email: '', githubUrl: '', linkedinUrl: '', resumePath: null };

export const SETTINGS_COLUMNS = 'now_text, email, github_url, linkedin_url, resume_path';

export function toSiteSettings(row: {
  now_text: string; email: string; github_url: string; linkedin_url: string; resume_path: string | null;
}): SiteSettings {
  return {
    nowText: row.now_text,
    email: row.email,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    resumePath: row.resume_path,
  };
}
