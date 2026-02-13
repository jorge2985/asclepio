
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../styles/theme';
import { FontAwesome } from '@expo/vector-icons'; // Iconos estándar

export default function TarjetaMedico({ medico, alPresionar }) {
    // medico: { nombre, especialidad, calificacion, ubicacion, tarifa, imagen }

    return (
        <TouchableOpacity style={styles.card} onPress={alPresionar} activeOpacity={0.8}>
            <View style={styles.header}>
                <Image
                    source={{ uri: medico.imagen || 'https://placehold.co/100' }}
                    style={styles.avatar}
                />
                <View style={styles.info}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.name}>{medico.nombre}</Text>
                            <Text style={styles.specialty}>{medico.especialidad}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <FontAwesome name="star" size={14} color={colors.warning} />
                            <Text style={styles.rating}>{medico.calificacion}</Text>
                        </View>
                    </View>

                    <View style={styles.locationContainer}>
                        <FontAwesome name="map-marker" size={12} color={colors.textSecondary} />
                        <Text style={styles.location}>{medico.ubicacion}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.priceTag}>
                    <FontAwesome name="building" size={12} color={colors.textSecondary} />
                    <Text style={styles.priceLabel}>Consultorio</Text>
                    <Text style={styles.price}>${medico.tarifa}</Text>
                </View>
                {/* Podríamos agregar tarifa domicilio si existe */}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.xl,
        padding: spacing.m,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.gray[200],
        // Sombras sutiles
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.l,
        backgroundColor: colors.gray[200],
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    specialty: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.gray[100],
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.m,
    },
    rating: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: spacing.s,
    },
    location: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    footer: {
        marginTop: spacing.m,
        flexDirection: 'row',
        gap: spacing.m,
    },
    priceTag: {
        flex: 1,
        backgroundColor: colors.gray[100],
        borderRadius: borderRadius.l,
        padding: spacing.s,
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.s,
    },
    priceLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        flex: 1,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textMain,
    },
});
