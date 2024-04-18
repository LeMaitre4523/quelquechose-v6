import * as React from "react"
import { Platform, ScrollView, StatusBar, View, Text, StyleSheet, Alert, TextInput } from "react-native";

import { useTheme } from 'react-native-paper';
import GetUIColors from '../../../utils/GetUIColors';
import { showMessage } from 'react-native-flash-message';

import { Info, CircleX, ScrollText, CircleAlert, Trash2, Pencil, Check, X, Eye, EyeOff, RefreshCw } from 'lucide-react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PapillonLoading from "../../../components/PapillonLoading";
import moment from "moment"
moment.locale("fr")

function LocalStorageViewScreen({ navigation }) {
    const theme = useTheme();
    const UIColors = GetUIColors();
    const [storage, setStorage] = React.useState([])
    const [storageList, setStorageList] = React.useState({1: false})
    const [storageLoading, setStorageLoading] = React.useState(true)
    async function loadStorage() {
        setStorageLoading(true)
        let keys = await AsyncStorage.getAllKeys()
        let items = await AsyncStorage.multiGet(keys)
        setStorage(items)
        setStorageLoading(false)
        return true;
    }
    React.useEffect(() => {
        loadStorage()
    }, [])
    function RenderItem({ item }) {
        let itemName = item[0]
        let itemValue = item[1]
        let options = entryInfo[itemName]
        let userOptions = storageList[itemName]
        if(!options) {
            if(itemName.includes("cache")) {
                options = {
                    about: null,
                    defaultDisplay: false,
                    warnBeforeDisplay: "Charger cette valeur peut faire planter l'application en raison de sa longueur.",
                    sensibledata: false,
                    preventEdit: true
                }
            }
            else {
                options = {
                    about: null,
                    defaultDisplay: false,
                    warnBeforeDisplay: false,
                    sensibledata: false,
                    preventEdit: false
                }
            }
        }
        console.log(`${itemName} visible user: ${userOptions}`)
        let displayedValue;
        let editing;
        if(userOptions) {
            if(userOptions.edit) editing = true
            else editing = false
        }
        else editing = false
        let messageValueDefaultHidden = (<Text style={{color: "yellow"}}>Contenu masqué par défaut</Text>)
        let messageValueManuallyHidden = (<Text style={{color: "yellow"}}>Contenu masqué</Text>)
        let messageValueShow = (<Text style={{color: UIColors.text}}>{itemValue}</Text>)
        if(userOptions && typeof userOptions.display !== 'undefined') {
            if(userOptions.display) displayedValue = messageValueShow
            if(userOptions.display === false) displayedValue = messageValueManuallyHidden
        }
        else {
            if(options.defaultDisplay) displayedValue = messageValueShow
            else displayedValue = messageValueDefaultHidden
        }
        if(!editing) return (
            <View style={styles.entryContainer}>
                { options.sensibleData ? (
                    <View>
                        <CircleAlert size={24} color={"yellow"} style={styles.leftIcon} onPress={() => { warningSensibleData(itemName) }}/>
                    </View>
                ) : null}
                <View>
                    <Text style={{color: UIColors.text, fontSize: 10}}>{itemName}</Text>
                    { displayedValue }
                </View>
                <View style={styles.actionView}>
                    { options.about ? (
                        <Info color={UIColors.text} style={styles.actionIcon} onPress={() => { showAbout(itemName) }} />
                    ) : null}
                    { displayedValue === messageValueShow ? (
                        <EyeOff color={UIColors.text} style={styles.actionIcon} onPress={() => { hideData(itemName) }} />
                    ) : (
                        <Eye color={UIColors.text} style={styles.actionIcon} onPress={() => { showData(itemName) }} />
                    )}
                    { !options.preventEdit ? (
                        <Pencil color={UIColors.text} style={styles.actionIcon} onPress={() => { editEntry(itemName, itemValue) }}/>
                    ): null}
                    <Trash2 color="red" style={styles.actionIcon} onPress={() => { deleteEntry(itemName) }}/>
                </View>
            </View>
        )
        if(editing) return (
            <View style={styles.entryContainer}>
                <View>
                    <Pencil size={24} color={UIColors.text} style={styles.leftIcon} />
                </View>
                <View>
                    <View style={{flexDirection: "row", alignItems: "center"}}>
                        <Text style={{color: UIColors.text}}>Nom : </Text>
                        <TextInput numberOfLines={1} defaultValue={itemName} style={{color: UIColors.text, borderBottomWidth: 1, borderBottomColor: UIColors.text}} onChangeText={(value) => { changeEditHandler(itemName, value, "name") }}/>
                    </View>
                    <View>
                        <Text style={{color: UIColors.text}}>Valeur :</Text>
                        <TextInput numberOfLines={1} defaultValue={itemValue} style={{color: UIColors.text, borderBottomWidth: 1, borderBottomColor: UIColors.text}} onChangeText={(value) => { changeEditHandler(itemName, value, "value") }}/>
                    </View>
                </View>
                <View style={styles.actionView}>
                    <X color="red" style={styles.actionIcon} onPress={() => { cancelEdit(itemName) }}/>
                    <Check color="green" style={styles.actionIcon} onPress={() => { validateEdit(itemName) }}/>
                </View>
            </View>
        )
    }
    const entryInfo = {
        "allNotifs": {
            about: "Identifiants locaux des données ayant une notification en attente",
            defaultDisplay: true,
            warnBeforeDisplay: false,
            sensibleData: false,
            preventEdit: false
        },
        "devMode": {
            about: "Défini l'activation des options de développement",
            defaultDisplay: true,
            warnBeforeDisplay: false,
            sensibleData: false,
            preventEdit: false
        },
        "logs": {
            about: "Logs de l'application",
            defaultDisplay: false,
            warnBeforeDisplay: "Charger cette valeur peut faire planter l'application en raison de sa longueur.",
            sensibleData: false,
            preventEdit: true
        },
        "oldGrades": {
            about: "Cache des notes pour le background fetch",
            defaultDisplay: false,
            warnBeforeDisplay: "Charger cette valeur peut faire planter l'application en raison de sa longueur.",
            sensibleData: false,
            preventEdit: true
        },
        "ppln_terms": {
            about: "Défini si les conditions ont été acceptées",
            defaultDisplay: true,
            warnBeforeDisplay: false,
            sensibleData: false,
            preventEdit: false
        },
        "preventNotifInit": {
            about: "Défini si l'initialisation des notifications doit être ignoré",
            defaultDisplay: true,
            warnBeforeDisplay: false,
            sensibleData: false,
            preventEdit: false
        },
        "pronote:account_type_id": {
            about: "Type de compte pronote",
            defaultDisplay: true,
            warnBeforeDisplay: false,
            sensibleData: false,
            preventEdit: false
        },
        "pronote:cache_user": {
            about: "Cache des informations utilisateurs. Contient nom, prénom, et autres données personnelles.",
            defaultDisplay: false,
            warnBeforeDisplay: "Cette valeur contient vos données personnelles tel que votre prénom et nom.",
            sensibleData: true,
            preventEdit: false
        },
        "pronote:device_uuid": {
            about: "UUID de l'appareil pour pronote (généré automatiquement, modifier cette valeur entraînera l'échec de la reconnexion)",
            defaultDisplay: true,
            warnBeforeDisplay: false,
            sensibleData: false,
            preventEdit: false
        },
        "pronote:instance_url": {
            about: "URL de l'instance PRONOTE.",
            defaultDisplay: false,
            warnBeforeDisplay: "Cette valeur contient l'URL de l'instance de PRONOTE. N'importe qui qui accède à cette url peut connaître toutes les informations de votre établissement.",
            sensibleData: true,
            preventEdit: false
        },
        "pronote:next_time_token": {
            about: "Token de reconnexion à PRONOTE",
            defaultDisplay: false,
            warnBeforeDisplay: "Cette valeur contient le token de reconnexion à votre compte PRONOTE. Combiné à l'UUID et votre nom d'utilisateur, n'importe qui peut accéder à votre compte.",
            sensibleData: true,
            preventEdit: false
        },
        "pronote:username": {
            about: "Nom d'utilisateur PRONOTE",
            defaultDisplay: false,
            warnBeforeDisplay: "Cette valeur contient votre nom d'utilisateur, généralement composé de votre prénom et/ou nom.",
            sensibleData: true,
            preventEdit: false
        },
        "savedColors": {
            about: "Stockage des couleurs personnalisées",
            defaultDisplay: false,
            warnBeforeDisplay: "Charger cette valeur peut faire planter l'application en raison de sa longueur.",
            sensibleData: false,
            preventEdit: false
        },
        "service": {
            about: "Nom du service utilisé",
            defaultDisplay: true,
            warnBeforeDisplay: false,
            sensibleData: false,
            preventEdit: false
        }
    }
    function rerenderStorage() {
        setStorageLoading(true)
        setTimeout(() => {
            setStorageLoading(false)
        }, 100)
    }
    function deleteEntry(name) {
        Alert.alert(
            `Supprimer ${name} ?`,
            "ATTENTION : NE PAS VALIDER SANS SAVOIR CE QUE VOUS FAITES !\nSupprimer cette entrée peut altérer au bon fonctionnement de l'application !\n\nL'équipe Papillon ne pourra être tenue responsable de tout bug engendré.",
            [{
                text: "Annuler",
                style: "cancel"
            },
            {
                text: "Supprimer",
                style: "destructive",
                onPress: async() => {
                    AsyncStorage.removeItem(name)
                    .then(() => {
                        showMessage({
                            message: 'Entrée supprimée avec succès',
                            type: 'success',
                            icon: 'auto',
                            floating: true,
                            position: "bottom"
                        });
                        loadStorage()
                    })
                    .catch(err => {
                        showMessage({
                            message: 'Erreur lors de la suppression',
                            description: err,
                            type: "danger",
                            icon: 'auto',
                            floating: true,
                            position: "bottom"
                        });
                        loadStorage()
                    })
                }
            }]
        )
    }
    function editEntry(name, value) {
        Alert.alert(
            "Modifier cette entrée ?",
            "ATTENTION : NE PAS VALIDER SANS SAVOIR CE QUE VOUS FAITES !\nModifier cette entrée peut altérer au bon fonctionnement de l'application !\n\nL'équipe Papillon ne pourra être tenue responsable de tout bug engendré.",
            [{
                text: "Annuler",
                style: "cancel"
            },
            {
                text: "Continuer",
                onPress: () => {
                    let entryUserOptions = storageList
                    entryUserOptions[name] = { edit: true, editName: name, editValue: value }
                    setStorageList(entryUserOptions)
                    rerenderStorage()
                }
            }]
        )
    }
    function changeEditHandler(name, value, type) {
        console.log(`change edit ${type} of ${name} = ${value}`)
        let entryUserOptions = storageList
        if(type === "value") entryUserOptions[name] = { edit: true, editValue: value, editName: entryUserOptions[name].editName }
        if(type === "name") entryUserOptions[name] = { edit: true, editValue: entryUserOptions[name].editValue, editName: value }
        setStorageList(entryUserOptions)
    }
    function validateEdit(name) {
        Alert.alert(
            "Valider la modification ?",
            "ATTENTION : NE PAS VALIDER SANS SAVOIR CE QUE VOUS FAITES !\nModifier cette entrée peut altérer au bon fonctionnement de l'application !\n\nL'équipe Papillon ne pourra être tenue responsable de tout bug engendré.",
            [{
                text: "Non",
                style: "cancel"
            },
            {
                text: "Oui",
                onPress: async () => {
                    let value = storageList[name].editValue
                    let newName = storageList[name].editName || name
                    try {
                        await AsyncStorage.removeItem(name)
                        AsyncStorage.setItem(newName, value)
                        .then(() => {
                            showMessage({
                                message: 'Entrée modifiée avec succès',
                                type: 'success',
                                icon: 'auto',
                                floating: true,
                                position: "bottom"
                            });
                            let entryUserOptions = storageList
                            entryUserOptions[name] = undefined
                            entryUserOptions[newName] = { edit: false, display: true }
                            setStorageList(entryUserOptions)
                            loadStorage()
                        })
                    }
                    catch(err) {
                        showMessage({
                            message: 'Erreur lors de la modification',
                            description: err,
                            type: "danger",
                            icon: 'auto',
                            floating: true,
                            position: "bottom"
                        });
                    }
                }
            }]
        )
    }
    function cancelEdit(name) {
        Alert.alert(
            "Annuler la modification ?",
            "",
            [{
                text: "Non",
                style: "cancel"
            },
            {
                text: "Oui",
                onPress: () => {
                    let entryUserOptions = storageList
                    entryUserOptions[name] = { edit: false, editValue: null, display: true }
                    setStorageList(entryUserOptions)
                    rerenderStorage()
                }
            }]
        )
    }
    function warningSensibleData(name) {
        Alert.alert(
            "Contient une information sensible",
            entryInfo[name].warnBeforeDisplay || "Cette valeur a été cachée par défaut, car elle contient une donnée sensible."
        )
    }
    function showData(name) {
        console.log("show data" + name)
        let options = entryInfo[name]
        if(!options) {
            if(name.includes("cache")) {
                options = {
                    about: null,
                    defaultDisplay: false,
                    warnBeforeDisplay: "Charger cette valeur peut faire planter l'application en raison de sa longueur.",
                    sensibledata: false
                }
            }
            else {
                options = {
                    warnBeforeDisplay: false
                }
            }
        }
        if(options.warnBeforeDisplay) {
            Alert.alert(
                options.sensibleData ? "Contient une information sensible" : "Afficher la valeur ?",
                options.warnBeforeDisplay + "\n\nSouhaitez-vous quand même afficher la valeur ?",
                [{
                    text: "Annuler",
                    style: "cancel"
                },
                {
                    text: "Continuer",
                    onPress: () => showData1(name)
                }]
            )
        }
        else showData1(name)
    }
    function showData1(name) {
        console.log(`set show data ${name}`)
        let entryUserOptions = storageList
        entryUserOptions[name] = { display: true }
        setStorageList(entryUserOptions)
        rerenderStorage()
    }
    function hideData(name) {
        console.log(`hide data ${name}`)
        let entryUserOptions = storageList
        entryUserOptions[name] = { display: false }
        setStorageList(entryUserOptions)
        rerenderStorage()
    }
    function showAbout(name) {
        Alert.alert(
            name,
            entryInfo[name].about
        )
    }
    const styles = StyleSheet.create({
        entryContainer: {
            flexDirection: "row",
            paddingBottom: 5,
            marginBottom: 10,
        },
        actionView: {
            marginLeft: "auto",
            flexDirection: "row",
            marginTop: 4,
        },
        actionIcon: {
            marginLeft: 5
        },
        leftIcon: {
            marginRight: 10,
            marginTop: 4
        }
    })
    return (
        <View style={{ flex: 1 }}>
            {Platform.OS === 'ios' ? (
                <StatusBar animated barStyle="light-content" />
            ) : (
                <StatusBar
                    animated
                    barStyle={theme.dark ? 'light-content' : 'dark-content'}
                    backgroundColor="transparent"
                />
            )}
            <ScrollView
                style={{ 
                    backgroundColor: UIColors.modalBackground,
                    padding: 10, 
                }}
                contentInsetAdjustmentBehavior="automatic"
            >
                {storageLoading ? (
                    <PapillonLoading
                        title="Chargement du local storage"
                    />
                ) : 
                    Array.from(storage).map((item, index) => (
                        <RenderItem item={item} key={index} />
                    ))
                }
            </ScrollView>
        </View>
    )
}
/*
{logsLoading ? (
                    <PapillonLoading
                        title="Chargement du local storage"
                    />
                ) : 
                    Array.from(logs).map((log, index) => (
                        <LogsRenderer log={log} key={index} />
                    ))
                }
                */

