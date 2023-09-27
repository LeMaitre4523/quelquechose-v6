// React Native code
import * as React from 'react';
import {
  View,
  Alert,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  Easing,
  TouchableHighlight,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';

// Components & Styles
import { useTheme, Text } from 'react-native-paper';
import GetUIColors from '../utils/GetUIColors';
import { PressableScale } from 'react-native-pressable-scale';

// Fetch
import { IndexData } from '../fetch/IndexData';

// Custom Components
import PapillonList from '../components/PapillonList';

// Icons 
import { DownloadCloud, Check, Gavel, Newspaper, MessagesSquare, CheckCircle } from 'lucide-react-native';

// Formatting
import { getClosestCourseColor } from '../utils/ColorCoursName';
import formatCoursName from '../utils/FormatCoursName';
import getClosestGradeEmoji from '../utils/EmojiCoursName';

// Modules
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContextMenuView } from 'react-native-ios-context-menu';

// Functions
const openURL = (url) => {
  isURL = url.includes('http://') || url.includes('https://');

  if (!isURL) {
    Alert.alert(
      'URL invalide',
      'Le lien fourni par votre établissement ne peut pas être ouvert.',
      [
        {
          text: 'OK',
          style: 'cancel'
        },
        {
          text: 'Ouvrir quand même',
          onPress: () => {
            Linking.openURL(`https://${url}`);
          }
        }
      ]
    );
    return;
  }

  WebBrowser.openBrowserAsync(url, {
    dismissButtonStyle: 'done',
    presentationStyle: 'pageSheet',
    controlsColor: Platform.OS == 'ios' ? '#29947A' : null,
    readerMode: true,
    createTask: false,
  });
};

// App
const NewHomeScreen = ({ navigation }) => {
  // main hooks
  const theme = useTheme();
  const UIColors = GetUIColors();

  // Refresh
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('homeUpdated').then((value) => {
        if (value === 'true') {
          console.log('home updated');
          setRefreshCount((prevCount) => prevCount + 1);

          AsyncStorage.setItem('homeUpdated', 'false');
        }
      });
    }, [navigation])
  );

  // User
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState(null);
  const [formattedUserData, setFormattedUserData] = useState({
    prenom: '',
    establishment: '',
    avatarURL: '', 
  });

  useEffect(() => {
    setLoadingUser(true);
    IndexData.getUser().then((data) => {
      setFormattedUserData({
        prenom: data.name.split(' ')[data.name.split(' ').length - 1],
        establishment: data.establishment,
        avatarURL: data.profile_picture,
      });

      setUser(data);
      setLoadingUser(false);
    });
  }, []);

  // Homeworks
  const [homeworks, setHomeworks] = useState([]);
  const [loadingHw, setLoadingHw] = useState(true);

  useEffect(() => {
    // get today date
    const today = new Date();

    // get date in 1 week
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // force update
    let force = false;

    if (refreshCount > 0) {
      force = true;
    }

    // loading
    setLoadingHw(true)

    IndexData.getHomeworks(today, force, nextWeek).then((data) => {
      const groupedHomeworks = {};

      data.forEach((homework) => {
        const homeworkDate = new Date(homework.date);
        homeworkDate.setHours(0, 0, 0, 0);

        const formattedDate =
          homeworkDate.getDate() === today.getDate() + 1
            ? 'demain'
            : new Date(homeworkDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              });

        if (!groupedHomeworks[formattedDate]) {
          groupedHomeworks[formattedDate] = {
            date: homeworkDate,
            formattedDate: formattedDate,
            homeworks: [],
          };
        }

        groupedHomeworks[formattedDate].homeworks.push(homework);
      });

      // Convert the groupedHomeworks object into an array
      const result = Object.values(groupedHomeworks);

      // Sort the array by date
      result.sort((a, b) => a.date - b.date);

      // set homeworks
      setHomeworks(result);

      // loading
      setLoadingHw(false);
    });
  }, [refreshCount]);

  // Cours
  const [timetable, setTimetable] = useState([]);
  const [loadingCours, setLoadingCours] = useState(true);

  useEffect(() => {
    // get today date
    const today = new Date();
    
    // loading
    setLoadingCours(true);

    let force = false;

    if (refreshCount > 0) {
      force = true;
    }
    
    IndexData.getTimetable(today, force).then((data) => {
      setTimetable(data);
      setLoadingCours(false);
    });
  }, [refreshCount]);

  // change header text and size
  React.useLayoutEffect(() => {
    navigation.setOptions({
      header: (props) => (
        <HomeHeader
          props={props}
          user={user}
          timetable={timetable}
          navigation={navigation}
        />
      ),
    });
  }, [navigation, timetable, user]);

  // page
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: UIColors.background }]}
      contentInsetAdjustmentBehavior='automatic'

      refreshControl={
        <RefreshControl
          progressViewOffset={28}
          refreshing={refreshing}
          colors={[Platform.OS == 'android' ? UIColors.primary : null]}
          onRefresh={() => {
            setRefreshing(true);
            setTimeout(() => {
              setRefreshCount(refreshCount + 1);
            }, 500);
            setTimeout(() => {
              setRefreshing(false);
            }, 1000);
          }}
        />
      }
    >
      <View style={{height: 32}} />

      <TabsElement navigation={navigation} theme={theme} UIColors={UIColors} />

      <CoursElement cours={timetable} theme={theme} UIColors={UIColors} navigation={navigation} loading={loadingCours} />

      <DevoirsElement homeworks={homeworks} theme={theme} UIColors={UIColors} navigation={navigation} loading={loadingHw} />

      <View style={{height: 50}} />
    </ScrollView>
  )
};

