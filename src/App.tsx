import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { IntegrationProvider } from '@/contexts/IntegrationContext';

import { routes } from './routes';

const App: React.FC = () => {
  return (
    <IntegrationProvider>
      <Router>
        <IntersectObserver />
        <Routes>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={route.element}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-center" />
      </Router>
    </IntegrationProvider>
  );
};

export default App;
