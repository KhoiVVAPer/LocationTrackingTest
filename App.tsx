import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigator} from './src/navigation/AppStack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppProvider from './src/context/AppContext/AppProvider';

const MyTheme = {
  dark: false,
  colors: {
    primary: 'rgb(255, 45, 85)',
    background: 'rgb(242, 242, 242)',
    card: 'rgb(255, 255, 255)',
    text: 'rgb(28, 28, 30)',
    border: 'rgb(199, 199, 204)',
    notification: 'rgb(255, 69, 58)',
  },
};

function App(): React.JSX.Element {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={MyTheme}>
          <AppNavigator
            screenOptions={{
              headerShown: false,
            }}
          />
        </NavigationContainer>
      </SafeAreaProvider>
    </AppProvider>
  );
}

export default App;