const TabsElement = ({ navigation, theme, UIColors }) => {
  return (
    <View style={[styles.tabs.tabsContainer]}>
        <View style={[styles.tabs.tabRow]}>
          <ContextMenuView style={{flex: 1}}>
            <PressableScale
              style={[styles.tabs.tab, { backgroundColor: UIColors.element }]}
              weight="light"
              activeScale={0.9}
              onPress={() => navigation.navigate('InsetSchoollife')}
            >
              <Gavel size={24} color={theme.dark ? '#ffffff' : '#000000'} />
              <Text style={[styles.tabs.tabText]}>Vie scolaire</Text>
            </PressableScale>
          </ContextMenuView>
          <ContextMenuView style={{flex: 1}}>
            <PressableScale
              style={[styles.tabs.tab, { backgroundColor: UIColors.element }]}
              weight="light"
              activeScale={0.9}
              onPress={() => navigation.navigate('InsetNews')}
            >
              <Newspaper size={24} color={theme.dark ? '#ffffff' : '#000000'} />
              <Text style={[styles.tabs.tabText]}>Actualités</Text>
            </PressableScale>
          </ContextMenuView>
        </View>
        <View style={[styles.tabs.tabRow]}>
          <ContextMenuView style={{flex: 1}}>
            <PressableScale
              style={[styles.tabs.tab, { backgroundColor: UIColors.element }]}
              weight="light"
              activeScale={0.9}
              onPress={() => navigation.navigate('InsetConversations')}
            >
              <MessagesSquare
                size={24}
                color={theme.dark ? '#ffffff' : '#000000'}
              />
              <Text style={[styles.tabs.tabText]}>Conversations</Text>
            </PressableScale>
          </ContextMenuView>
          <ContextMenuView style={{flex: 1}}>
            <PressableScale
              style={[styles.tabs.tab, { backgroundColor: UIColors.element }]}
              weight="light"
              activeScale={0.9}
              onPress={() => navigation.navigate('InsetEvaluations')}
            >
              <CheckCircle size={24} color={theme.dark ? '#ffffff' : '#000000'} />
              <Text style={[styles.tabs.tabText]}>Compétences</Text>
            </PressableScale>
          </ContextMenuView>
        </View>
      </View>
  )
}

const CoursElement = ({ cours, theme, UIColors, navigation, loading }) => {
  return (
    !loading ? (
      <PapillonList inset title="Emploi du temps" style={styles.cours.container}>
        {cours.map((day, index) => (
          <View key={index}>
            <CoursItem key={index} index={index} cours={day} day={cours} theme={theme} UIColors={UIColors} navigation={navigation} />
          </View>
        ))}
      </PapillonList>
    ) : (
      <PapillonList inset title="Emploi du temps" style={styles.cours.container}>
        <View style={styles.loading.container}>
          <ActivityIndicator />
          <Text style={styles.loading.text}>Chargement de l'emploi du temps...</Text>
        </View>
      </PapillonList>
    )
  )
}

