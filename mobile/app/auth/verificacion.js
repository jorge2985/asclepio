import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import usarStoreAutenticacion from '../../stores/authStore';
import { colors, spacing, borderRadius } from '../../styles/theme';

const LONGITUD_CODIGO = 6;
const TIEMPO_REENVIO = 30; // segundos

export default function PantallaVerificacion() {
    const [codigo, setCodigo] = useState(Array(LONGITUD_CODIGO).fill(''));
    const [timer, setTimer] = useState(TIEMPO_REENVIO);
    const [puedeReenviar, setPuedeReenviar] = useState(false);
    const inputRefs = useRef([]);
    const router = useRouter();
    const { verificarCodigo, reenviarCodigo, verificacionPendiente, cargando, error } = usarStoreAutenticacion();

    // Timer para reenvío
    useEffect(() => {
        if (timer <= 0) {
            setPuedeReenviar(true);
            return;
        }
        const interval = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    // Redirigir si no hay verificación pendiente
    useEffect(() => {
        if (!verificacionPendiente) {
            // Si no venimos del login, volver al login
        }
    }, []);

    const handleChange = (text, index) => {
        // Solo permitir un dígito
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const nuevoCodigo = [...codigo];
        nuevoCodigo[index] = digit;
        setCodigo(nuevoCodigo);

        // Auto-avanzar al siguiente input
        if (digit && index < LONGITUD_CODIGO - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !codigo[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            const nuevoCodigo = [...codigo];
            nuevoCodigo[index - 1] = '';
            setCodigo(nuevoCodigo);
        }
    };

    const handleVerificar = async () => {
        const codigoCompleto = codigo.join('');
        if (codigoCompleto.length !== LONGITUD_CODIGO) return;

        const exito = await verificarCodigo(codigoCompleto);
        if (exito) {
            // Obtener el usuario del store para determinar rol
            setTimeout(() => {
                const { usuario } = usarStoreAutenticacion.getState();
                const destino = usuario?.rol === 'medico' ? '/(doctor)' : '/(tabs)';
                router.replace(destino);
            }, 100);
        }
    };

    const handleReenviar = async () => {
        if (!puedeReenviar) return;
        const exito = await reenviarCodigo();
        if (exito) {
            setCodigo(Array(LONGITUD_CODIGO).fill(''));
            setTimer(TIEMPO_REENVIO);
            setPuedeReenviar(false);
            inputRefs.current[0]?.focus();
        }
    };

    const formatTimer = (s) => {
        const min = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <FontAwesome name="chevron-left" size={18} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Verificación en Dos Pasos</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconGlow} />
                        <View style={styles.iconCircle}>
                            <FontAwesome name="shield" size={40} color={colors.primary} />
                        </View>
                    </View>

                    {/* Headlines */}
                    <Text style={styles.title}>Código de Verificación</Text>
                    <Text style={styles.subtitle}>
                        Ingresa el código que enviamos al correo{' '}
                        <Text style={styles.emailHighlight}>
                            {verificacionPendiente?.email_enmascarado || '***'}
                        </Text>
                    </Text>

                    {/* Code Inputs */}
                    <View style={styles.codeRow}>
                        {codigo.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.codeInput,
                                    digit ? styles.codeInputFilled : null,
                                ]}
                                value={digit}
                                onChangeText={(text) => handleChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textContentType="oneTimeCode"
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    {/* Error */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <FontAwesome name="exclamation-circle" size={14} color="#ef4444" />
                            <Text style={styles.errorText}>{error.message}</Text>
                        </View>
                    )}

                    {/* Verify Button */}
                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            codigo.join('').length !== LONGITUD_CODIGO && styles.verifyButtonDisabled,
                        ]}
                        onPress={handleVerificar}
                        disabled={cargando || codigo.join('').length !== LONGITUD_CODIGO}
                    >
                        <FontAwesome name="check-circle" size={18} color="#fff" />
                        <Text style={styles.verifyButtonText}>
                            {cargando ? 'Verificando...' : 'Verificar'}
                        </Text>
                    </TouchableOpacity>

                    {/* Resend */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendLabel}>¿No recibiste el código?</Text>
                        <TouchableOpacity
                            onPress={handleReenviar}
                            disabled={!puedeReenviar}
                            style={styles.resendButton}
                        >
                            {!puedeReenviar ? (
                                <View style={styles.timerRow}>
                                    <FontAwesome name="clock-o" size={14} color={colors.primary} />
                                    <Text style={styles.timerText}>
                                        Reenviar en {formatTimer(timer)}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.resendText}>Reenviar código</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundLight },
    flex: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: 12,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17, fontWeight: 'bold', color: colors.textMain,
        flex: 1, textAlign: 'center', paddingRight: 40,
    },

    // Content
    content: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: spacing.l, paddingBottom: 40,
    },

    // Icon
    iconContainer: { position: 'relative', marginBottom: 32 },
    iconGlow: {
        position: 'absolute', top: '50%', left: '50%',
        width: 128, height: 128, marginLeft: -64, marginTop: -64,
        borderRadius: 64, backgroundColor: colors.primary + '20',
    },
    iconCircle: {
        width: 128, height: 128, borderRadius: 64,
        backgroundColor: colors.backgroundLight,
        borderWidth: 2, borderColor: colors.primary + '30',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },

    // Headlines
    title: {
        fontSize: 28, fontWeight: '800', color: colors.textMain,
        marginBottom: 8, letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15, color: '#64748b', textAlign: 'center',
        lineHeight: 22, marginBottom: 32, maxWidth: 280,
    },
    emailHighlight: { fontWeight: 'bold', color: colors.textMain },

    // Code
    codeRow: {
        flexDirection: 'row', gap: 8, marginBottom: 24,
    },
    codeInput: {
        width: 48, height: 56, textAlign: 'center',
        borderRadius: 12, backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: '#e2e8f0',
        fontSize: 24, fontWeight: 'bold', color: colors.textMain,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
    },
    codeInputFilled: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '08',
    },

    // Error
    errorContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginBottom: 16, paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: '#fef2f2', borderRadius: 8,
    },
    errorText: { fontSize: 13, color: '#ef4444', fontWeight: '500' },

    // Verify Button
    verifyButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, width: '100%', height: 56, borderRadius: 12,
        backgroundColor: colors.primary,
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
        marginBottom: 24,
    },
    verifyButtonDisabled: { opacity: 0.5 },
    verifyButtonText: { fontSize: 17, fontWeight: 'bold', color: '#fff' },

    // Resend
    resendContainer: { alignItems: 'center', gap: 4 },
    resendLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    resendButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timerText: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
    resendText: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
});
