import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Cookies from 'js-cookie'
import LoginPage from '@/app/login/page'
import DashboardLayout from '@/app/dashboard/layout'
import DashboardPage from '@/app/dashboard/page'
import PostsPage from '@/app/dashboard/posts/page'
import PostDetailPage from '@/app/dashboard/posts/[id]/page'
import CommentsPage from '@/app/dashboard/comments/page'
import CategoriesPage from '@/app/dashboard/categories/page'
import UsersPage from '@/app/dashboard/users/page'
import UserProfilePage from '@/app/dashboard/users/[id]/page'

// Route guard: only allow through when an admin token cookie is present.
function RequireAuth() {
  return Cookies.get('admin_token') ? <Outlet /> : <Navigate to="/login" replace />
}

// Inverse guard: keep authenticated users away from the login page.
function RedirectIfAuth() {
  return Cookies.get('admin_token') ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<RedirectIfAuth />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="posts/:id" element={<PostDetailPage />} />
          <Route path="comments" element={<CommentsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
