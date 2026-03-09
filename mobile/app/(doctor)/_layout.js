
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const doctorColors = {
    primary: '#13ecda',
    primaryDark: '#0ebcb0',
    textSecondary: '#4c9a93',
};

export default function LayoutDoctor() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: doctorColors.primaryDark,
                tabBarInactiveTintColor: '#9ca3af',
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 10,
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 10,
                    backgroundColor: '#ffffff',
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color }) => <FontAwesome name="th-large" size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="agenda"
                options={{
                    title: 'Agenda',
                    tabBarIcon: ({ color }) => <FontAwesome name="calendar" size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chat',
                    tabBarIcon: ({ color }) => <FontAwesome name="comment" size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} />,
                }}
            />
        </Tabs>
    );
}