const CoursItem = ({ cours, day, theme, UIColors, navigation, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.elastic(1),
      useNativeDriver: true,
      delay: index * 50,
    }).start();
  });

  function lz(nb) {
    return nb < 10 ? `0${nb}` : nb.toString();
  }

  return (
    <>
      {day[index - 1] && new Date(cours.start) - new Date(day[index - 1].end) > 1800000 ? (
        <Animated.View
          style={[
            styles.cours.separator,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                },
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }
              ],
            }
          ]}
        >
          <View style={[styles.cours.separatorLine, { backgroundColor: UIColors.text + '15' }]} />

          <Text style={{ color: UIColors.text + '30' }}>
            {`${Math.floor((new Date(cours.start) - new Date(day[index - 1].end)) / 3600000)} h ${lz(Math.floor(((new Date(cours.start) - new Date(day[index - 1].end)) % 3600000) / 60000))} min`}
          </Text>
          
          <View style={[styles.cours.separatorLine, { backgroundColor: UIColors.text + '15' }]} />
        </Animated.View>
      ) : null}

      <ContextMenuView
        style={{ flex: 1 }}
        borderRadius={14}
        previewConfig={{
          borderRadius: 12,
          backgroundColor: UIColors.element,
        }}
        menuConfig={{
          menuTitle: cours.subject.name,
          menuItems: [
            {
              actionKey  : 'open',
              actionTitle: 'Voir le cours en détail',
              icon: {
                type: 'IMAGE_SYSTEM',
                imageValue: {
                  systemName: 'book.pages',
                },
              },
            },
          ],
        }}
        onPressMenuItem={({nativeEvent}) => {
          if (nativeEvent.actionKey === 'open') {
            navigation.navigate('Lesson', { event: cours })
          }
        }}
        onPressMenuPreview={() => {
          navigation.navigate('Lesson', { event: cours })
        }}
      >
      <Animated.View
        style={[
          styles.homeworks.devoirsDay.container,
          {
            // Bind opacity to animated value
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              },
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })
              }
            ],
          },
        ]}
      >
      <TouchableHighlight
        style={styles.cours.item.container}
        underlayColor={UIColors.text + '12'}
        onPress={() => navigation.navigate('Lesson', { event: cours })}
      >
        <>
          <View style={styles.cours.item.time.container}>
            <Text style={styles.cours.item.time.start}>
              {new Date(cours.start).toLocaleTimeString('fr-FR', {
                hour: 'numeric',
                minute: 'numeric',
              })}
            </Text>
            <Text style={styles.cours.item.time.end}>
              {new Date(cours.end).toLocaleTimeString('fr-FR', {
                hour: 'numeric',
                minute: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.cours.item.color, {backgroundColor: getClosestCourseColor(cours.subject.name)}]} />
          <View style={styles.cours.item.data.container}>
            <Text style={[styles.cours.item.data.subject]}>
              {formatCoursName(cours.subject.name)}
            </Text>
            <Text style={[styles.cours.item.data.teachers]}>
              {cours.teachers.join(', ')}
            </Text>
            <Text style={[styles.cours.item.data.room]}>
              {cours.rooms.join(', ')}
            </Text>

            { cours.status ? (
              <Text style={[styles.cours.item.data.status, {backgroundColor: getClosestCourseColor(cours.subject.name) + '22', color: getClosestCourseColor(cours.subject.name)}]}>
                {cours.status}
              </Text>
            ) : null }

          </View>
        </>
      </TouchableHighlight>
      </Animated.View>
      </ContextMenuView>
    </>
  );
}

const DevoirsElement = ({ homeworks, theme, UIColors, navigation, loading }) => {
  return (
    !loading ? (
      <PapillonList inset title="Travail à faire" style={[styles.homeworks.devoirsElement.container]}>
        {homeworks.map((day, index) => (
          <DevoirsDay key={index} index={index} homeworks={day} theme={theme} UIColors={UIColors} navigation={navigation} />
        ))}
      </PapillonList>
    ) : (
      <PapillonList inset title="Travail à faire" style={[styles.homeworks.devoirsElement.container]}>
        <View style={styles.loading.container}>
          <ActivityIndicator />
          <Text style={styles.loading.text}>Chargement des devoirs...</Text>
        </View>
      </PapillonList>
    )
  );
}

const DevoirsDay = ({ homeworks, theme, UIColors, navigation, index }) => {
  // sort homeworks by index
  homeworks.homeworks.sort((a, b) => a.index - b.index);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.elastic(1),
      useNativeDriver: true,
      delay: index * 150,
    }).start();
  });

  const parentIndex = index;

  return (
    <Animated.View
      style={[
        styles.homeworks.devoirsDay.container,
        {
          // Bind opacity to animated value
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            },
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })
            }
          ],
        },
      ]}
    >

      <View
        style={[styles.homeworks.devoirsDay.header.container, { backgroundColor: UIColors.primary + '22' }]}
      >
        <Text
          style={[
            styles.homeworks.devoirsDay.header.title,
            { color: UIColors.primary }
          ]}
        >
          pour {homeworks.formattedDate}
        </Text>
      </View>

      <View style={styles.homeworks.devoirsDay.content}>
        { homeworks.homeworks.map((homework, index) => (
          <DevoirsContent key={index} index={index} parentIndex={parentIndex} homework={homework} theme={theme} UIColors={UIColors} navigation={navigation} />
        ))}
      </View>
    </Animated.View>
  );
}

