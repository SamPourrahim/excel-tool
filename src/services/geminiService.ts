import type { DatePair, ComparePair } from "../types";

type Mode = 'calculate' | 'merge' | 'group' | 'compare';

interface CalculateParams {
  pairs: DatePair[];
}

interface MergeParams {
  key1: string;
  key2: string;
}

interface GroupParams {
  key: string;
}

interface CompareParams {
    key1: string;
    key2: string;
    pairs: Omit<ComparePair, 'id'>[];
}

// Placeholder text to show when the API call is disabled.
const API_DISABLED_MESSAGE = `# Python code generation is disabled in this version.
# The core functionalities of this application (calculations, merges, etc.) 
# are performed directly in your browser using JavaScript.
#
# The 'Generate Code' feature typically uses the Gemini API to create a 
# Python script that replicates the operation you just performed,
# allowing you to automate the task outside of this web app.
# 
# To enable this feature, you would need to restore the API call logic 
# in 'services/geminiService.ts' and provide a valid API key.
`;

export const generatePythonCode = async (
  _mode: Mode,
  _params: CalculateParams | MergeParams | GroupParams | CompareParams
): Promise<string> => {
  // This function is now a placeholder and does not call any external API.
  // It immediately returns a static message.
  return Promise.resolve(API_DISABLED_MESSAGE);
};