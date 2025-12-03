import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import TicketForm from '../pages/TicketForm';
import TicketDetails from '../pages/TicketDetails';
import LandingPage from '../pages/LandingPage';
import ProtectedRoute from './ProtectedRoute';
import PageTransition from './PageTransition';

export default function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <PageTransition>
                        <LandingPage />
                    </PageTransition>
                } />
                <Route path="/login" element={
                    <PageTransition>
                        <Login />
                    </PageTransition>
                } />
                <Route path="/register" element={
                    <PageTransition>
                        <Register />
                    </PageTransition>
                } />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <PageTransition>
                                <Dashboard />
                            </PageTransition>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tickets/new"
                    element={
                        <ProtectedRoute>
                            <PageTransition>
                                <TicketForm />
                            </PageTransition>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tickets/edit/:id"
                    element={
                        <ProtectedRoute>
                            <PageTransition>
                                <TicketForm />
                            </PageTransition>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tickets/:id"
                    element={
                        <ProtectedRoute>
                            <PageTransition>
                                <TicketDetails />
                            </PageTransition>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AnimatePresence>
    );
}