/*
                <View style={styles.entryContainer}>
                    <View>
                        <Text style={{color: UIColors.text, fontSize: 10}}>service</Text>
                        <Text style={{color: UIColors.text}}>pronote</Text>
                    </View>
                    <View style={styles.actionView}>
                        <EyeOff color={UIColors.text} style={styles.actionIcon} />
                        <Pencil color={UIColors.text} style={styles.actionIcon} onPress={() => { editEntry() }}/>
                        <Trash2 color="red" style={styles.actionIcon} onPress={() => { deleteEntry() }}/>
                    </View>
                </View>

                // edit view
                <View style={styles.entryContainer}>
                    <View>
                        <Pencil size={24} color={UIColors.text} style={styles.leftIcon} />
                    </View>
                    <View>
                        <View style={{flexDirection: "row", alignItems: "center"}}>
                            <Text style={{color: UIColors.text}}>Nom : </Text>
                            <TextInput numberOfLines={1} defaultValue="service" style={{color: UIColors.text, borderBottomWidth: 1, borderBottomColor: UIColors.text}}/>
                        </View>
                        <View>
                            <Text style={{color: UIColors.text}}>Valeur :</Text>
                            <TextInput numberOfLines={1} defaultValue="pronote" style={{color: UIColors.text, borderBottomWidth: 1, borderBottomColor: UIColors.text}}/>
                        </View>
                    </View>
                    <View style={styles.actionView}>
                        <X color="red" style={styles.actionIcon} onPress={() => { cancelEdit() }}/>
                        <Check color="green" style={styles.actionIcon} onPress={() => { validateEdit() }}/>
                    </View>
                </View>

                <View style={styles.entryContainer}>
                    <View>
                        <CircleAlert size={24} color={"yellow"} style={styles.leftIcon} onPress={() => { warningSensibleData() }}/>
                    </View>
                    <View>
                        <Text style={{color: UIColors.text, fontSize: 10}}>accessToken</Text>
                        <Text style={{color: UIColors.text}}>Contenu caché</Text>
                    </View>
                    <View style={styles.actionView}>
                        <Eye color={UIColors.text} style={styles.actionIcon} onPress={() => { showData() }} />
                        <Pencil color={UIColors.text} style={styles.actionIcon} onPress={() => { editEntry() }}/>
                        <Trash2 color="red" style={styles.actionIcon} onPress={() => { deleteEntry() }}/>
                    </View>
                </View>
                */
export default LocalStorageViewScreen;