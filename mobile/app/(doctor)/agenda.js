import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AgendaDoctor() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Agenda</Text>
            <Text style={styles.subtitle}>Próximamente</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f8f8' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#0d1b1a' },
    subtitle: { fontSize: 16, color: '#4c9a93', marginTop: 8 },
});
