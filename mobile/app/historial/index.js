
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../styles/theme';

import { servicioCitas } from '../../services/api';

export default function PantallaHistorial() {
    const router = useRouter();
    const [historial, setHistorial] = React.useState([]);
    const [cargando, setCargando] = React.useState(true);

    React.useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        try {
            const respuesta = await servicioCitas.historial();
            const citas = respuesta.data || [];
            const agrupado = agruparPorMes(citas);
            setHistorial(agrupado);
        } catch (error) {
            console.error('Error cargando historial', error);
        } finally {
            setCargando(false);
        }
    };

    const agruparPorMes = (citas) => {
        if (citas.length === 0) return [];

        const grupos = citas.reduce((acc, cita) => {
            const fecha = new Date(cita.fecha_hora);
            const llaveMes = new Intl.DateTimeFormat('es-ES', {
                month: 'long',
                year: 'numeric',
            }).format(fecha);

            if (!acc[llaveMes]) {
                acc[llaveMes] = [];
            }

            acc[llaveMes].push({
                id: cita.id,
                doctor: cita.medico_nombre || 'Doctor',
                fecha: fecha.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                }),
                especialidad: cita.medico_especialidad || 'General',
                tipo: cita.direccion_atencion ? 'Domicilio' : 'Consultorio',
                imagen: null,
                accion: cita.estado === 'completada' ? 'Calificar' : 'Ver Detalles',
            });

            return acc;
        }, {});

        return Object.entries(grupos).map(([mes, citasMes]) => ({
            mes,
            citas: citasMes,
        }));
    };

    const volver = () => router.back();

    if (cargando) {
        return (
            <View style={styles.container}>
                <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={volver} style={styles.backButton}>
                            <FontAwesome name="arrow-left" size={20} color={colors.textMain} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Historial Médico</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>Cargando historial...</Text>
                </View>
            </View>
        );
    }

    const TarjetaCita = ({ cita }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: cita.imagen || 'https://placehold.co/60' }}
                    style={styles.avatar}
                />
                <View style={styles.info}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.doctorName}>{cita.doctor}</Text>
                        <Text style={styles.date}>{cita.fecha}</Text>
                    </View>
                    <Text style={styles.specialty}>{cita.especialidad}</Text>
                    <View style={styles.typeContainer}>
                        <FontAwesome
                            name={cita.tipo === 'Consultorio' ? 'building-o' : 'home'}
                            size={12}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.typeText}>{cita.tipo}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        cita.accion === 'Calificar' ? styles.btnSecondary : styles.btnPrimary
                    ]}
                    onPress={() => {
                        if (cita.accion === 'Calificar') {
                            router.push('/evaluacion');
                        } else {
                            // Lógica para Repetir Cita
                        }
                    }}
                >
                    <FontAwesome
                        name={cita.accion === 'Calificar' ? 'star-o' : 'refresh'}
                        size={14}
                        color={cita.accion === 'Calificar' ? colors.warning : colors.white}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[
                        styles.actionText,
                        cita.accion === 'Calificar' ? styles.textWarning : styles.textWhite
                    ]}>{cita.accion}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={volver} style={styles.backButton}>
                        <FontAwesome name="arrow-left" size={20} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Historial Médico</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {!cargando && historial.length === 0 && (
                    <Text style={styles.emptyText}>Aún no tienes citas registradas.</Text>
                )}

                {historial.map((grupo, index) => (
                    <View key={index} style={styles.monthSection}>
                        <View style={styles.monthHeader}>
                            <Text style={styles.monthTitle}>{grupo.mes}</Text>
                            <View style={styles.monthline} />
                        </View>

                        {grupo.citas.map((cita) => (
                            <TarjetaCita key={cita.id} cita={cita} />
                        ))}
                    </View>
                ))}
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
        padding: spacing.l,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthSection: {
        marginBottom: spacing.l,
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
        gap: spacing.m,
    },
    monthTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    monthline: {
        flex: 1,
        height: 1,
        backgroundColor: colors.gray[200],
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.l,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.m,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.gray[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.gray[100],
    },
    info: {
        flex: 1,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    doctorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    date: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    specialty: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '500',
        marginBottom: 4,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    typeText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray[100],
        marginVertical: spacing.m,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: spacing.l,
        borderRadius: borderRadius.l,
    },
    btnPrimary: {
        backgroundColor: colors.primary,
    },
    btnSecondary: {
        backgroundColor: colors.primary + '15', // Transparent primary
    },
    textWhite: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 13,
    },
    textPrimary: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    textWarning: {
        color: colors.warning,
        fontWeight: '600',
        fontSize: 13,
    },
});
