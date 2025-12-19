import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

// import './index.css';
import router from './Router';

const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);

root.render(<RouterProvider router={router} />);
