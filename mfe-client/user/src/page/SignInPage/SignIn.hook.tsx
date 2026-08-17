import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { userServiceApi } from '../../api/baseUrl';
import { parseErrorMessage } from '../../utils/parseError';

export const useSignIn = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	// Set by the 401 interceptor in api/baseUrl.ts so an expired session returns
	// to the page it interrupted. Only same-app paths are honoured — an absolute
	// URL here would be an open redirect.
	const nextParam = searchParams.get('next');
	const redirectTo = nextParam?.startsWith('/') && !nextParam.startsWith('//')
		? nextParam
		: '/';

	const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const response = await userServiceApi.post('/login', formData);
			if (response.status === 200) {
				navigate(redirectTo);
			}
		} catch (error: any) {
			setLoading(false);
			setError(parseErrorMessage(error));
		}
	};

	const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return {
		formData,
		loading,
		error,
		redirectTo,
		handleFieldChange,
		handleSignIn,
	};
};
