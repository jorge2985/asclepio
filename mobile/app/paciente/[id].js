// Detalle de paciente para medico.
//
// Esta pantalla nunca debe tener datos clinicos simulados. El backend filtra
// por relacion medico-paciente y aqui solo se renderiza lo que la API entrega.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { servicioDoctores } from '../../services/api';
import { manejarError, registrarError } from '../../services/errorHandler';
import { colors, spacing } from '../../styles/theme';

const formatearFecha = (value) => {
    if (!value) return 'Sin fecha';
    return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatearHora = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function DetallePaciente() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [paciente, setPaciente] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargarPaciente = useCallback(async () => {
        try {
            setCargando(true);
            setError('');
            const respuesta = await servicioDoctores.detallePaciente(id);
            setPaciente(respuesta.data);
        } catch (err) {
            registrarError(err, 'Detalle paciente');
            setError(manejarError(err));
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => {
        cargarPaciente();
    }, [cargarPaciente]);

    const consultas = paciente?.consultas || [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <FontAwesome name="arrow-left" size={18} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil del Paciente</Text>
                <View style={styles.headerSpacer} />
            </View>

            {cargando ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.stateText}>Cargando paciente...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerState}>
                    <FontAwesome name="exclamation-circle" size={32} color="#b91c1c" />
                    <Text style={styles.stateTitle}>No se pudo cargar el paciente</Text>
                    <Text style={styles.stateText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={cargarPaciente}>
                        <Text style={styles.retryText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.bioCard}>
                        <Image source={{ uri: 'https://placehold.co/112' }} style={styles.avatarLarge} />
                        <Text style={styles.patientName}>{paciente?.nombre_completo || 'Paciente'}</Text>
                        <Text style={styles.bioMetaItem}>Ultima visita: {formatearFecha(paciente?.ultima_visita)}</Text>

                        <View style={styles.contactGrid}>
                            <View style={styles.contactItem}>
                                <Text style={styles.contactLabel}>Telefono</Text>
                                <Text style={styles.contactValue}>{paciente?.telefono || 'No registrado'}</Text>
                            </View>
                            <View style={styles.contactItem}>
                                <Text style={styles.contactLabel}>Direccion</Text>
                                <Text style={styles.contactValue}>{paciente?.direccion || 'No registrada'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBg, { backgroundColor: '#eff6ff' }]}>
                                <FontAwesome name="file-text-o" size={16} color={colors.primary} />
                            </View>
                            <Text style={styles.cardTitle}>Motivo reciente</Text>
                        </View>
                        <Text style={styles.reasonText}>
                            {paciente?.motivo_actual || 'No hay motivo registrado en las citas relacionadas.'}
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBg, { backgroundColor: '#fff7ed' }]}>
                                <FontAwesome name="history" size={16} color="#f97316" />
                            </View>
                            <Text style={styles.cardTitle}>Antecedentes disponibles</Text>
                        </View>
                        <Text style={styles.reasonText}>
                            El backend actual no almacena alergias, peso, altura ni condiciones cronicas.
                            Cuando esos campos existan con consentimiento del paciente, deben agregarse aqui desde la API.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBg, { backgroundColor: '#f3e8ff' }]}>
                                <FontAwesome name="calendar" size={16} color="#9333ea" />
                            </View>
                            <Text style={styles.cardTitle}>Consultas relacionadas</Text>
                        </View>

                        {consultas.length === 0 ? (
                            <Text style={styles.noDataText}>No hay consultas relacionadas para mostrar.</Text>
                        ) : (
                            consultas.map((consulta, index) => (
                                <View
                                    key={consulta.id}
                                    style={[styles.consultRow, index < consultas.length - 1 && styles.consultBorder]}
                                >
                                    <View style={styles.dateBox}>
                                        <Text style={styles.dateMonth}>{formatearFecha(consulta.fecha_hora).split(' ')[1] || ''}</Text>
                                        <Text style={styles.dateDay}>{new Date(consulta.fecha_hora).getDate()}</Text>
                                    </View>
                                    <View style={styles.consultInfo}>
                                        <Text style={styles.consultTitle}>{consulta.motivo || 'Consulta medica'}</Text>
                                        <Text style={styles.consultSub}>
                                            {formatearHora(consulta.fecha_hora)} - {consulta.estado}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundLight },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain },
    headerSpacer: { width: 40 },
    scrollContent: { padding: spacing.m, paddingBottom: 40 },
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.l,
        gap: 12,
    },
    stateTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain, textAlign: 'center' },
    stateText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
    retryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
    retryText: { color: '#fff', fontWeight: '700' },
    bioCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarLarge: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#e5e7eb', marginBottom: 12 },
    patientName: { fontSize: 24, fontWeight: 'bold', color: colors.textMain, textAlign: 'center' },
    bioMetaItem: { fontSize: 14, color: '#64748b', fontWeight: '500', marginTop: 4 },
    contactGrid: { width: '100%', gap: 10, marginTop: 16 },
    contactItem: { padding: 12, borderRadius: 10, backgroundColor: colors.backgroundLight },
    contactLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '700' },
    contactValue: { fontSize: 14, color: colors.textMain, marginTop: 4 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    cardIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 17, fontWeight: 'bold', color: colors.textMain },
    reasonText: { fontSize: 15, color: '#475569', lineHeight: 22 },
    noDataText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
    consultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    consultBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dateBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.backgroundLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateMonth: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
    dateDay: { fontSize: 18, fontWeight: 'bold', color: colors.textMain, lineHeight: 20 },
    consultInfo: { flex: 1 },
    consultTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textMain },
    consultSub: { fontSize: 12, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
});
