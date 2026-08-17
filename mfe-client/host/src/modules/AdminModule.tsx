import { JSX } from 'react';
import { mount } from 'admin/adminApp';

import { useRemoteMount } from './useRemoteMount';

const AdminModule = (): JSX.Element => {
	const ref = useRemoteMount(mount);
	return <div ref={ref} />;
};

export default AdminModule;
