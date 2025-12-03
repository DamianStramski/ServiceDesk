import { AuthProvider } from './context/AuthContext';
import AppRouter from './router';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';

import { AnimatePresence } from 'framer-motion';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <AppRouter />
        </AnimatePresence>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
