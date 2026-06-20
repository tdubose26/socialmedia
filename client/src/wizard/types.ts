import { GENERAL_SUGGESTED_TIMES } from './suggestedTimes';

export type AiModel = 'chatgpt' | 'claude';

export type WizardData = {
  // Business basics
  industry: string;
  brandTone: string;
  callToAction: string;
  topics: string[];

  // Step 1 — AI model
  aiModel: AiModel | '';

  // Step 3 / 4 / 6 — preferences
  representation: string[];
  location: string[];
  outfitStyle: string[];

  // Step 7 — platforms
  platforms: string[];

  // Step 8 — schedule
  postingDate: string; // YYYY-MM-DD
  dayLimit: 5 | 10;
  times: string[]; // one or more 'HH:MM' slots
  timesEdited: boolean; // true once the user manually changes the times
};

export const initialWizardData: WizardData = {
  industry: '',
  brandTone: '',
  callToAction: '',
  topics: [],
  aiModel: '',
  representation: [],
  location: [],
  outfitStyle: [],
  platforms: [],
  postingDate: '',
  dayLimit: 5,
  times: [...GENERAL_SUGGESTED_TIMES],
  timesEdited: false,
};
