import { JSX } from 'react';
import { mount } from 'dashboard/dashboardApp';

import { useRemoteMount } from './useRemoteMount';

const DashboardModule = (): JSX.Element => {
	const ref = useRemoteMount(mount);
	return <div ref={ref} />;
};

export default DashboardModule;
