import { resetDB } from '../helper';
import { AlertObject } from '../types';

export const resetDB = async (
  alertMessage: AlertObject
): Promise<any | null> => {
  if (alertMessage.resetDB){
    await resetDB();
  }
};
