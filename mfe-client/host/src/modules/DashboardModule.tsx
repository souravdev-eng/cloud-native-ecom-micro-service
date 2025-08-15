import React, { JSX, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mount } from 'dashboard/dashboardApp';

const DashboardModule = (): JSX.Element => {
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const mountRef = useRef<{
    onParentNavigate: (location: { pathname: string }) => void;
  } | null>(null);

  useEffect(() => {
    if (ref.current && !mountRef.current) {
      const result = mount(ref.current, {
        initialPath: location.pathname,
        onNavigation: (childLocation: { pathname: string }) => {
          if (location.pathname !== childLocation.pathname) {
            navigate(childLocation.pathname);
          }
        },
      });

      mountRef.current = result;
    }
  }, []);

  useEffect(() => {
    if (mountRef.current) {
      mountRef.current.onParentNavigate({ pathname: location.pathname });
    }
  }, [location.pathname]);

  return <div ref={ref} />;
};

export default DashboardModule;
