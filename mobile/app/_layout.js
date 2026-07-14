// Layout raiz de Expo Router.
//
// Slot renderiza la ruta activa. Las carpetas (tabs) y (doctor) definen layouts
// propios para la navegacion de paciente y medico.
import { Slot } from 'expo-router';

export default function RootLayout() {
    return <Slot />;
}
