import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, fonts, borderRadius } from '../../styles/theme';
import TarjetaMedico from '../../components/TarjetaMedico';
import usarStoreAutenticacion from '../../stores/authStore';

import { servicioDoctores } from '../../services/api';

const categorias = [
    'General', 'Cardiología', 'Dermatología', 'Pediatría',
    'Neurología', 'Oftalmología', 'Traumatología', 'Ginecología'
];

export default function PantallaInicio() {
    const { usuario } = usarStoreAutenticacion();
    const [busqueda, setBusqueda] = useState('');
    const [doctores, setDoctores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const router = useRouter();

    // Cargar doctores reales
    React.useEffect(() => {
        cargarDoctores();
    }, []);

    // Efecto de búsqueda (debounce simple)
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            cargarDoctores(busqueda);
        }, 500);
        return () => clearTimeout(timeout);
    }, [busqueda]);

    const cargarDoctores = async (query = '') => {
        try {
            // setCargando(true); // Opcional: mostrar spinner
            const respuesta = await servicioDoctores.listar(query);
            setDoctores(respuesta.data || []);
        } catch (error) {
            console.error('Error cargando doctores', error);
        } finally {
            setCargando(false);
        }
    };

    const verDetalleMedico = (id) => {
        router.push(`/medico/${id}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hola,</Text>
                        <Text style={styles.userName}>{usuario?.nombre_completo || 'Paciente'}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        {/* Avatar Placeholder */}
                        <FontAwesome name="user-circle" size={40} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Cita en Curso (Nueva Adición Fase 10) */}
                <TouchableOpacity
                    style={styles.activeAppointmentCard}
                    onPress={() => router.push('/seguimiento')}
                >
                    <View style={styles.activeCardHeader}>
                        <Text style={styles.activeCardTitle}>Cita en Curso</Text>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>En camino</Text>
                        </View>
                    </View>
                    <View style={styles.activeCardContent}>
                        <Image
                            source={{ uri: 'https://placehold.co/50' }}
                            style={styles.activeDoctorAvatar}
                        />
                        <View>
                            <Text style={styles.activeDoctorName}>Dr. Ana García</Text>
                            <Text style={styles.activeTime}>Llegada en 15 min</Text>
                        </View>
                        <FontAwesome name="chevron-right" size={16} color={colors.white} style={{ marginLeft: 'auto' }} />
                    </View>
                </TouchableOpacity>

                {/* Buscador */}
                <View style={styles.searchContainer}>
                    <FontAwesome name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar doctor, especialidad..."
                        placeholderTextColor={colors.textSecondary}
                        value={busqueda}
                        onChangeText={setBusqueda}
                    />
                </View>

                {/* Categorías */}
                <View style={styles.categoriesSection}>
                    <Text style={styles.sectionTitle}>Especialidades</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesList}>
                        {categorias.map((cat, index) => (
                            <TouchableOpacity key={index} style={styles.categoryChip}>
                                <Text style={styles.categoryText}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Doctores Recomendados */}
                <View style={styles.doctorsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recomendados</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.doctorsList}>
                        <View style={styles.doctorsList}>
                            {doctores.map((doc) => (
                                <TarjetaMedico
                                    key={doc.id}
                                    medico={{
                                        id: doc.id,
                                        nombre: doc.nombre_completo,
                                        especialidad: doc.especialidad,
                                        imagen: null, // Placeholder por ahora
                                        calificacion: doc.calificacion,
                                        ubicacion: doc.ubicacion || 'Consultorio Privado'
                                    }}
                                    alPresionar={() => verDetalleMedico(doc.id)}
                                />
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
    },
    scrollContent: {
        padding: spacing.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    greeting: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    userName: {
        fontSize: 24,
        fontFamily: fonts.display,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.m,
        height: 50,
        marginBottom: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activeAppointmentCard: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.xl,
        padding: spacing.m,
        marginBottom: spacing.l,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    activeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.s,
    },
    activeCardTitle: {
        color: colors.white,
        fontWeight: 'bold',
        opacity: 0.9,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        gap: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80', // Green 400
    },
    liveText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    activeCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    activeDoctorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    activeDoctorName: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    activeTime: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    searchIcon: {
        marginRight: spacing.s,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.textMain,
        height: '100%',
    },
    categoriesSection: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textMain,
        marginBottom: spacing.m,
    },
    seeAll: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    categoriesList: {
        flexDirection: 'row',
    },
    categoryChip: {
        backgroundColor: colors.primary + '15', // 15% opacity hex
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.s,
        borderRadius: borderRadius.l,
        marginRight: spacing.s,
    },
    categoryText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    doctorsSection: {
        flex: 1,
    },
});
