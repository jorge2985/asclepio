
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, fonts, borderRadius } from '../../styles/theme';

export default function PagoExitosoScreen() {
    const router = useRouter();

    const volverAlInicio = () => {
        // replace para no poder volver atrás al éxito
        router.replace('/(tabs)');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>

                {/* Icono animado (simulado estático por ahora) */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <FontAwesome name="check" size={50} color={colors.white} />
                    </View>
                </View>

                <Text style={styles.title}>¡Pago Exitoso!</Text>
                <Text style={styles.message}>
                    Tu cita ha sido confirmada correctamente.
                </Text>

                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Detalles de la Cita</Text>
                    <Text style={styles.doctorName}>Dr. Marcus Thorne</Text>
                    <Text style={styles.detailText}>Cardiología</Text>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <FontAwesome name="calendar" size={14} color={colors.textSecondary} />
                        <Text style={styles.rowText}>Lun, 12 Oct</Text>
                    </View>
                    <View style={styles.row}>
                        <FontAwesome name="clock-o" size={14} color={colors.textSecondary} />
                        <Text style={styles.rowText}>09:00 AM</Text>
                    </View>
                </View>

            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.homeButton} onPress={volverAlInicio}>
                    <Text style={styles.buttonText}>Volver al Inicio</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    content: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: spacing.xl,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontFamily: fonts.display,
        fontWeight: 'bold',
        color: colors.textMain,
        marginBottom: spacing.s,
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xxl,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: colors.white,
        padding: spacing.l,
        borderRadius: borderRadius.l,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    detailsTitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: spacing.m,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    detailText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.m,
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray[200],
        marginBottom: spacing.m,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        marginBottom: spacing.xs,
    },
    rowText: {
        fontSize: 15,
        color: colors.textMain,
    },
    footer: {
        marginBottom: spacing.l,
    },
    homeButton: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
