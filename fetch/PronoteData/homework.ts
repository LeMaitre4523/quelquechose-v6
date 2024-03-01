import type { PapillonHomework } from '../types/homework';
import type { PapillonAttachment, PapillonAttachmentType } from '../types/attachment';
import { PronoteApiHomeworkReturnType, type Pronote } from 'pawnote';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStoragePronoteKeys } from './connector';
import { getDefaultStore } from 'jotai';
import { homeworksAtom } from '../../atoms/homeworks';

const defaultStore = getDefaultStore();

const makeLocalID = (homework: {
  description: string
  subjectName: string | undefined
  date: Date
}): string => {
  let localID: string;

  // return a combination of the 20 first letters of description
  if (homework.description.length > 20) {
    localID = homework.description.substring(0, 20);
  }
  else {
    localID = homework.description;
  }

  // 2 first letters of subject name
  localID += homework.subjectName?.substring(0, 2) ?? '??';

  // date in ISO
  localID += homework.date.toISOString();

  return localID;
};

export const homeworkHandler = async (force = false, instance?: Pronote): Promise<PapillonHomework[]> => {
  const cache = await AsyncStorage.getItem(AsyncStoragePronoteKeys.CACHE_HOMEWORK);
  let data: PapillonHomework[] = cache ? JSON.parse(cache) : [];

  if (cache && !force) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if every items has been fetched in less than 24 hours.
    const isNotOutdated = data.every(homework => {
      const cacheDate = new Date(homework.cacheDateTimestamp);
      cacheDate.setHours(0, 0, 0, 0);

      return cacheDate.getTime() === today.getTime();
    });

    // We don't need to fetch again if everything is up to date.
    if (isNotOutdated) {
      console.info('homeworks: cache is up to date, using it.');
      return data;
    }
  } // otherwise, we fetch.

  // Prevent errors when not initialized.
  if (!instance) return [];
  console.info('homeworks: fetching new data.');

  try {
    // We don't pass the end of the interval, because we want every homework
    // from the given day until the end of the year.
    const homeworks = await instance.getHomeworkForInterval(instance.firstDate);
    data = [];

    for (const homework of homeworks) {
      const attachments: PapillonAttachment[] = [];
      for (const attachment of homework.attachments) {
        attachments.push({
          name: attachment.name,
          type: attachment.type as unknown as PapillonAttachmentType,
          url: attachment.url,
        });
      }

      const localID = makeLocalID({
        description: homework.description,
        subjectName: homework.subject.name,
        date: homework.deadline,
      });

      const themes = homework.themes.map(theme => theme.name);

      data.push({
        id: homework.id,

        localID,
        pronoteCachedSessionID: instance.sessionID,
        cacheDateTimestamp: Date.now(),

        themes,
        attachments,

        subject: {
          id: homework.subject.id,
          name: homework.subject.name,
          groups: homework.subject.groups,
        },

        description: homework.description,
        background_color: homework.backgroundColor,
        
        done: homework.done,
        date: homework.deadline.toISOString(),
        return: homework.return ? {
          type: homework.return.type,
          uploaded: homework.return.type === PronoteApiHomeworkReturnType.FILE_UPLOAD ? homework.return.uploaded : undefined,
        } : undefined,

        difficulty: homework.difficulty,
        lengthInMinutes: homework.lengthInMinutes,
      });
    }

    await AsyncStorage.setItem(AsyncStoragePronoteKeys.CACHE_HOMEWORK, JSON.stringify(data));
  }
  catch (error) {
    console.info('pronote/homeworkHandler: network failed, recovering with possible cache');
    console.error(error);
  }

  return data;
};

export const homeworkPatchHandler = async (homework: PapillonHomework, newDoneState: boolean, instance?: Pronote): Promise<boolean> => {
  if (!instance) return false;

  let homeworks = defaultStore.get(homeworksAtom);

  // Not on same session, we fetch again.
  if (homework.pronoteCachedSessionID !== instance.sessionID) {
    homeworks = await homeworkHandler(true, instance);
  }
  
  if (!homeworks) return false;

  // We search for the homework with the same localID.
  const homeworkIndex = homeworks.findIndex(currentHomework => currentHomework.localID === homework.localID);
  if (homeworkIndex === -1) return false;
  const homeworkID = homeworks[homeworkIndex].id;

  // We patch the homework.
  await instance.patchHomeworkStatus(homeworkID, newDoneState);
  homeworks[homeworkIndex].done = newDoneState;
  defaultStore.set(homeworksAtom, homeworks);

  return true;
};