const DevoirsContent = ({ homework, theme, UIColors, navigation, index, parentIndex }) => {
  const [checkLoading, setCheckLoading] = useState(false);
  const [checked, setChecked] = useState(homework.done);

  const checkThis = () => {
    // définir le loading
    setCheckLoading(true);

    IndexData.changeHomeworkState(homework.date, homework.local_id).then((result) => {
      console.log(result);

      setCheckLoading(false);

      if (result.status === 'not found') {
        return;
      }
      else if (result.status === 'ok') {
        setChecked(!checked);
      }
    });
  }

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.elastic(1),
      useNativeDriver: true,
      delay: (index * 50) + (parentIndex * 150) + 100,
    }).start();
  });

  return (
    <ContextMenuView
      style={{ flex: 1 }}
      borderRadius={14}
      previewConfig={{
        borderRadius: 12,
        backgroundColor: UIColors.element,
      }}
      menuConfig={{
        menuTitle: homework.subject.name,
        menuItems: [
          {
            actionKey  : 'open',
            actionTitle: 'Voir le devoir en détail',
            icon: {
              type: 'IMAGE_SYSTEM',
              imageValue: {
                systemName: 'book.pages',
              },
            },
          },
          {
            actionKey  : 'check',
            actionTitle: 'Marquer comme fait',
            menuState  : checked ? 'on' : 'off',
            icon: {
              type: 'IMAGE_SYSTEM',
              imageValue: {
                systemName: 'checkmark.circle',
              },
            },
          },
          homework.files.length > 0 ? {
            actionKey  : 'files',
            actionTitle: 'Ouvrir la pièce jointe',
            actionSubtitle: homework.files[0].name,
            icon: {
              type: 'IMAGE_SYSTEM',
              imageValue: {
                systemName: 'paperclip',
              },
            },
          } : null,
        ],
      }}
      onPressMenuItem={({nativeEvent}) => {
        if (nativeEvent.actionKey === 'open') {
          navigation.navigate('Devoir', { homework: {... homework, done: checked}});
        }
        else if (nativeEvent.actionKey === 'check') {
          checkThis();
        }
        else if (nativeEvent.actionKey === 'files') {
          openURL(homework.files[0].url);
        }
      }}
      onPressMenuPreview={() => {
        navigation.navigate('Devoir', { homework: {... homework, done: checked}});
      }}
    >
    <Animated.View
      style={[
        {
          // Bind opacity to animated value
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            },
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })
            }
          ],
        },
      ]}
      >
      <TouchableHighlight
        style={[styles.homeworks.devoirsContent.container]}
        underlayColor={UIColors.text + '12'}
        onPress={() => navigation.navigate('Devoir', { homework: {... homework, done: checked} })}
      >
        <View style={styles.homeworks.devoirsContent.inner}>
          <HwCheckbox checked={checked} theme={theme} pressed={() => {checkThis()}} UIColors={UIColors} loading={checkLoading} />
          <View style={styles.homeworks.devoirsContent.parent}>
            <View style={styles.homeworks.devoirsContent.header.container}>
              <View style={styles.homeworks.devoirsContent.header.subject.container}>
                <View style={[styles.homeworks.devoirsContent.header.subject.color, {backgroundColor: getClosestCourseColor(homework.subject.name)}]} />
                <Text style={[styles.homeworks.devoirsContent.header.subject.title, { color: UIColors.text }]}>{formatCoursName(homework.subject.name)}</Text>
              </View>
            </View>
            { !checked ?
              <View style={styles.homeworks.devoirsContent.content.container}>
                <Text style={[styles.homeworks.devoirsContent.content.description, { color: UIColors.text }]}>{homework.description}</Text>
              </View>
            : null }
            { homework.files.length > 0 && (
              <View style={styles.homeworks.devoirsContent.footer.container}>
                <View style={styles.homeworks.devoirsContent.footer.files.container}>
                  { homework.files.map((file, index) => (
                    <PressableScale
                      key={index}
                      style={[
                        styles.homeworks.devoirsContent.footer.files.file.container,
                        { backgroundColor: UIColors.text + '12' }
                      ]}
                      onPress={() => openURL(file.url)}
                    >
                      <DownloadCloud size={22} color={UIColors.text} />
                      <Text style={styles.homeworks.devoirsContent.footer.files.file.text} numberOfLines={1}>{file.name}</Text>
                    </PressableScale>
                  ))}
                </View>
                <View style={styles.homeworks.devoirsContent.footer.done}>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableHighlight>
    </Animated.View>
    </ContextMenuView>
  );
}

