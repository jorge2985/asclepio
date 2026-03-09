import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, borderRadius } from '../../styles/theme';

// Datos simulados del paciente
const pacientesData = {
    '1': {
        nombre: 'Alice Wong',
        edad: 32,
        genero: 'Femenino',
        sangre: 'A+',
        peso: '62 kg',
        altura: '1.65 m',
        online: true,
        alergias: ['Penicilina', 'Mariscos'],
        condiciones: ['Asma leve'],
        motivo: 'Dolor de garganta persistente con fiebre leve (37.5°C) desde hace 3 días. Refiere dificultad para tragar alimentos sólidos.',
        consultas: [
            { mes: 'Oct', dia: '24', titulo: 'Control General', doctor: 'Dr. Ana García', tipo: 'Presencial' },
            { mes: 'Ago', dia: '12', titulo: 'Revisión Alergia', doctor: 'Dr. Ana García', tipo: 'Video' },
        ],
    },
    '2': {
        nombre: 'David Kim',
        edad: 45,
        genero: 'Masculino',
        sangre: 'O+',
        peso: '78 kg',
        altura: '1.75 m',
        online: false,
        alergias: ['Nueces'],
        condiciones: ['Hipertensión Arterial', 'Diabetes Tipo 2'],
        motivo: 'Dolor abdominal agudo localizado en el cuadrante inferior derecho, acompañado de fiebre leve (37.8°C) persistente desde hace 48 horas.',
        consultas: [
            { mes: 'Oct', dia: '20', titulo: 'Control Presión', doctor: 'Dr. Ana García', tipo: 'Presencial' },
            { mes: 'Sep', dia: '05', titulo: 'Análisis de Laboratorio', doctor: 'Lab Central', tipo: 'Resultados' },
            { mes: 'Jun', dia: '15', titulo: 'Control General', doctor: 'Dr. Ana García', tipo: 'Video' },
        ],
    },
    '3': {
        nombre: 'Marcus Johnson',
        edad: 28,
        genero: 'Masculino',
        sangre: 'B+',
        peso: '85 kg',
        altura: '1.82 m',
        online: true,
        alergias: [],
        condiciones: [],
        motivo: 'Consulta de rutina para chequeo médico anual. Sin síntomas específicos.',
        consultas: [
            { mes: 'Oct', dia: '18', titulo: 'Chequeo Anual', doctor: 'Dr. Ana García', tipo: 'Presencial' },
        ],
    },
};

