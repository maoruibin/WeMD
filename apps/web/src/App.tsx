import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/global.css';
import './App.css';

import { EditorPage } from './pages/EditorPage';
import { ShowcasePage } from './pages/ShowcasePage';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'premium-toast',
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#1a1a1a',
            boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.12)',
            borderRadius: '50px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid rgba(0, 0, 0, 0.05)',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#07c160',
              secondary: '#fff',
            },
            duration: 2000,
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            duration: 3000,
          },
        }}
      />
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