function HwCheckbox({ checked, theme, pressed, UIColors, loading }) {
  return (
    !loading ? (
      <PressableScale
        style={[
          styles.checkbox.checkContainer,
          { borderColor: theme.dark ? '#333333' : '#c5c5c5' },
          checked ? styles.checkbox.checkChecked : null,
          checked ? {backgroundColor: UIColors.primary, borderColor: UIColors.primary} : null,
        ]}
        weight="light"
        activeScale={0.7}
        onPress={() => {
          pressed()
        }}
      >
        {checked ? <Check size={20} color="#ffffff" /> : null}
      </PressableScale>
    ) : (
      <ActivityIndicator size={26} />
    )
  );
}

const lightenDarkenColor = (color, amount) => {
  let colorWithoutHash = color.replace('#', '');
  if (colorWithoutHash.length === 3) {
    colorWithoutHash = colorWithoutHash
      .split('')
      .map((c) => `${c}${c}`)
      .join('');
  }

  const getColorChannel = (substring) => {
    let colorChannel = parseInt(substring, 16) + amount;
    colorChannel = Math.max(Math.min(255, colorChannel), 0).toString(16);

    if (colorChannel.length < 2) {
      colorChannel = `0${colorChannel}`;
    }

    return colorChannel;
  };

  const colorChannelRed = getColorChannel(colorWithoutHash.substring(0, 2));
  const colorChannelGreen = getColorChannel(colorWithoutHash.substring(2, 4));
  const colorChannelBlue = getColorChannel(colorWithoutHash.substring(4, 6));

  return `#${colorChannelRed}${colorChannelGreen}${colorChannelBlue}`;
};

