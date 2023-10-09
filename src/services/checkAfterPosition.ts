import { getStrategiesDB } from '../helper';
import { AlertObject } from '../types';

export const checkAfterPosition = async (
  alertMessage: AlertObject
): Promise<any | null> => {
  const [db, rootData] = getStrategiesDB();

  if (!rootData[alertMessage.strategy] || !rootData[alertMessage.strategy].position) {
    return null;
  }

  return rootData;
};
