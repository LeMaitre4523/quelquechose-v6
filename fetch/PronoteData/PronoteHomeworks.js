import AsyncStorage from '@react-native-async-storage/async-storage';
import getConsts from '../consts';

import { refreshToken } from '../AuthStack/LoginFlow';

let retries = 0;

let notfounddays = {};

function getHomeworks(day, force) {
  if (force == undefined) {
    force = false;
  }

  return getConsts().then((consts) => {
    return AsyncStorage.getItem('homeworksCache').then((homeworksCache) => {
      if (homeworksCache && !force) {
        homeworksCache = JSON.parse(homeworksCache)

        for (let i = 0; i < homeworksCache.length; i += 1) {
          let thisDay = new Date(day);
          let cacheDay = new Date(homeworksCache[i].date);

          thisDay.setHours(0, 0, 0, 0);
          cacheDay.setHours(0, 0, 0, 0);

        if ( thisDay.getTime() === cacheDay.getTime()) {
          let currentTime = new Date();
          currentTime.setHours(0, 0, 0, 0);

          let cacheTime = new Date(homeworksCache[i].dateSaved);
          cacheTime.setHours(0, 0, 0, 0);

          if (currentTime.getTime() === cacheTime.getTime()) {
            console.log('homeworks from cache');
            return homeworksCache[i].timetable;
          }
        }
        }
      }

      // TEMPORARY : remove 1 month
      day = new Date(day);

      // date = '2021-09-13' (YYYY-MM-DD)
      const date = new Date(day);
      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let dayOfMonth = date.getDate();

      if (month < 10) {
        month = `0${month}`;
      }

      if (dayOfMonth < 10) {
        dayOfMonth = `0${dayOfMonth}`;
      }

      day = `${year}-${month}-${dayOfMonth}`;

      console.log(day);

      // obtenir le token
      return AsyncStorage.getItem('token').then((token) =>
        // fetch les devoirs
        fetch(
          `${consts.API}/homework` +
            `?token=${token}&dateFrom=${day}&dateTo=${day}`,
          {
            method: 'GET',
          }
        )
          .then((response) => response.json())
          .catch((e) => {
            console.log('ERR : PronoteHomeworks', e);
            return [];
          })
          .then((result) => {
            console.log(result)

            if (result === 'notfound') {
              return refreshToken().then(() => getHomeworks(day));
            }

            if (result === 'expired') {
              return refreshToken().then(() => getHomeworks(day));
            }

            // save in cache
            AsyncStorage.getItem('homeworksCache').then((homeworksCache) => {
              let cachedHomeworks = [];

              if (homeworksCache) {
                cachedHomeworks = JSON.parse(homeworksCache);
              }

              cachedHomeworks = cachedHomeworks.filter((entry) => {
                return entry.date !== day;
              });

              cachedHomeworks.push({
                date: day,
                dateSaved : new Date(),
                timetable: result,
              });

              AsyncStorage.setItem(
                'homeworksCache',
                JSON.stringify(cachedHomeworks)
              );
            });

            return result;
          })
          .catch((e) => {
            console.log(e);
            return [];
          })
      );
    });
  });
}

function changeHomeworkState(day, id) {
  // TEMPORARY : remove 1 month
  day = day.split(" ")[0];
  console.log("i:"+id)
  console.log("d:"+day)

  id = id.replace("#", "%23");

  // obtenir le token
  return getConsts().then((consts) => {
    return AsyncStorage.getItem('token').then((token) =>
      // fetch les devoirs
      fetch(
        `${consts.API}/homework/changeState?token=${token}&dateFrom=${day}&dateTo=${day}&homeworkId=${id}`,
        {
          method: 'POST',
        }
      )
        .then((response) => response.json())
        .then((result) => {
          console.log(`${consts.API}/homework/changeState?token=${token}&dateFrom=${day}&dateTo=${day}&homeworkId=${id}`);
          if (result === 'expired' || result === 'notfound') {
            return refreshToken().then(() => changeHomeworkState(date, id));
          }
          return result;
        })
    );
  });
}

export { getHomeworks, changeHomeworkState };