function NextCours({ cours, navigation }) {
  const [time, setTime] = React.useState('...');

  const lz = (number) => (number < 10 ? `0${number}` : number);

  const calculateTimeLeft = (date) => {
    const now = new Date();
    const start = new Date(date);
    const diff = start - now;

    if (diff > 0) {
      const diffMinutes = Math.floor(diff / 1000 / 60);
      const diffSeconds = Math.floor((diff / 1000) % 60);

      if (diffMinutes < 60) {
        return `dans ${lz(diffMinutes)}:${lz(diffSeconds)}`;
      }

      return `ds. ${Math.ceil((diffMinutes / 60) - 1)}h ${lz(diffMinutes % 60)} mn`;
    }
    return 'maintenant';
  };

  React.useEffect(() => {
    const start = new Date(cours.start);
    setTime(calculateTimeLeft(start));

    const interval = setInterval(() => {
      setTime(calculateTimeLeft(start));
    }, 1000);
    return () => clearInterval(interval);
  }, [cours.start]);

  const openCours = () => {
    navigation.navigate('Lesson', { event: cours });
  };

  const isTimeSet = time !== '...';

  return (
    cours && (
      <PressableScale
        style={[
          nextCoursStyles.nextCoursContainer,
          { backgroundColor: getClosestCourseColor(cours.subject.name) },
        ]}
        onPress={openCours}
      >
        <View style={nextCoursStyles.nextCoursLeft}>
          <View style={nextCoursStyles.nextCoursEmoji}>
            <Text style={nextCoursStyles.nextCoursEmojiText}>
              {getClosestGradeEmoji(cours.subject.name)}
            </Text>
          </View>
          <View style={nextCoursStyles.nextCoursLeftData}>
            <Text numberOfLines={1} style={nextCoursStyles.nextCoursLeftDataText}>
              {formatCoursName(cours.subject.name)}
            </Text>

            {cours.status === null ? (
              <Text numberOfLines={1} style={nextCoursStyles.nextCoursLeftDataTextRoom}>
                salle {cours.rooms[0]} - avec {cours.teachers[0]}
              </Text>
            ) : (
              <Text numberOfLines={1} style={nextCoursStyles.nextCoursLeftDataTextRoom}>
                {cours.status} - salle {cours.rooms[0]} - avec{' '}
                {cours.teachers[0]}
              </Text>
            )}
          </View>
        </View>
        <View style={nextCoursStyles.nextCoursRight}>
          <Text numberOfLines={1} style={nextCoursStyles.nextCoursRightTime}>
            à{' '}
            {new Date(cours.start).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          {isTimeSet ? (
            <Text numberOfLines={1} style={nextCoursStyles.nextCoursRightDelay}>
              {time}
            </Text>
          ) : (
            <Text numberOfLines={1} style={nextCoursStyles.nextCoursRightDelay}>
              fin{' '}
              {new Date(cours.end).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      </PressableScale>
    )
  );
}

function getNextCours(classes) {
  if (!classes || classes.length === 0) {
    return {
      next: null,
      nextClasses: [],
    };
  }

  const now = new Date();

  const activeClasses = classes.filter((classInfo) => !classInfo.is_cancelled);

  let currentOrNextClass = null;
  let minTimeDiff = Infinity;

  for (const classInfo of activeClasses) {
    const startTime = new Date(classInfo.start);
    const endTime = new Date(classInfo.end);

    if (startTime <= now && now <= endTime) {
      currentOrNextClass = classInfo;
      break; // Found the current class, no need to continue
    } else if (startTime > now) {
      const timeDiff = startTime - now;

      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        currentOrNextClass = classInfo;
      }
    }
  }

  if (currentOrNextClass === null) {
    return {
      next: null,
      nextClasses: [],
    };
  }

  const nextClasses = activeClasses.filter((classInfo) => {
    const startTime = new Date(classInfo.start);
    return startTime > new Date(currentOrNextClass.start);
  });

  return {
    next: currentOrNextClass,
    nextClasses,
  };
}

function HomeHeader({ navigation, timetable, user }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [nextCourse, setNextCourse] = React.useState(null);
  const [leftCourses, setLeftCourses] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const isFocused = useIsFocused();

  React.useEffect(() => {
    const fetchNextCourses = () => {
      if (timetable !== null) {
        const { next, nextClasses } = getNextCours(timetable);
        setNextCourse(next);
        setLeftCourses(nextClasses);
        setLoading(false);
      }
    };

    fetchNextCourses();
    const interval = setInterval(fetchNextCourses, 2000);
    return () => clearInterval(interval);
  }, [timetable]);

  const getColorCoursBg = (color) =>
    lightenDarkenColor(getClosestCourseColor(color), -20);

  const getPrenom = (name) => {
    const words = name.split(' ');
    const prenom = words[words.length - 1];

    return prenom;
  };

  const getFormulePolitesse = () => {
    const date = new Date();
    const hours = date.getHours();
    if(hours > 17) {
      return "Bonsoir"
    } else {
      return "Bonjour"
    }
  }

  const openProfile = () => {
    if (user) {
      navigation.navigate('Profile', { isModal: true });
    }
  };

  const openNextCours = () => {
    if (nextCourse && nextCourse.id !== null) {
      navigation.navigate('Lesson', { event: nextCourse });
    } else {
      navigation.navigate('CoursHandler');
    }
  };

  const UIColors = GetUIColors();

  return (
    <View
      style={[
        headerStyles.header,
        {
          backgroundColor: nextCourse
            ? getColorCoursBg(nextCourse.subject.name)
            : UIColors.primaryBackground,
          paddingTop: insets.top + 13,
          borderColor: theme.dark ? '#ffffff15' : '#00000032',
          borderBottomWidth: 1,
        },
      ]}
    >
      {isFocused ? (
        <StatusBar barStyle="light-content" backgroundColor="transparent" />
      ) : null}

      <View style={headerStyles.headerContainer}>
        <Text style={[headerStyles.headerNameText]}>
          {getFormulePolitesse()}{user ? `, ${getPrenom(user.name)} !` : ' !'}
        </Text>
        <Text style={[headerStyles.headerCoursesText]}>
          {timetable && leftCourses && leftCourses.length > 0
            ? `Il te reste ${leftCourses.length + 1} cours dans ta journée.`
            : "Tu n'as aucun cours restant aujourd'hui."}
        </Text>

        {user && user.profile_picture !== null && (
          <TouchableOpacity
            style={[headerStyles.headerPfpContainer]}
            onPress={openProfile}
          >
            <Image
              source={{ uri: user.profile_picture }}
              style={[headerStyles.headerPfp]}
            />
          </TouchableOpacity>
        )}
      </View>

      {nextCourse && nextCourse.id !== null && (
        <NextCours cours={nextCourse} navigation={navigation} />
      )}

      {!loading && !nextCourse ? (
        <PressableScale
          style={[
            headerStyles.nextCoursContainer,
            { backgroundColor: UIColors.elementHigh },
            headerStyles.nextCoursLoading,
          ]}
          onPress={openNextCours}
        >
          <Text style={[headerStyles.nextCoursLoadingText]}>
            Pas de prochain cours
          </Text>
        </PressableScale>
      ) : loading ? (
        <PressableScale
          style={[
            headerStyles.nextCoursContainer,
            { backgroundColor: UIColors.elementHigh },
            headerStyles.nextCoursLoading,
          ]}
        >
          <ActivityIndicator size={12} />
          <Text style={[headerStyles.nextCoursLoadingText]}>
            Chargement du prochain cours
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    container: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      marginVertical: 12,
    },
    text: {
      fontSize: 15,
      opacity: 0.5,
    },
  },

  homeworks: {
    devoirsElement: {
      container: {
        paddingVertical: 8,

        borderRadius: 12,
        borderCurve: 'continuous',

        overflow: 'hidden',
      },
    },
    devoirsDay: {
      container: {
        flex: 1,
        marginTop: 5,
      },
      header: {
        container: {
          paddingHorizontal: 16,
          paddingVertical: 6,
          alignSelf: 'flex-start',
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
        },
        title: {
          fontSize: 15,
          fontFamily: 'Papillon-Semibold',
        },
      },
      content: {
        paddingTop: 5,
      },
    },
    devoirsContent: {
      container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        flex: 1,
      },
      inner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      parent: {
        flex: 1,
        paddingHorizontal: 14,
        gap: 6,
      },
      header: {
        container: {},
        subject: {
          container: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          },
          color: {
            width: 10,
            height: 10,
            borderRadius: 8,
          },
          title: {
            fontSize: 16,
            fontFamily: 'Papillon-Semibold',
          },
        }
      },
      content: {
        container: {},
        description: {
          fontSize: 15,
        },
      },
      footer: {
        container: {
          marginTop: 4,
        },
        files: {
          container: {},
          file: {
            container: {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 8,
            },
            text: {
              fontSize: 15,
              fontFamily: 'Papillon-Semibold',
            },
          },
        },
        done: {

        },
      },
    },
  },

  checkbox: {
    checkContainer: {
      width: 26,
      height: 26,
      borderRadius: 16,
      borderCurve: 'continuous',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
  
      borderWidth: 1,
    },
    checkChecked: {
      backgroundColor: '#159C5E',
      borderColor: '#159C5E',
    },
  },

  cours: {
    container: {
      paddingVertical: 6,
      overflow: 'hidden',
      gap: 0,
    },
    item: {
      container: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        flex: 1,
        flexDirection: 'row',
        gap: 12,
        marginTop: -4,
      },
      time: {
        container: {
          width: 50,
          justifyContent: 'space-between',
        },
        start: {
          textAlign: 'right',
          fontWeight: 600,
        },
        end: {
          textAlign: 'right',
          opacity: 0.5,
        },
      },
      color: {
        width: 5,
        height: '100%',
        borderRadius: 8,
      },
      data: {
        container: {
          flex: 1,
        },
        subject: {
          fontSize: 16,
          fontFamily: 'Papillon-Semibold',
          marginBottom: 8,
        },
        teachers: {
          opacity: 0.5,
        },
        room: {
          fontWeight: 500,
        },
        status: {
          fontWeight: 500,
          marginTop: 8,
          alignSelf: 'flex-start',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          overflow: 'hidden',
        },
      },
    },
    separator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 2,
      marginHorizontal: 12,
      marginBottom: 2,
    },
    separatorLine: {
      flex: 1,
      height: 2,
      borderRadius:3,
    },
  },

  tabs: {
    tabsContainer: {
      marginTop: 24,
      marginHorizontal: 16,
      gap: 6,
      marginBottom: 16,
    },
    tabRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
    },
  
    tab: {
      borderRadius: 12,
      borderCurve: 'continuous',
  
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 5,
  
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 0.5,
      },
      shadowOpacity: 0.15,
      shadowRadius: 1,
  
      elevation: 0,
    },
  
    tabText: {
      fontSize: 15,
      fontFamily: 'Papillon-Semibold',
    },
  }
});

