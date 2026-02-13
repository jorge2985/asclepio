
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, fonts, borderRadius } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

export default function PantallaSeguimiento() {
    const router = useRouter();
    const [eta, setEta] = useState(15);

    // Simulación de cuenta regresiva
    useEffect(() => {
        const timer = setInterval(() => {
            setEta((prev) => (prev > 1 ? prev - 1 : 1));
        }, 60000); // Reduce 1 min cada 60s simulados
        return () => clearInterval(timer);
    }, []);

    const volver = () => router.back();

    return (
        <View style={styles.container}>
            {/* Mapa de Fondo (Simulado) */}
            <Image
                source={{ uri: 'https://img.freepik.com/free-vector/city-map-navigation-interface-design_1017-31352.jpg?w=1000' }}
                style={styles.mapBackground}
                resizeMode="cover"
            />

            {/* Overlay Oscuro para contraste si es necesario */}
            <View style={styles.mapOverlay} />

            {/* Header Flotante */}
            <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={volver} style={styles.iconButton}>
                        <FontAwesome name="arrow-left" size={20} color={colors.textMain} />
                    </TouchableOpacity>

                    <View style={styles.statusPill}>
                        <View style={styles.statusDotContainer}>
                            <View style={styles.statusDotPing} />
                            <View style={styles.statusDot} />
                        </View>
                        <Text style={styles.statusText}>En camino • {eta} min</Text>
                    </View>

                    <TouchableOpacity style={styles.iconButton}>
                        <FontAwesome name="location-arrow" size={20} color={colors.textMain} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Marcadores Simulados (Iconos sobre el mapa) */}
            <View style={styles.doctorMarker}>
                <View style={styles.markerCircle}>
                    <Image
                        source={{ uri: 'https://placehold.co/50' }}
                        style={styles.markerImage}
                    />
                </View>
                <View style={styles.markerLabel}>
                    <Text style={styles.markerText}>Dr. Ana</Text>
                </View>
            </View>

            <View style={styles.destinationMarker}>
                <FontAwesome name="map-marker" size={40} color={colors.primary} />
            </View>

            {/* Tarjeta Inferior de Información */}
            <View style={styles.bottomCardContainer}>
                <View style={styles.bottomCard}>
                    {/* Drag Handle */}
                    <View style={styles.dragHandle} />

                    <View style={styles.doctorProfile}>
                        <View style={styles.doctorAvatarContainer}>
                            <Image
                                source={{ uri: 'https://placehold.co/100' }}
                                style={styles.doctorAvatar}
                            />
                            <View style={styles.badgeIcon}>
                                <FontAwesome name="user-md" size={12} color={colors.white} />
                            </View>
                        </View>
                        <View style={styles.doctorInfo}>
                            <Text style={styles.doctorName}>Dr. Ana García</Text>
                            <Text style={styles.doctorSpecialty}>Medicina General</Text>
                            <View style={styles.ratingRow}>
                                <FontAwesome name="star" size={12} color={colors.warning} />
                                <Text style={styles.ratingText}>4.9 (120 reseñas)</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{eta} <Text style={styles.statUnit}>min</Text></Text>
                            <Text style={styles.statLabel}>ESTIMADO</Text>
                        </View>
                        <View style={[styles.statItem, styles.statBorder]}>
                            <Text style={styles.statValue}>3.2 <Text style={styles.statUnit}>km</Text></Text>
                            <Text style={styles.statLabel}>DISTANCIA</Text>
                        </View>
                    </View>

                    {/* Destino */}
                    <View style={styles.locationRow}>
                        <View style={styles.locationIcon}>
                            <FontAwesome name="home" size={18} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.locationLabel}>Destino</Text>
                            <Text style={styles.locationAddress}>Av. Reforma 222, Juárez, CDMX</Text>
                        </View>
                    </View>

                    {/* Botones de Acción */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.btnSecondary}>
                            <FontAwesome name="comment" size={18} color={colors.textMain} style={{ marginRight: 8 }} />
                            <Text style={styles.btnTextSecondary}>Mensaje</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnPrimary}>
                            <FontAwesome name="phone" size={18} color={colors.white} style={{ marginRight: 8 }} />
                            <Text style={styles.btnTextPrimary}>Llamar</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
    },
    mapBackground: {
        ...StyleSheet.absoluteFillObject,
        width: width,
        height: height,
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)', // Oscurecer un poco para que resalte la UI
    },
    headerSafeArea: {
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingTop: spacing.s,
    },
    iconButton: {
        width: 40,
        height: 40,
        backgroundColor: colors.white + 'F0', // Con transparencia
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white + 'F0',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: borderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: spacing.s,
    },
    statusDotContainer: {
        position: 'relative',
        width: 10,
        height: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
    },
    statusDotPing: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.success,
        opacity: 0.4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    doctorMarker: {
        position: 'absolute',
        top: '35%',
        left: '30%',
        alignItems: 'center',
    },
    markerCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.white,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    markerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    markerLabel: {
        marginTop: 4,
        backgroundColor: colors.backgroundDark,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    markerText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    destinationMarker: {
        position: 'absolute',
        top: '60%',
        left: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    bottomCardContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.m,
        paddingBottom: Platform.OS === 'ios' ? 34 : spacing.m,
    },
    bottomCard: {
        backgroundColor: colors.white, // Ojo: en referencia era dark, pero mobile theme suele ser light
        borderRadius: borderRadius.xl,
        padding: spacing.l,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.gray[300],
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.m,
    },
    doctorProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.l,
        gap: spacing.m,
    },
    doctorAvatarContainer: {
        position: 'relative',
    },
    doctorAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.gray[200],
    },
    badgeIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: colors.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.white,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    doctorSpecialty: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundLight,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        marginBottom: spacing.l,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statBorder: {
        borderLeftWidth: 1,
        borderLeftColor: colors.gray[300],
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.textMain,
    },
    statUnit: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginTop: 2,
        letterSpacing: 0.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.m,
        marginBottom: spacing.l,
        paddingHorizontal: 4,
    },
    locationIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    locationAddress: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    btnSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.gray[100],
        paddingVertical: 12,
        borderRadius: borderRadius.l,
    },
    btnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: borderRadius.l,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnTextSecondary: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    btnTextPrimary: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.white,
    },
});
