import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

import rootRouter from './routers/RootRouter';

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={rootRouter} />
    </AuthProvider>
  );
};

export default App;
