

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { validarLogin } from '../utils/validation';
import { colors, spacing, fonts, borderRadius } from '../styles/theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errores, setErrores] = useState({});
    const { login, inicializar, usuario, cargando, error } = useAuth();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        inicializar();
    }, []);

    // Redirigir si ya está autenticado
    useEffect(() => {
        const navigationReady = rootNavigationState?.key;
        if (usuario && !cargando && navigationReady) {
            router.replace('/(tabs)');
        }
    }, [usuario, cargando, rootNavigationState?.key]);

    const handleLogin = async () => {
        // Validar formulario
        const validacion = validarLogin({ email, password });
        if (!validacion.valido) {
            setErrores(validacion.errores);
            return;
        }

        setErrores({});
        const exito = await login(email, password);
        if (exito) {
            // Pequeño delay para asegurar que el layout esté montado
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 100);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            enabled={Platform.OS !== 'web'}
            style={styles.container}
        >
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    {/* Placeholder for Logo */}
                    <Text style={styles.logoText}>Asclepio</Text>
                </View>
                <Text style={styles.title}>Bienvenido</Text>
                <Text style={styles.subtitle}>Inicia sesión para gestionar tu salud</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, errores.email && styles.inputError]}
                        placeholder="nombre@ejemplo.com"
                        placeholderTextColor={colors.textSecondary}
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errores.email) {
                                setErrores({ ...errores, email: null });
                            }
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    {errores.email && <Text style={styles.errorText}>{errores.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={[styles.input, errores.password && styles.inputError]}
                        placeholder="********"
                        placeholderTextColor={colors.textSecondary}
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errores.password) {
                                setErrores({ ...errores, password: null });
                            }
                        }}
                        secureTextEntry
                    />
                    {errores.password && <Text style={styles.errorText}>{errores.password}</Text>}
                </View>

                {error && <Text style={styles.errorText}>{error.message || 'Error al iniciar sesión'}</Text>}

                <TouchableOpacity
                    style={[styles.button, cargando && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={cargando}
                >
                    <Text style={styles.buttonText}>{cargando ? 'Cargando...' : 'Iniciar Sesión'}</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿No tienes cuenta?</Text>
                    <TouchableOpacity onPress={() => router.push('/auth/registro')}>
                        <Text style={styles.linkText}>Regístrate</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        padding: spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logoContainer: {
        width: 60,
        height: 60,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    logoText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 10,
    },
    title: {
        fontSize: 28,
        fontFamily: fonts.display,
        fontWeight: 'bold',
        color: colors.textMain,
        marginTop: spacing.s,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: spacing.l,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMain,
        marginBottom: spacing.s,
    },
    input: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.gray[200],
        borderRadius: borderRadius.l,
        padding: spacing.m,
        fontSize: 16,
        color: colors.textMain,
    },
    inputError: {
        borderColor: colors.error,
        borderWidth: 2,
    },
    button: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        alignItems: 'center',
        marginTop: spacing.s,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: colors.error,
        marginBottom: spacing.m,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
        gap: spacing.s,
    },
    footerText: {
        color: colors.textSecondary,
    },
    linkText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});
