import { Tabs } from 'expo-router';
import { Clock3, House } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

import Colors from '@/constants/Colors';
import { Theme } from '@/constants/Theme';

export default function TabLayout() {
  const colorScheme = useColorScheme() === 'light' ? 'light' : 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Theme.colors.alphaTabBackground,
          borderTopColor: Theme.colors.alphaTabBorder,
          height: 66,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recognize',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Clock3 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