const headerStyles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#29947A',

    elevation: 1,
  },

  ListTitle: {
    paddingLeft: 16,
    fontSize: 15,
    fontFamily: 'Papillon-Medium',
    opacity: 0.5,

    marginTop: 24,
    width: '92%',
  },

  headerContainer: {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',

    width: '92%',
  },

  headerNameText: {
    fontSize: 17,
    fontFamily: 'Papillon-Medium',
    color: '#ffffff',
    opacity: 0.6,
    maxWidth: '85%',
  },
  headerCoursesText: {
    fontSize: 20,
    fontFamily: 'Papillon-Regular',
    color: '#ffffff',
    marginTop: 6,
    marginBottom: 2,
    letterSpacing: -0.1,
    maxWidth: '85%',
  },

  nextCoursContainer: {
    width: '92%',
    height: 68,
    borderRadius: 12,
    borderCurve: 'continuous',

    marginTop: 2,
    marginBottom: -32,

    borderWidth: 0,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,

    elevation: 3,

    flexDirection: 'row',
  },

  nextCoursLoading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  nextCoursLoadingText: {
    fontSize: 15,
    opacity: 0.5,
  },

  nextCoursLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',

    paddingHorizontal: 14,
    paddingVertical: 12,

    gap: 14,
  },
  nextCoursEmoji: {
    width: 42,
    height: 42,
    borderRadius: 24,
    backgroundColor: '#ffffff10',
    borderColor: '#ffffff25',
    borderWidth: 1,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextCoursEmojiText: {
    fontSize: 22,
  },

  nextCoursLeftData: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 2,
    flex: 1,
  },
  nextCoursLeftDataText: {
    fontSize: 18,
    fontFamily: 'Papillon-Semibold',
    color: '#ffffff',
    flex: 1,
    marginTop: 2,
  },
  nextCoursLeftDataTextRoom: {
    fontSize: 15,
    color: '#ffffff99',
    flex: 1,
  },

  nextCoursRight: {
    width: '35%',

    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',

    paddingHorizontal: 16,
    paddingVertical: 12,

    backgroundColor: '#ffffff10',
    borderLeftWidth: 1,
    borderLeftColor: '#ffffff25',

    gap: 0,

    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  nextCoursRightTime: {
    fontSize: 17,
    fontFamily: 'Papillon-Semibold',
    color: '#ffffff',
    flex: 1,
    marginTop: 3,

    letterSpacing: 0.5,
  },
  nextCoursRightDelay: {
    fontSize: 15,
    color: '#ffffff99',
    flex: 1,
    fontVariant: ['tabular-nums'],
  },

  nextCoursInfo: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextCoursInfoText: {
    fontSize: 15,
    opacity: 0.5,
  },

  nextClassesList: {
    width: '92%',

    borderRadius: 12,
    borderCurve: 'continuous',
  },

  nextClassesListItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,

    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
  },
  nextClassesListItemEmoji: {
    fontSize: 20,
    marginHorizontal: 7,
  },
  nextClassesListItemText: {
    fontSize: 17,
    fontFamily: 'Papillon-Semibold',
    flex: 1,
    marginTop: 2,
  },
  nextClassesListItemTime: {
    fontSize: 15,
    opacity: 0.5,
    marginLeft: 10,
  },

  headerPfpContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  headerPfp: {
    width: 36,
    height: 36,
    borderRadius: 24,
    backgroundColor: '#ffffff10',
    borderColor: '#ffffff25',
    borderWidth: 1,
  },
});

