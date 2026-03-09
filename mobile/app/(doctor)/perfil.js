import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import usarStoreAutenticacion from '../../stores/authStore';
import { spacing, borderRadius } from '../../styles/theme';

const dc = {
    primary: '#13ecda',
    primaryDark: '#0ebcb0',
    bgLight: '#f6f8f8',
    surface: '#ffffff',
    textMain: '#0d1b1a',
    textSecondary: '#4c9a93',
};

export default function PerfilDoctor() {
    const { usuario, cerrarSesion } = usarStoreAutenticacion();
    const router = useRouter();

    const handleLogout = async () => {
        await cerrarSesion();
        router.replace('/');
    };

    const confirmarLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', style: 'destructive', onPress: handleLogout },
            ]
        );
    };

    const menuItems = [
        { icon: 'user', label: 'Datos Profesionales', color: dc.primaryDark },
        { icon: 'calendar', label: 'Configurar Horarios', color: '#f97316' },
        { icon: 'bell', label: 'Notificaciones', color: '#8b5cf6' },
        { icon: 'lock', label: 'Seguridad', color: '#ef4444' },
        { icon: 'question-circle', label: 'Soporte', color: '#6b7280' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mi Perfil</Text>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarLarge}>
                        <Image
                            source={{ uri: 'https://placehold.co/80' }}
                            style={styles.avatarImage}
                        />
                    </View>
                    <Text style={styles.profileName}>{usuario?.nombre_completo || 'Doctor'}</Text>
                    <Text style={styles.profileEmail}>{usuario?.email || ''}</Text>
                    <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                            <FontAwesome name="check-circle" size={12} color={dc.primaryDark} />
                            <Text style={styles.badgeText}>Verificado</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.menuItem,
                                idx < menuItems.length - 1 && styles.menuItemBorder,
                            ]}
                        >
                            <View style={styles.menuLeft}>
                                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                                    <FontAwesome name={item.icon} size={16} color={item.color} />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={12} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={confirmarLogout}>
                    <FontAwesome name="sign-out" size={18} color="#ef4444" />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: dc.bgLight,
    },
    scrollContent: {
        padding: spacing.l,
        paddingBottom: 100,
    },
    header: {
        marginBottom: spacing.l,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: dc.textMain,
    },
    profileCard: {
        backgroundColor: dc.surface,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    avatarLarge: {
        marginBottom: 12,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e5e7eb',
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: dc.textMain,
    },
    profileEmail: {
        fontSize: 14,
        color: dc.textSecondary,
        marginTop: 2,
    },
    badgeContainer: {
        marginTop: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: dc.primary + '1A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: dc.primaryDark,
    },
    menuCard: {
        backgroundColor: dc.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        marginBottom: spacing.l,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.m,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: dc.textMain,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: spacing.m,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ef4444',
    },
});
