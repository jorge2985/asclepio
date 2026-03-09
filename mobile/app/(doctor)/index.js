import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import usarStoreAutenticacion from '../../stores/authStore';
import { servicioCitas } from '../../services/api';
import { spacing, borderRadius } from '../../styles/theme';

const dc = {
    primary: '#13ecda',
    primaryDark: '#0ebcb0',
    bgLight: '#f6f8f8',
    surface: '#ffffff',
    textMain: '#0d1b1a',
    textSecondary: '#4c9a93',
};

// Datos simulados de pacientes (el backend no tiene endpoint de pacientes para médicos aún)
const pacientesSimulados = [
    { id: '1', nombre: 'Alice Wong', ultimaVisita: '24 Oct', imagen: null },
    { id: '2', nombre: 'David Kim', ultimaVisita: '20 Oct', imagen: null },
    { id: '3', nombre: 'Marcus Johnson', ultimaVisita: '18 Oct', imagen: null },
];

const citasSimuladas = [
    {
        id: '1',
        paciente: 'Sarah Jenkins',
        hora: '09:00 AM',
        dia: 'Hoy',
        tipo: 'Visita a Domicilio',
        tipoIcon: 'home',
        tipoBgColor: '#eff6ff',
        tipoTextColor: '#1d4ed8',
    },
    {
        id: '2',
        paciente: 'Michael Ross',
        hora: '10:30 AM',
        dia: 'Hoy',
        tipo: 'Consulta Clínica',
        tipoIcon: 'stethoscope',
        tipoBgColor: '#e6fcfa',
        tipoTextColor: dc.primaryDark,
    },
];

export default function DashboardDoctor() {
    const { usuario } = usarStoreAutenticacion();
    const router = useRouter();

    const obtenerSaludo = () => {
        const hora = new Date().getHours();
        if (hora < 12) return 'Buenos Días';
        if (hora < 18) return 'Buenas Tardes';
        return 'Buenas Noches';
    };

    const verDetallePaciente = (id) => {
        router.push(`/paciente/${id}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: 'https://placehold.co/48' }}
                                style={styles.avatar}
                            />
                            <View style={styles.onlineDot} />
                        </View>
                        <View>
                            <Text style={styles.greetingLabel}>{obtenerSaludo()}</Text>
                            <Text style={styles.doctorName}>{usuario?.nombre_completo || 'Doctor'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.notifButton}>
                        <FontAwesome name="bell-o" size={20} color={dc.textMain} />
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: dc.primary + '1A' }]}>
                            <FontAwesome name="users" size={20} color={dc.primaryDark} />
                        </View>
                        <Text style={styles.statNumber}>1,240</Text>
                        <Text style={styles.statLabel}>Pacientes Atendidos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#fff7ed' }]}>
                            <FontAwesome name="star" size={20} color="#f97316" />
                        </View>
                        <Text style={styles.statNumber}>4.9</Text>
                        <Text style={styles.statLabel}>Calificación</Text>
                    </View>
                </View>

                {/* Upcoming Appointments */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Próximas Citas</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Ver Todas</Text>
                        </TouchableOpacity>
                    </View>
                    {citasSimuladas.map((cita) => (
                        <View key={cita.id} style={styles.appointmentCard}>
                            <View style={styles.appointmentLeft}>
                                <Image
                                    source={{ uri: 'https://placehold.co/56' }}
                                    style={styles.appointmentAvatar}
                                />
                                <View style={styles.appointmentInfo}>
                                    <Text style={styles.appointmentName}>{cita.paciente}</Text>
                                    <Text style={styles.appointmentTime}>{cita.hora} • {cita.dia}</Text>
                                    <View style={[styles.typeBadge, { backgroundColor: cita.tipoBgColor }]}>
                                        <FontAwesome name={cita.tipoIcon} size={10} color={cita.tipoTextColor} />
                                        <Text style={[styles.typeText, { color: cita.tipoTextColor }]}>{cita.tipo}</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.appointmentAction}>
                                <FontAwesome name={cita.tipoIcon === 'home' ? 'map-marker' : 'info-circle'} size={18} color={cita.tipoIcon === 'home' ? dc.primaryDark : '#9ca3af'} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Patient List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Lista de Pacientes</Text>
                    <View style={styles.patientListCard}>
                        {pacientesSimulados.map((paciente, idx) => (
                            <TouchableOpacity
                                key={paciente.id}
                                style={[
                                    styles.patientRow,
                                    idx < pacientesSimulados.length - 1 && styles.patientRowBorder,
                                ]}
                                onPress={() => verDetallePaciente(paciente.id)}
                            >
                                <View style={styles.patientLeft}>
                                    <Image
                                        source={{ uri: 'https://placehold.co/40' }}
                                        style={styles.patientAvatar}
                                    />
                                    <View>
                                        <Text style={styles.patientName}>{paciente.nombre}</Text>
                                        <Text style={styles.patientLastVisit}>Última visita: {paciente.ultimaVisita}</Text>
                                    </View>
                                </View>
                                <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
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
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e5e7eb',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#fff',
    },
    greetingLabel: {
        fontSize: 12,
        color: dc.textSecondary,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: dc.textMain,
    },
    notifButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: dc.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: dc.surface,
        borderRadius: 16,
        padding: spacing.m,
        gap: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: dc.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statIconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 30,
        fontWeight: 'bold',
        color: dc.textMain,
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 13,
        color: dc.textSecondary,
        fontWeight: '500',
    },
    // Section
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: dc.textMain,
        marginBottom: spacing.m,
    },
    seeAll: {
        fontSize: 13,
        fontWeight: '600',
        color: dc.primaryDark,
        marginBottom: spacing.m,
    },
    // Appointments
    appointmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: dc.surface,
        borderRadius: 12,
        padding: spacing.m,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    appointmentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    appointmentAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e5e7eb',
    },
    appointmentInfo: {
        flex: 1,
    },
    appointmentName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: dc.textMain,
    },
    appointmentTime: {
        fontSize: 13,
        color: dc.textSecondary,
        fontWeight: '500',
        marginBottom: 4,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    appointmentAction: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: dc.primary + '1A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Patient List
    patientListCard: {
        backgroundColor: dc.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        overflow: 'hidden',
    },
    patientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.m,
    },
    patientRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    patientLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    patientAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e5e7eb',
    },
    patientName: {
        fontSize: 14,
        fontWeight: '600',
        color: dc.textMain,
    },
    patientLastVisit: {
        fontSize: 12,
        color: dc.textSecondary,
    },
});
