// Dashboard principal del medico.
//
// Carga citas, pacientes relacionados y estadisticas reales del backend. Si una
// metrica aparece en esta pantalla, debe venir de un servicio y no de arrays fake.
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import usarStoreAutenticacion from '../../stores/authStore';
import { servicioCitas, servicioDoctores } from '../../services/api';
import { registrarError } from '../../services/errorHandler';
import { spacing } from '../../styles/theme';

const dc = {
    // Paleta local heredada del diseno del dashboard medico. Fase futura:
    // mover estos valores a styles/theme.js para consistencia global.
    primary: '#13ecda',
    primaryDark: '#0ebcb0',
    bgLight: '#f6f8f8',
    surface: '#ffffff',
    textMain: '#0d1b1a',
    textSecondary: '#4c9a93',
};

const formatearFecha = (value) => {
    if (!value) return 'Sin visitas';
    return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short' });
};

export default function DashboardDoctor() {
    const { usuario } = usarStoreAutenticacion();
    const router = useRouter();
    const [citas, setCitas] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDashboard();
    }, []);

    const cargarDashboard = async () => {
        try {
            setCargando(true);
            // Las llamadas no dependen entre si, por eso se ejecutan en paralelo.
            const [resCitas, resPacientes, resStats] = await Promise.all([
                servicioCitas.porMedico(),
                servicioDoctores.pacientes(),
                servicioDoctores.estadisticas(),
            ]);
            setCitas(resCitas.data || []);
            setPacientes(resPacientes.data || []);
            setEstadisticas(resStats.data || null);
        } catch (error) {
            registrarError(error, 'Dashboard medico');
        } finally {
            setCargando(false);
        }
    };

    const handleConfirmar = async (id) => {
        try {
            await servicioCitas.confirmar(id);
            cargarDashboard();
        } catch (error) {
            registrarError(error, 'Confirmar cita');
        }
    };

    const obtenerSaludo = () => {
        const hora = new Date().getHours();
        if (hora < 12) return 'Buenos Dias';
        if (hora < 18) return 'Buenas Tardes';
        return 'Buenas Noches';
    };

    const verDetallePaciente = (id) => {
        router.push(`/paciente/${id}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: 'https://placehold.co/48' }} style={styles.avatar} />
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

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: dc.primary + '1A' }]}>
                            <FontAwesome name="users" size={20} color={dc.primaryDark} />
                        </View>
                        <Text style={styles.statNumber}>{estadisticas?.pacientes_atendidos ?? 0}</Text>
                        <Text style={styles.statLabel}>Pacientes Atendidos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#fff7ed' }]}>
                            <FontAwesome name="star" size={20} color="#f97316" />
                        </View>
                        <Text style={styles.statNumber}>{Number(estadisticas?.calificacion ?? 0).toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Calificacion</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Proximas Citas</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Ver Todas</Text>
                        </TouchableOpacity>
                    </View>
                    {cargando ? (
                        <Text style={styles.emptyText}>Cargando...</Text>
                    ) : citas.length === 0 ? (
                        <Text style={styles.emptyText}>No hay citas pendientes.</Text>
                    ) : (
                        citas.map((cita) => {
                            const d = new Date(cita.fecha_hora);
                            const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const dia = d.toLocaleDateString([], { day: '2-digit', month: 'short' });
                            const tipo = cita.direccion_atencion ? 'Domicilio' : 'Clinica';

                            return (
                                <View key={cita.id} style={[styles.appointmentCard, cita.estado === 'cancelada' && { opacity: 0.5 }]}>
                                    <View style={styles.appointmentLeft}>
                                        <Image source={{ uri: 'https://placehold.co/56' }} style={styles.appointmentAvatar} />
                                        <View style={styles.appointmentInfo}>
                                            <Text style={styles.appointmentName}>{cita.paciente_nombre || 'Paciente'}</Text>
                                            <Text style={styles.appointmentTime}>{hora} - {dia}</Text>
                                            <View style={styles.typeBadge}>
                                                <FontAwesome name={tipo === 'Domicilio' ? 'home' : 'stethoscope'} size={10} color="#1d4ed8" />
                                                <Text style={styles.typeText}>{tipo}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.appointmentRight}>
                                        <Text style={styles.statusText}>{cita.estado.replace('_', ' ')}</Text>
                                        {cita.estado === 'pendiente_confirmacion' && (
                                            <TouchableOpacity style={styles.appointmentAction} onPress={() => handleConfirmar(cita.id)}>
                                                <FontAwesome name="check" size={16} color={dc.primaryDark} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Lista de Pacientes</Text>
                    <View style={styles.patientListCard}>
                        {cargando ? (
                            <Text style={styles.emptyText}>Cargando...</Text>
                        ) : pacientes.length === 0 ? (
                            <Text style={styles.emptyText}>No hay pacientes relacionados.</Text>
                        ) : (
                            pacientes.map((paciente, idx) => (
                                <TouchableOpacity
                                    key={paciente.id}
                                    style={[styles.patientRow, idx < pacientes.length - 1 && styles.patientRowBorder]}
                                    onPress={() => verDetallePaciente(paciente.id)}
                                >
                                    <View style={styles.patientLeft}>
                                        <Image source={{ uri: 'https://placehold.co/40' }} style={styles.patientAvatar} />
                                        <View>
                                            <Text style={styles.patientName}>{paciente.nombre_completo}</Text>
                                            <Text style={styles.patientLastVisit}>Ultima visita: {formatearFecha(paciente.ultima_visita)}</Text>
                                        </View>
                                    </View>
                                    <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: dc.bgLight },
    scrollContent: { padding: spacing.l, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e5e7eb' },
    onlineDot: {
        position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff',
    },
    greetingLabel: { fontSize: 12, color: dc.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
    doctorName: { fontSize: 18, fontWeight: 'bold', color: dc.textMain },
    notifButton: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: dc.surface,
        justifyContent: 'center', alignItems: 'center', shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
    },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: spacing.xl },
    statCard: {
        flex: 1, backgroundColor: dc.surface, borderRadius: 16, padding: spacing.m, gap: 12,
        borderWidth: 1, borderColor: '#f3f4f6', shadowColor: dc.primary,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    statIconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statNumber: { fontSize: 30, fontWeight: 'bold', color: dc.textMain },
    statLabel: { fontSize: 13, color: dc.textSecondary, fontWeight: '500' },
    section: { marginBottom: spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.m },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: dc.textMain, marginBottom: spacing.m },
    seeAll: { fontSize: 13, fontWeight: '600', color: dc.primaryDark, marginBottom: spacing.m },
    emptyText: { padding: 16, color: dc.textSecondary },
    appointmentCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: dc.surface, borderRadius: 12, padding: spacing.m, marginBottom: 12,
        borderWidth: 1, borderColor: '#f3f4f6',
    },
    appointmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    appointmentAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e5e7eb' },
    appointmentInfo: { flex: 1 },
    appointmentName: { fontSize: 15, fontWeight: 'bold', color: dc.textMain },
    appointmentTime: { fontSize: 13, color: dc.textSecondary, fontWeight: '500', marginBottom: 4 },
    typeBadge: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: '#eff6ff',
    },
    typeText: { fontSize: 11, fontWeight: '600', color: '#1d4ed8' },
    appointmentRight: { alignItems: 'flex-end', gap: 8 },
    statusText: { fontSize: 12, color: dc.primaryDark, fontWeight: 'bold', textTransform: 'capitalize' },
    appointmentAction: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: dc.primary + '1A',
        justifyContent: 'center', alignItems: 'center',
    },
    patientListCard: { backgroundColor: dc.surface, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' },
    patientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.m },
    patientRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    patientLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    patientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb' },
    patientName: { fontSize: 14, fontWeight: '600', color: dc.textMain },
    patientLastVisit: { fontSize: 12, color: dc.textSecondary },
});
