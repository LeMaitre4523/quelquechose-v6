import * as React from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Platform } from 'react-native';
import { useTheme, Text } from 'react-native-paper';

import { Settings, User2, Info, Sparkles, Bell } from 'lucide-react-native';

import packageJson from '../package.json';

import ListItem from '../components/ListItem';
import PapillonIcon from '../components/PapillonIcon';

import GetUIColors from '../utils/GetUIColors';

function SettingsScreen({ navigation }: {
  navigation: any // TODO
}) {
  const theme = useTheme();
  const UIColors = GetUIColors();

  return (
    <ScrollView
      style={{ backgroundColor: UIColors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
    >
      {Platform.OS === 'ios' ? (
        <StatusBar animated barStyle="light-content" />
      ) : (
        <StatusBar
          animated
          barStyle={theme.dark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
        />
      )}

      <View style={styles.optionsList}>
        <Text style={styles.ListTitle}>Mon profil</Text>

        <ListItem
          title="Mon profil"
          subtitle="Configurez votre compte Papillon, votre pseudonyme, votre photo de profil..."
          color="#32AB8E"
          left={
            <PapillonIcon
              icon={<User2 size={24} color="#fff" />}
              color="#32AB8E"
              fill
              small
            />
          }
          onPress={() => navigation.navigate('Profile', { isModal: false })}
        />
      </View>

      <View style={styles.optionsList}>
        <Text style={styles.ListTitle}>Options de l'application</Text>

        <ListItem
          title="Réglages"
          subtitle="Paramètres de l'application et des comptes"
          color="#565EA3"
          left={
            <PapillonIcon
              icon={<Settings size={24} color="#fff" />}
              color="#565EA3"
              fill
              small
            />
          }
          onPress={() => navigation.navigate('Settings')}
        />

        <ListItem
          title="Notifications"
          subtitle="Gérer les notifications de l'application"
          color="#A84700"
          left={
            <PapillonIcon
              icon={<Bell size={24} color="#fff" />}
              color="#A84700"
              fill
              small
            />
          }
          onPress={() => navigation.navigate('Notifications')}
        />

        <ListItem
          title="Apparence & fonctionnalités"
          subtitle="Personnaliser et modifier l'apparence de l'application"
          color="#A84700"
          left={
            <PapillonIcon
              icon={<Sparkles size={24} color="#fff" />}
              color="#A84700"
              fill
              small
            />
          }
          onPress={() => navigation.navigate('Appearance')}
        />
      </View>

      <View style={styles.optionsList}>
        <Text style={styles.ListTitle}>A propos</Text>

        <ListItem
          title="A propos de Papillon"
          subtitle={`Papillon version ${packageJson.version} ${packageJson.canal}`}
          color="#888888"
          left={
            <PapillonIcon
              icon={<Info size={24} color="#fff" />}
              color="#888888"
              fill
              small
            />
          }
          onPress={() => navigation.navigate('About')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  optionsList: {
    width: '100%',
    gap: 9,
    marginTop: 21,
    paddingBottom: 2,
  },
  ListTitle: {
    paddingLeft: 29,
    fontSize: 15,
    fontFamily: 'Papillon-Medium',
    opacity: 0.5,
  },
});

export default SettingsScreen;
