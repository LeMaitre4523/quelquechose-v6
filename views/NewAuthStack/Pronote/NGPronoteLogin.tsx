import React from 'react';

import {
  ScrollView,
  View,
  StyleSheet,
  Platform,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Image, TouchableOpacity,
} from 'react-native';

import * as Haptics from 'expo-haptics';

import {UserCircle, KeyRound, AlertTriangle, Link2, EyeOff, Eye} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { showMessage } from 'react-native-flash-message';
import { useTheme, Text } from 'react-native-paper';

import PapillonButton from '../../../components/PapillonButton';
import NativeList from '../../../components/NativeList';
import NativeItem from '../../../components/NativeItem';

import AlertBottomSheet from '../../../interface/AlertBottomSheet';

import GetUIColors from '../../../utils/GetUIColors';
import { useAppContext } from '../../../utils/AppContext';

import {
  getPronoteInstanceInformation,
  defaultPawnoteFetcher,
  authenticatePronoteCredentials,
  PronoteApiAccountId,
} from 'pawnote';
import { AsyncStoragePronoteKeys } from '../../../fetch/PronoteData/connector';

type PronoteInstanceInformation = Awaited<
  ReturnType<typeof getPronoteInstanceInformation>
>;

function NGPronoteLogin({ route, navigation }: {
  navigation: any; // TODO
  route: {
    params: {
      instanceURL: string
    }
  }
}) {
  const instanceURL = route.params.instanceURL;
  const theme = useTheme();

  const [errorAlert, setErrorAlert] = React.useState(false);
  const [stringErrorAlert, setStringErrorAlert] = React.useState(false);
  const [urlAlert, setURLAlert] = React.useState(false);
  const [instanceDetails, setInstanceDetails] = React.useState<PronoteInstanceInformation | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const details = await getPronoteInstanceInformation(
          defaultPawnoteFetcher,
          {
            pronoteURL: instanceURL,
          }
        );

        setInstanceDetails(details);
      } catch {
        try {
          const newInstanceURL = instanceURL.replace(
            'index-education.net',
            'pronote.toutatice.fr'
          );
          const details2 = await getPronoteInstanceInformation(
            defaultPawnoteFetcher,
            {
              pronoteURL: newInstanceURL,
            }
          );

          setInstanceDetails(details2);
        } catch {
          setInstanceDetails(null);
          setURLAlert(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    })();
  }, [instanceURL]);

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [connecting, setConnecting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(true);

  const appContext = useAppContext();
  const UIColors = GetUIColors();

  const makeUUID = (): string => {
    let dt = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      (c) => {
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  };

  const handleLogin = async () => {
    if (username.trim() === '' || password.trim() === '') {
      setStringErrorAlert(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setConnecting(true);

      const pronoteURL = instanceDetails!.pronoteRootURL;
      const deviceUUID = makeUUID();

      const pronote = await authenticatePronoteCredentials(pronoteURL, {
        username,
        password,
        accountTypeID: PronoteApiAccountId.Student,
        deviceUUID,
      });

      await AsyncStorage.multiSet([
        [AsyncStoragePronoteKeys.NEXT_TIME_TOKEN, pronote.nextTimeToken],
        [
          AsyncStoragePronoteKeys.ACCOUNT_TYPE_ID,
          pronote.accountTypeID.toString(),
        ],
        [AsyncStoragePronoteKeys.INSTANCE_URL, pronote.pronoteRootURL],
        [AsyncStoragePronoteKeys.USERNAME, pronote.username],
        [AsyncStoragePronoteKeys.DEVICE_UUID, deviceUUID],
      ]);

      setConnecting(false);

      showMessage({
        message: 'Connecté avec succès',
        type: 'success',
        icon: 'auto',
      });

      await appContext.dataProvider!.init('pronote', pronote);
      await AsyncStorage.setItem('service', 'pronote');

      navigation.goBack();
      navigation.goBack();
      appContext.setLoggedIn(true);
    } catch {
      setConnecting(false);
      setErrorAlert(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <>
      <LinearGradient
        colors={[UIColors.modalBackground, UIColors.modalBackground + '00']}
        locations={[0, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 100,
          zIndex: 9999,
        }}
      />
      <ScrollView style={{ backgroundColor: UIColors.modalBackground }}>
        <AlertBottomSheet
          title="Échec de la connexion"
          subtitle="Vérifiez vos identifiants et réessayez."
          visible={errorAlert}
          icon={<AlertTriangle />}
          cancelAction={() => setErrorAlert(false)}
        />

        <AlertBottomSheet
          title="Échec de la connexion"
          subtitle="Veuillez remplir tous les champs."
          visible={stringErrorAlert}
          icon={<AlertTriangle />}
          cancelAction={() => setStringErrorAlert(false)}
        />

        <AlertBottomSheet
          visible={urlAlert}
          title="Erreur de connexion"
          subtitle="Imposible de se connecter à cette instance."
          icon={<Link2 />}
          cancelAction={() => setURLAlert(false)}
        />

        {Platform.OS === 'ios' ? (
          <StatusBar animated barStyle="light-content" />
        ) : (
          <StatusBar
            animated
            barStyle={theme.dark ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
          />
        )}

        {Platform.OS === 'android' ? <View style={{ height: 24 }} /> : null}

        <View style={styles.loginHeader}>
          <Image
            style={styles.loginHeaderLogo}
            source={require('../../../assets/logo_pronote.png')}
          />
          <Text style={styles.loginHeaderText}>
            {instanceDetails?.schoolName}
          </Text>

          <Text style={styles.loginHeaderDescription}>
            Identifiants PRONOTE
          </Text>
        </View>

        {Platform.OS === 'android' ? <View style={{ height: 15 }} /> : null}

        <NativeList inset>
          <NativeItem
            leading={
              <UserCircle
                color={theme.dark ? '#fff' : '#000'}
                style={{ opacity: 0.5 }}
              />
            }
          >
            <TextInput
              placeholder="Identifiant"
              placeholderTextColor={theme.dark ? '#ffffff55' : '#00000055'}
              style={[styles.nginput, { color: UIColors.text }]}
              value={username}
              onChangeText={(text) => setUsername(text)}
            />
          </NativeItem>
          <NativeItem
            leading={
              <KeyRound
                color={theme.dark ? '#fff' : '#000'}
                style={{ opacity: 0.5 }}
              />
            }
            trailing={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <Eye color={theme.dark ? '#fff' : '#000'} style={{ opacity: 0.5 }} />
                ):(
                  <EyeOff color={theme.dark ? '#fff' : '#000'} style={{ opacity: 0.5 }}/>
                )}
              </TouchableOpacity>
            }
          >
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor={theme.dark ? '#ffffff55' : '#00000055'}
              style={[styles.nginput, { color: UIColors.text }]}
              value={password}
              secureTextEntry={showPassword}
              onChangeText={(text) => setPassword(text)}
            />
          </NativeItem>
        </NativeList>

        <View
          style={[
            styles.loginForm,
            Platform.OS !== 'ios' && styles.loginFormAndroid,
          ]}
        >
          <View style={[styles.buttons]}>
            <PapillonButton
              color="#159C5E"
              title="Se connecter"
              style={styles.button}
              onPress={() => handleLogin()}
              
              left={void 0}
              light={void 0}
              right={connecting ? <ActivityIndicator color="#ffffff" /> : void 0}
            />
          </View>

          {Platform.OS === 'android' ? <View style={{ height: 15 }} /> : null}

          <View style={[styles.bottomText]}>
            <Text style={[styles.bottomTextText]}>
              En vous connectant, vous acceptez les{' '}
              <Text style={{ fontWeight: 'bold' }}>
                conditions d'utilisation
              </Text>{' '}
              de Papillon.
            </Text>

            <Text style={[styles.bottomTextText]}>
              Pronote version {instanceDetails?.version ?? 'inconnue'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loginHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
    paddingHorizontal: 28,
    paddingBottom: 18,
  },
  loginHeaderLogo: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  loginHeaderText: {
    fontSize: 18,
    fontFamily: 'Papillon-Semibold',
    marginTop: 16,
    textAlign: 'center',
  },
  loginHeaderDescription: {
    fontSize: 15,
    marginTop: 2,
    opacity: 0.5,
    textAlign: 'center',
  },
  loginHeaderError: {
    fontSize: 15,
    marginTop: 10,
    color: '#159C5E',
    fontWeight: 500,
    textDecorationLine: 'underline',
  },

  loginForm: {
    marginTop: -10,
  },
  loginFormAndroid: {
    marginTop: 0,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 13,
  },
  loginGroup: {
    marginHorizontal: 14,
    marginVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  loginTextInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 16,
  },
  loginTextInputText: {
    fontSize: 15,
    flex: 1,
  },
  loginGroupIcon: {
    opacity: 0.5,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 15,
    gap: 8,
  },
  button: {
    marginTop: 8,
    flex: 1,
  },

  bottomText: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    gap: 4,
  },

  bottomTextText: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.5,
  },

  nginput: {
    fontSize: 16,
    fontFamily: 'Papillon-Medium',
    paddingVertical: 4,
  },
});

export default NGPronoteLogin;
