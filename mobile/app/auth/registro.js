
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, fonts, borderRadius } from '../../styles/theme';
import usarStoreAutenticacion from '../../stores/authStore';

export default function RegistroScreen() {
    const router = useRouter();
    const { registro, cargando, error } = usarStoreAutenticacion();

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [telefono, setTelefono] = useState('');

    const manejarRegistro = async () => {
        if (!nombre || !email || !password) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const datos = {
            email,
            password,
            nombre_completo: nombre,
            rol: 'paciente', // Por defecto paciente
            telefono
        };

        const exito = await registro(datos);
        if (exito) {
            Alert.alert('Éxito', 'Cuenta creada correctamente. Por favor inicia sesión.', [
                { text: 'OK', onPress: () => router.replace('/') }
            ]);
        }
    };

    const irALogin = () => router.back();

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <TouchableOpacity onPress={irALogin} style={styles.backButton}>
                        <FontAwesome name="arrow-left" size={20} color={colors.textMain} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Crear Cuenta</Text>
                        <Text style={styles.subtitle}>Únete a Asclepio para gestionar tu salud</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre Completo *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Juan Pérez"
                                placeholderTextColor={colors.textSecondary}
                                value={nombre}
                                onChangeText={setNombre}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="nombre@ejemplo.com"
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Teléfono</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+55 1234 5678"
                                placeholderTextColor={colors.textSecondary}
                                value={telefono}
                                onChangeText={setTelefono}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contraseña *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="********"
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {error && <Text style={styles.errorText}>{error.message || 'Error al registrarse'}</Text>}

                        <TouchableOpacity
                            style={[styles.button, cargando && styles.buttonDisabled]}
                            onPress={manejarRegistro}
                            disabled={cargando}
                        >
                            <Text style={styles.buttonText}>{cargando ? 'Creando cuenta...' : 'Registrarse'}</Text>
                        </TouchableOpacity>

                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
                        <TouchableOpacity onPress={irALogin}>
                            <Text style={styles.linkText}>Inicia Sesión</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
    },
    scrollContent: {
        padding: spacing.l,
        paddingTop: 60, // Espacio para status bar
    },
    backButton: {
        marginBottom: spacing.l,
    },
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: fonts.display,
        color: colors.textMain,
        marginBottom: spacing.s,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    form: {
        marginBottom: spacing.xl,
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
    button: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        alignItems: 'center',
        marginTop: spacing.s,
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
        marginBottom: spacing.xl,
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
