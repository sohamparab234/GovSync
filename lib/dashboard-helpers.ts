import type { ApplicationRecord } from './types';

export interface StageInfo {
  stageNumber: number;
  stageLabel: string;
  nextAction: string;
  stagePercent: number;
}

export function getStageInfo(app: ApplicationRecord): StageInfo {
  switch (app.status) {
    case 'draft':
      return {
        stageNumber: 1,
        stageLabel: 'Stage 1 of 5: Verification pending',
        nextAction: 'Next action: Complete required department checks to proceed.',
        stagePercent: 20,
      };
    case 'eligible':
      return {
        stageNumber: 2,
        stageLabel: 'Stage 2 of 5: Ready for submission',
        nextAction: 'Next action: Confirm statement and submit application.',
        stagePercent: 40,
      };
    case 'submitted':
      return {
        stageNumber: 4,
        stageLabel: 'Stage 4 of 5: Department Review in progress',
        nextAction: 'Next action: Awaiting officer verification and department decision.',
        stagePercent: 80,
      };
    case 'clarification':
      return {
        stageNumber: 4,
        stageLabel: 'Stage 4 of 5: Officer Clarification requested',
        nextAction: 'Next action: Submit clarification response to reviewing officer.',
        stagePercent: 75,
      };
    case 'approved':
      return {
        stageNumber: 5,
        stageLabel: 'Stage 5 of 5: Approved · Certificate available',
        nextAction: 'Next action: Your application is approved. You can view or download the certificate.',
        stagePercent: 100,
      };
    case 'rejected':
      return {
        stageNumber: 5,
        stageLabel: 'Stage 5 of 5: Application rejected',
        nextAction: 'Next action: Review the officer decision note.',
        stagePercent: 100,
      };
    default:
      return {
        stageNumber: 1,
        stageLabel: 'Stage 1 of 5: Verification pending',
        nextAction: 'Next action: Complete required department checks to proceed.',
        stagePercent: 20,
      };
  }
}
