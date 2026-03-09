
import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../styles/theme';

import { servicioCitas, servicioDoctores } from '../../services/api';

export default function DetalleMedicoScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Estado local
    const [medico, setMedico] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Estado para la reserva
    const [tipoVisita, setTipoVisita] = useState('clinica'); // 'clinica' | 'domicilio'
    const [fechaSeleccionada, setFechaSeleccionada] = useState(0); // Índice del día
    const [horaSeleccionada, setHoraSeleccionada] = useState(null);
    const [reservando, setReservando] = useState(false);

    React.useEffect(() => {
        if (id) {
            cargarMedico();
        }
    }, [id]);

    const cargarMedico = async () => {
        try {
            const respuesta = await servicioDoctores.obtener(id);
            setMedico(respuesta.data);
        } catch (error) {
            console.error('Error cargando médico', error);
        } finally {
            setCargando(false);
        }
    };

    if (cargando || !medico) {
        return <View style={styles.container}><Text style={{ padding: 20 }}>Cargando...</Text></View>;
    }

    const fechas = [
        { dia: 'Lun', fecha: '12' },
        { dia: 'Mar', fecha: '13' },
        { dia: 'Mié', fecha: '14' },
        { dia: 'Jue', fecha: '15' },
        { dia: 'Vie', fecha: '16' },
    ];

    const horarios = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

    const volver = () => router.back();

    const crearFechaHoraISO = () => {
        if (!horaSeleccionada) return null;

        const [horaBase, minutos] = horaSeleccionada.slice(0, 5).split(':').map(Number);
        const esPM = horaSeleccionada.includes('PM');
        const hora24 = (horaBase % 12) + (esPM ? 12 : 0);

        const objetivo = new Date();
        objetivo.setHours(hora24, minutos, 0, 0);
        objetivo.setDate(objetivo.getDate() + fechaSeleccionada);

        return objetivo.toISOString();
    };

    const reservarCita = async () => {
        if (!horaSeleccionada) {
            Alert.alert('Selecciona una hora', 'Debes elegir un horario para continuar.');
            return;
        }

        const fechaHora = crearFechaHoraISO();
        const payload = {
            medico_id: medico.id,
            fecha_hora: fechaHora,
            motivo: `Reserva desde app (${tipoVisita})`,
            direccion: tipoVisita === 'domicilio' ? 'Domicilio del paciente' : '',
        };

        try {
            setReservando(true);
            const respuesta = await servicioCitas.crear(payload);
            router.push({
                pathname: '/pago/seleccion',
                params: {
                    citaId: respuesta.data?.id,
                    medicoNombre: medico.nombre_completo,
                    especialidad: medico.especialidad,
                    fechaHora,
                },
            });
        } catch (error) {
            console.error('Error creando cita', error);
            Alert.alert('No se pudo reservar', 'Inténtalo nuevamente en unos minutos.');
        } finally {
            setReservando(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Fijo con Navegación */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={volver} style={styles.backButton}>
                        <FontAwesome name="arrow-left" size={20} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalle del Médico</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Perfil del Médico */}
                <View style={styles.profileSection}>
                    <Image
                        source={{ uri: medico.imagen || 'https://placehold.co/150' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{medico.nombre_completo}</Text>
                    <Text style={styles.specialty}>{medico.especialidad}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <View style={styles.ratingBadge}>
                                <FontAwesome name="star" size={12} color={colors.white} />
                            </View>
                            <Text style={styles.statValue}>{medico.calificacion}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <View style={[styles.ratingBadge, { backgroundColor: colors.success }]}>
                                <FontAwesome name="comment" size={12} color={colors.white} />
                            </View>
                            <Text style={styles.statValue}>120+</Text>
                            <Text style={styles.statLabel}>Reseñas</Text>
                        </View>
                    </View>
                </View>

                {/* Biografía */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acerca de</Text>
                    <Text style={styles.bioText}>{medico.biografia}</Text>
                </View>

                {/* Tipo de Visita */}
                <View style={styles.section}>
                    <View style={styles.visitTypeContainer}>
                        <TouchableOpacity
                            style={[styles.visitTypeOption, tipoVisita === 'clinica' && styles.visitTypeSelected]}
                            onPress={() => setTipoVisita('clinica')}
                        >
                            <Text style={[styles.visitTypeName, tipoVisita === 'clinica' && styles.textSelected]}>Visita Clínica</Text>
                            <Text style={[styles.visitTypePrice, tipoVisita === 'clinica' && styles.textSelected]}>${medico.tarifa_hora}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.visitTypeOption, tipoVisita === 'domicilio' && styles.visitTypeSelected]}
                            onPress={() => setTipoVisita('domicilio')}
                        >
                            <Text style={[styles.visitTypeName, tipoVisita === 'domicilio' && styles.textSelected]}>Visita Domicilio</Text>
                            <Text style={[styles.visitTypePrice, tipoVisita === 'domicilio' && styles.textSelected]}>${(medico.tarifa_hora * 1.5).toFixed(2)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Calendario */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Disponibilidad</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
                        {fechas.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.dateCard, fechaSeleccionada === index && styles.dateCardSelected]}
                                onPress={() => setFechaSeleccionada(index)}
                            >
                                <Text style={[styles.dateDay, fechaSeleccionada === index && styles.textSelected]}>{item.dia}</Text>
                                <Text style={[styles.dateNum, fechaSeleccionada === index && styles.textSelected]}>{item.fecha}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.timeGrid}>
                        {horarios.map((hora, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.timeSlot, horaSeleccionada === hora && styles.timeSlotSelected]}
                                onPress={() => setHoraSeleccionada(hora)}
                            >
                                <Text style={[styles.timeText, horaSeleccionada === hora && styles.textSelected]}>{hora}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* Footer Botón Reserva */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.bookButton, reservando && styles.bookButtonDisabled]}
                    onPress={reservarCita}
                    disabled={reservando}
                >
                    <Text style={styles.bookButtonText}>{reservando ? 'Reservando...' : 'Reservar Cita'}</Text>
                </TouchableOpacity>
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
    },
    backButton: {
        padding: spacing.s,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    scrollContent: {
        paddingBottom: 100, // Espacio para el footer
    },
    profileSection: {
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.surfaceLight,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
        marginBottom: spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: spacing.m,
        backgroundColor: colors.gray[200],
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textMain,
        marginBottom: 4,
    },
    specialty: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.l,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        justifyContent: 'space-around',
    },
    stat: {
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: colors.gray[200],
    },
    ratingBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.warning,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    section: {
        padding: spacing.l,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textMain,
        marginBottom: spacing.m,
    },
    bioText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    visitTypeContainer: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    visitTypeOption: {
        flex: 1,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.gray[200],
        alignItems: 'center',
        backgroundColor: colors.surfaceLight,
    },
    visitTypeSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    visitTypeName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMain,
        marginBottom: 4,
    },
    visitTypePrice: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    textSelected: {
        color: colors.white,
    },
    datesScroll: {
        flexDirection: 'row',
        marginBottom: spacing.l,
    },
    dateCard: {
        width: 60,
        height: 70,
        borderRadius: borderRadius.l,
        backgroundColor: colors.surfaceLight,
        borderWidth: 1,
        borderColor: colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.s,
    },
    dateCardSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dateDay: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    dateNum: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    timeSlot: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.l,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.gray[200],
        backgroundColor: colors.surfaceLight,
    },
    timeSlotSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    timeText: {
        fontSize: 13,
        color: colors.textMain,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surfaceLight,
        padding: spacing.l,
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
        paddingBottom: Platform.OS === 'ios' ? 30 : spacing.l,
    },
    bookButton: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        alignItems: 'center',
    },
    bookButtonDisabled: {
        opacity: 0.7,
    },
    bookButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
