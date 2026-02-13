
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, fonts, borderRadius } from '../../styles/theme';

export default function SeleccionPagoScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [metodoSeleccionado, setMetodoSeleccionado] = useState('tarjeta');

    const confirmarPago = () => {
        // Aquí iría la lógica real de pago
        router.replace('/pago/exito');
    };

    const volver = () => router.back();

    const OpcionPago = ({ id, icon, etiqueta, subetiqueta }) => (
        <TouchableOpacity
            style={[styles.paymentOption, metodoSeleccionado === id && styles.optionSelected]}
            onPress={() => setMetodoSeleccionado(id)}
        >
            <View style={styles.optionIconContainer}>
                <FontAwesome name={icon} size={24} color={metodoSeleccionado === id ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.optionTextContainer}>
                <Text style={[styles.optionLabel, metodoSeleccionado === id && styles.textSelected]}>{etiqueta}</Text>
                {subetiqueta && <Text style={[styles.optionSubLabel, metodoSeleccionado === id && styles.textSelected]}>{subetiqueta}</Text>}
            </View>
            <View style={styles.radioContainer}>
                <View style={[styles.radioButton, metodoSeleccionado === id && styles.radioSelected]}>
                    {metodoSeleccionado === id && <View style={styles.radioInner} />}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={volver} style={styles.backButton}>
                        <FontAwesome name="arrow-left" size={20} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Método de Pago</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Resumen de Orden */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Consulta Médica</Text>
                        <Text style={styles.summaryValue}>$45.00</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tarifa de Servicio</Text>
                        <Text style={styles.summaryValue}>$2.50</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total a Pagar</Text>
                        <Text style={styles.totalValue}>$47.50</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Selecciona un método</Text>

                <OpcionPago
                    id="tarjeta"
                    icon="credit-card"
                    etiqueta="Tarjeta de Crédito / Débito"
                    subetiqueta="Visa, Mastercard, Amex"
                />
                <OpcionPago
                    id="apple"
                    icon="apple"
                    etiqueta="Apple Pay"
                />
                <OpcionPago
                    id="google"
                    icon="google"
                    etiqueta="Google Pay"
                />
                <OpcionPago
                    id="efectivo"
                    icon="money"
                    etiqueta="Efectivo en consulta"
                    subetiqueta="Pagar al llegar"
                />

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.payButton} onPress={confirmarPago}>
                    <Text style={styles.payButtonText}>Pagar Ahora</Text>
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
    content: {
        padding: spacing.l,
        paddingBottom: 100,
    },
    summaryCard: {
        backgroundColor: colors.white,
        padding: spacing.l,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textMain,
        marginBottom: spacing.m,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.s,
    },
    summaryLabel: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    summaryValue: {
        color: colors.textMain,
        fontWeight: '600',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray[200],
        marginVertical: spacing.s,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textMain,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textMain,
        marginBottom: spacing.m,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.gray[200],
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '08', // Muy tenue
    },
    optionIconContainer: {
        width: 40,
        alignItems: 'center',
    },
    optionTextContainer: {
        flex: 1,
        paddingHorizontal: spacing.m,
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textMain,
    },
    optionSubLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    textSelected: {
        color: colors.primary,
    },
    radioContainer: {
        padding: spacing.s,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.gray[300],
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.white,
        padding: spacing.l,
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
        paddingBottom: Platform.OS === 'ios' ? 30 : spacing.l,
    },
    payButton: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        alignItems: 'center',
    },
    payButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
