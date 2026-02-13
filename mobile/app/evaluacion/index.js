
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, fonts, borderRadius } from '../../styles/theme';

export default function PantallaEvaluacion() {
  const router = useRouter();
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');

  // Datos simulados del médico a evaluar
  const doctor = {
    nombre: 'Dr. Marcus Thorne',
    especialidad: 'Cardiología',
    imagen: null, // placeholder
    fecha: '12 Oct'
  };

  const enviarEvaluacion = () => {
    if (calificacion === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona un número de estrellas.');
      return;
    }

    Alert.alert(
      '¡Gracias!',
      'Tu evaluación ha sido enviada correctamente.',
      [
        { text: 'Volver al Inicio', onPress: () => router.replace('/(tabs)') }
      ]
    );
  };

  const volver = () => router.back();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
         <View style={styles.header}>
            <TouchableOpacity onPress={volver} style={styles.backButton}>
                <FontAwesome name="times" size={20} color={colors.textMain} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Calificar Servicio</Text>
            <View style={{ width: 40 }} />
         </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Info del Doctor */}
        <View style={styles.doctorCard}>
            <Image 
                source={{ uri: doctor.imagen || 'https://placehold.co/100' }} 
                style={styles.avatar}
            />
            <Text style={styles.doctorName}>{doctor.nombre}</Text>
            <Text style={styles.specialty}>{doctor.especialidad}</Text>
            <Text style={styles.date}>Consulta del {doctor.fecha}</Text>
        </View>

        {/* Estrellas */}
        <View style={styles.ratingSection}>
            <Text style={styles.question}>¿Cómo fue tu experiencia?</Text>
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setCalificacion(star)}>
                        <FontAwesome 
                            name={star <= calificacion ? "star" : "star-o"} 
                            size={40} 
                            color={colors.warning} 
                            style={styles.starIcon}
                        />
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.ratingLabel}>
                {calificacion === 0 ? 'Toca para calificar' : 
                 calificacion === 5 ? '¡Excelente!' :
                 calificacion >= 4 ? 'Muy buena' : 
                 calificacion >= 3 ? 'Regular' : 'Mala'}
            </Text>
        </View>

        {/* Comentario */}
        <View style={styles.commentSection}>
            <Text style={styles.label}>Deja un comentario (opcional)</Text>
            <TextInput
                style={styles.textArea}
                placeholder="Escribe aquí tu opinión sobre la atención recibida..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={comentario}
                onChangeText={setComentario}
                textAlignVertical="top"
            />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={enviarEvaluacion}>
            <Text style={styles.submitButtonText}>Enviar Evaluación</Text>
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
  scrollContent: {
    padding: spacing.l,
    paddingBottom: 100,
    alignItems: 'center',
  },
  doctorCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.m,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.m,
    backgroundColor: colors.gray[200],
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: spacing.l,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  ratingLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  commentSection: {
    width: '100%',
    marginBottom: spacing.l,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: spacing.m,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.l,
    padding: spacing.m,
    fontSize: 16,
    minHeight: 120,
    color: colors.textMain,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceLight,
    padding: spacing.l,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingBottom: Platform.OS === 'ios' ? 30 : spacing.l,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: borderRadius.l,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
