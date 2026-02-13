
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, fonts, borderRadius } from '../../styles/theme';
import usarStoreAutenticacion from '../../stores/authStore';

export default function PantallaPerfil() {
    const { usuario, cerrarSesion } = usarStoreAutenticacion();
    const router = useRouter();

    const manejarCierreSesion = async () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro que quieres salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: "destructive",
                    onPress: async () => {
                        await cerrarSesion();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    const OptionItem = ({ icon, label, onPress, isDestructive = false }) => (
        <TouchableOpacity style={styles.optionItem} onPress={onPress}>
            <View style={[styles.iconContainer, isDestructive && styles.iconDestructive]}>
                <FontAwesome name={icon} size={20} color={isDestructive ? colors.error : colors.primary} />
            </View>
            <Text style={[styles.optionLabel, isDestructive && styles.textDestructive]}>{label}</Text>
            <FontAwesome name="angle-right" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mi Perfil</Text>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Tarjeta de Usuario */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <FontAwesome name="user" size={40} color={colors.white} />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{usuario?.nombre_completo || 'Usuario'}</Text>
                        <Text style={styles.userEmail}>{usuario?.email || 'email@ejemplo.com'}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{usuario?.rol || 'Paciente'}</Text>
                        </View>
                    </View>
                </View>

                {/* Sección General */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>
                    <OptionItem icon="user-circle-o" label="Datos Personales" onPress={() => { }} />
                    <OptionItem icon="heartbeat" label="Historial Médico" onPress={() => router.push('/historial')} />
                    <OptionItem icon="credit-card" label="Métodos de Pago" onPress={() => { }} />
                </View>

                {/* Sección Configuración */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Configuración</Text>
                    <OptionItem icon="bell-o" label="Notificaciones" onPress={() => { }} />
                    <OptionItem icon="lock" label="Seguridad y Contraseña" onPress={() => { }} />
                    <OptionItem icon="question-circle-o" label="Ayuda y Soporte" onPress={() => { }} />
                </View>

                {/* Cerrar Sesión */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={manejarCierreSesion}>
                        <FontAwesome name="sign-out" size={20} color={colors.error} style={{ marginRight: spacing.s }} />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>Versión 1.0.0</Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
    },
    headerSafeArea: {
        backgroundColor: colors.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
    },
    header: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    scrollContent: {
        padding: spacing.l,
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: spacing.l,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textMain,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.s,
    },
    roleBadge: {
        backgroundColor: colors.primary + '15',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
        borderRadius: borderRadius.m,
    },
    roleText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    section: {
        marginBottom: spacing.xl,
        backgroundColor: colors.white,
        borderRadius: borderRadius.l,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.s,
        marginTop: spacing.m, // Ajuste visual si está fuera de la tarjeta
        marginLeft: spacing.m,
        display: 'none', // Ocultamos el título dentro de la tarjeta estilo iOS
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.m,
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    iconDestructive: {
        backgroundColor: colors.error + '15',
    },
    optionLabel: {
        flex: 1,
        fontSize: 16,
        color: colors.textMain,
    },
    textDestructive: {
        color: colors.error,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.m,
        backgroundColor: colors.white,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.error,
    },
    versionText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: spacing.s,
    },
});
