import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppContainer, createContainer } from './container';

const DIContext = createContext<AppContainer | null>(null);

export const DIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [container] = useState<AppContainer>(() => createContainer());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await container.seedDefaultCategories.execute();
      } catch (err) {
        console.error('Falha ao inicializar categorias padrão:', err);
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, [container]);

  if (!isReady) {
    return null;
  }

  return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
};

export function useDI(): AppContainer {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDI deve ser usado dentro de um DIProvider');
  }
  return context;
}
