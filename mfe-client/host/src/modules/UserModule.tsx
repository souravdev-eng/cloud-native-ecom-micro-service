import { JSX } from 'react';
import { mount } from 'user/UserApp';

import { useRemoteMount } from './useRemoteMount';

const UserModule = (): JSX.Element => {
	const ref = useRemoteMount(mount);
	return <div ref={ref} />;
};

export default UserModule;
