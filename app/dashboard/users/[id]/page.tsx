'use client'

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, FileText, MessageSquare, Calendar } from 'lucide-react'
import api from '@/lib/axios'
import { AvatarCircle } from '@/components/AvatarCircle'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageLoader } from '@/components/PageLoader'
import type { UserWithStats } from '@/types'

export default function UserProfilePage() {
  const params = useParams()
  const navigate = useNavigate()
  const id = params.id as string

  const [user, setUser] = useState<UserWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        const response = await api.get<{ data: UserWithStats }>(`/admin/users/${id}`)
        setUser(response.data.data)
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number } }
          if (axiosErr.response?.status === 404) {
            setNotFound(true)
            return
          }
        }
        setError('Failed to load user')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [id])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.delete(`/admin/users/${id}`)
      navigate('/dashboard/users')
    } catch {
      setError('Failed to delete user')
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return <PageLoader />

  if (notFound) {
    return (
      <div className="p-6">
        <Link
          to="/dashboard/users"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Link
          to="/dashboard/users"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="p-6">
      <Link
        to="/dashboard/users"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Profile Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-6">
          <AvatarCircle src={user.avatar} name={user.name} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-card-foreground">{user.name}</h1>
              <StatusBadge status={user.role} />
            </div>
            <p className="mt-1 text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{user.posts_count || 0}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{user.comments_count || 0}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">Joined</p>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <div className="mt-6 border-t border-border pt-6">
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete User
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This will permanently remove their account and all associated data.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