const nextCoursStyles = StyleSheet.create({
  nextCoursContainer: {
    width: '92%',
    height: 68,
    borderRadius: 12,
    borderCurve: 'continuous',

    marginTop: 2,
    marginBottom: -32,

    borderWidth: 0,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,

    elevation: 3,

    flexDirection: 'row',
  },

  nextCoursLoading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  nextCoursLoadingText: {
    fontSize: 15,
    opacity: 0.5,
  },

  nextCoursLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',

    paddingHorizontal: 14,
    paddingVertical: 12,

    gap: 14,
  },
  nextCoursEmoji: {
    width: 42,
    height: 42,
    borderRadius: 24,
    backgroundColor: '#ffffff10',
    borderColor: '#ffffff25',
    borderWidth: 1,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextCoursEmojiText: {
    fontSize: 22,
  },

  nextCoursLeftData: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 2,
    flex: 1,
  },
  nextCoursLeftDataText: {
    fontSize: 18,
    fontFamily: 'Papillon-Semibold',
    color: '#ffffff',
    flex: 1,
    marginTop: 2,
  },
  nextCoursLeftDataTextRoom: {
    fontSize: 15,
    color: '#ffffff99',
    flex: 1,
  },

  nextCoursRight: {
    width: '35%',

    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',

    paddingHorizontal: 16,
    paddingVertical: 12,

    backgroundColor: '#ffffff10',
    borderLeftWidth: 1,
    borderLeftColor: '#ffffff25',

    gap: 0,

    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  nextCoursRightTime: {
    fontSize: 17,
    fontFamily: 'Papillon-Semibold',
    color: '#ffffff',
    flex: 1,
    marginTop: 3,

    letterSpacing: 0.5,
  },
  nextCoursRightDelay: {
    fontSize: 15,
    color: '#ffffff99',
    flex: 1,
    fontVariant: ['tabular-nums'],
  },

  nextCoursInfo: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextCoursInfoText: {
    fontSize: 15,
    opacity: 0.5,
  },
});

export default NewHomeScreen;