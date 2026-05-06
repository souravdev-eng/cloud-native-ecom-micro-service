import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store';
import { fetchCurrentUser } from '../store/actions/user.action';
import { useEffect, useRef } from 'react';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useDispatch<AppDispatch>()
    const hasFetched = useRef(false)

    useEffect(() => {
        // Fetch current user only once on app initialization
        if (!hasFetched.current) {
            hasFetched.current = true
            dispatch(fetchCurrentUser())
        }
    }, [dispatch])

    // AuthProvider only fetches user data - redirects are handled by ProtectedRoute
    return <>{children}</>
}

export const useAuth = () => {
    const { userInfo, loading, error } = useSelector((state: RootState) => state.user)
    const isAuthenticated = !!userInfo

    // Don't dispatch here - AuthProvider handles the initial fetch
    return { isAuthenticated, loading, error, user: userInfo }
};