export default function DetallePaciente() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const paciente = pacientesData[id] || pacientesData['1'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <FontAwesome name="arrow-left" size={18} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil del Paciente</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Bio Card */}
                <View style={styles.bioCard}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: 'https://placehold.co/112' }} style={styles.avatarLarge} />
                        {paciente.online && <View style={styles.onlineBadge} />}
                    </View>
                    <Text style={styles.patientName}>{paciente.nombre}</Text>
                    <View style={styles.bioMeta}>
                        <Text style={styles.bioMetaItem}>🎂 {paciente.edad} años</Text>
                        <View style={styles.dot} />
                        <Text style={styles.bioMetaItem}>{paciente.genero === 'Masculino' ? '🧑' : '👩'} {paciente.genero}</Text>
                    </View>

                    {/* Vital Stats */}
                    <View style={styles.vitalsRow}>
                        <View style={styles.vitalItem}>
                            <Text style={styles.vitalLabel}>Sangre</Text>
                            <Text style={[styles.vitalValue, { color: colors.primary }]}>{paciente.sangre}</Text>
                        </View>
                        <View style={styles.vitalItem}>
                            <Text style={styles.vitalLabel}>Peso</Text>
                            <Text style={styles.vitalValue}>{paciente.peso}</Text>
                        </View>
                        <View style={styles.vitalItem}>
                            <Text style={styles.vitalLabel}>Altura</Text>
                            <Text style={styles.vitalValue}>{paciente.altura}</Text>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionButton}>
                            <FontAwesome name="phone" size={16} color={colors.primary} />
                            <Text style={styles.actionText}>Llamar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <FontAwesome name="comment" size={16} color={colors.primary} />
                            <Text style={styles.actionText}>Mensaje</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Reason */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconBg, { backgroundColor: '#eff6ff' }]}>
                            <FontAwesome name="file-text-o" size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.cardTitle}>Motivo de Consulta</Text>
                    </View>
                    <Text style={styles.reasonText}>{paciente.motivo}</Text>
                </View>

                {/* Medical History */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconBg, { backgroundColor: '#fff7ed' }]}>
                            <FontAwesome name="history" size={16} color="#f97316" />
                        </View>
                        <Text style={styles.cardTitle}>Antecedentes Médicos</Text>
                    </View>

                    {/* Allergies */}
                    <Text style={styles.subHeading}>Alergias</Text>
                    <View style={styles.tagsRow}>
                        {paciente.alergias.length > 0 ? paciente.alergias.map((a, i) => (
                            <View key={i} style={styles.allergyTag}>
                                <FontAwesome name="warning" size={10} color="#b91c1c" />
                                <Text style={styles.allergyText}>{a}</Text>
                            </View>
                        )) : (
                            <Text style={styles.noDataText}>Sin alergias registradas</Text>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Conditions */}
                    <Text style={styles.subHeading}>Condiciones Crónicas</Text>
                    <View style={styles.tagsRow}>
                        {paciente.condiciones.length > 0 ? paciente.condiciones.map((c, i) => (
                            <View key={i} style={styles.conditionTag}>
                                <Text style={styles.conditionText}>{c}</Text>
                            </View>
                        )) : (
                            <Text style={styles.noDataText}>Sin condiciones crónicas</Text>
                        )}
                    </View>
                </View>

                {/* Previous Consultations */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconBg, { backgroundColor: '#f3e8ff' }]}>
                            <FontAwesome name="calendar" size={16} color="#9333ea" />
                        </View>
                        <Text style={styles.cardTitle}>Consultas Anteriores</Text>
                    </View>
                    {paciente.consultas.map((c, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.consultRow, i < paciente.consultas.length - 1 && styles.consultBorder]}
                        >
                            <View style={styles.dateBox}>
                                <Text style={styles.dateMonth}>{c.mes}</Text>
                                <Text style={styles.dateDay}>{c.dia}</Text>
                            </View>
                            <View style={styles.consultInfo}>
                                <Text style={styles.consultTitle}>{c.titulo}</Text>
                                <Text style={styles.consultSub}>{c.doctor} • {c.tipo}</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={12} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.footerSecondary}>
                    <FontAwesome name="map-marker" size={18} color="#64748b" />
                    <Text style={styles.footerSecondaryText}>Ubicación</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerPrimary}>
                    <FontAwesome name="stethoscope" size={18} color="#fff" />
                    <Text style={styles.footerPrimaryText}>Iniciar Consulta</Text>
                </TouchableOpacity>
            </View>
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
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain },
    scrollContent: { padding: spacing.m, paddingBottom: 120 },

    // Bio Card
    bioCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 24,
        alignItems: 'center', marginBottom: spacing.m,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatarLarge: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#e5e7eb' },
    onlineBadge: {
        position: 'absolute', bottom: 4, right: 4,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#fff',
    },
    patientName: { fontSize: 24, fontWeight: 'bold', color: colors.textMain },
    bioMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    bioMetaItem: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' },

    // Vitals
    vitalsRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 16 },
    vitalItem: {
        flex: 1, alignItems: 'center', padding: 12,
        borderRadius: 12, backgroundColor: colors.backgroundLight,
    },
    vitalLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
    vitalValue: { fontSize: 18, fontWeight: 'bold', color: colors.textMain, marginTop: 2 },

    // Actions
    actionsRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 12 },
    actionButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 10, borderRadius: 12,
        backgroundColor: colors.primary + '15',
    },
    actionText: { fontSize: 14, fontWeight: '600', color: colors.primary },

    // Cards
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20,
        marginBottom: spacing.m,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    cardIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 17, fontWeight: 'bold', color: colors.textMain },

    // Reason
    reasonText: { fontSize: 15, color: '#475569', lineHeight: 22 },

    // History
    subHeading: {
        fontSize: 11, fontWeight: '600', color: '#64748b',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4,
    },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    allergyTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    },
    allergyText: { fontSize: 13, fontWeight: '500', color: '#b91c1c' },
    conditionTag: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    conditionText: { fontSize: 13, fontWeight: '500', color: '#475569' },
    noDataText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

    // Consultations
    consultRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    },
    consultBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dateBox: {
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: colors.backgroundLight, alignItems: 'center', justifyContent: 'center',
    },
    dateMonth: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
    dateDay: { fontSize: 18, fontWeight: 'bold', color: colors.textMain, lineHeight: 20 },
    consultInfo: { flex: 1 },
    consultTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textMain },
    consultSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1, borderTopColor: '#e5e7eb',
    },
    footerSecondary: {
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        width: 64, height: 56, borderRadius: 16, backgroundColor: colors.backgroundLight,
    },
    footerSecondaryText: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginTop: 2 },
    footerPrimary: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 56, borderRadius: 16,
        backgroundColor: colors.primary,
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    footerPrimaryText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
