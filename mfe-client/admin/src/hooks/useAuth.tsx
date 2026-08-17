import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store';
import { fetchCurrentUser, signOut } from '../store/actions/user.action';
import { useCallback, useEffect, useRef } from 'react';

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
    const dispatch = useDispatch<AppDispatch>()
    const { userInfo, loading, error } = useSelector((state: RootState) => state.user)
    const isAuthenticated = !!userInfo

    // Both thunks are already handled by the user slice; the hook simply never
    // exposed them, so Sidebar's log-out button and useSignup's post-signup
    // refresh were calling undefined.
    const logout = useCallback(() => dispatch(signOut()), [dispatch])
    const checkAuth = useCallback(() => dispatch(fetchCurrentUser()), [dispatch])

    // Don't dispatch on mount here - AuthProvider handles the initial fetch
    return { isAuthenticated, loading, error, user: userInfo, logout, checkAuth }
};

