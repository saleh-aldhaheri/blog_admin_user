'use client'

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import api from '@/lib/axios'
import { SearchInput } from '@/components/SearchInput'
import { DataTable, Column } from '@/components/DataTable'
import { Pagination } from '@/components/Pagination'
import { StatusBadge } from '@/components/StatusBadge'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageLoader } from '@/components/PageLoader'
import type { UserWithStats, PaginatedResponse } from '@/types'

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [meta, setMeta] = useState<{ next_cursor: string | null; prev_cursor: string | null }>({
    next_cursor: null,
    prev_cursor: null,
  })
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (cursor) params.cursor = cursor
      if (search) params.search = search

      const response = await api.get<PaginatedResponse<UserWithStats>>('/admin/users', { params })
      setUsers(response.data.data)
      setMeta({
        next_cursor: response.data.meta.next_cursor,
        prev_cursor: response.data.meta.prev_cursor,
      })
    } catch {
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [search, cursor])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (value: string) => {
    setSearch(value)
    setCursor(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await api.delete(`/admin/users/${deleteId}`)
      setDeleteId(null)
      fetchUsers()
    } catch {
      setError('Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<UserWithStats>[] = [
    {
      key: 'avatar',
      header: '',
      className: 'w-12',
      render: (user) => (
        <AvatarCircle src={user.avatar} name={user.name} size="sm" />
      ),
    },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (user) => <StatusBadge status={user.role} />,
    },
    { key: 'posts_count', header: 'Posts' },
    {
      key: 'created_at',
      header: 'Joined',
      render: (user) => new Date(user.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/dashboard/users/${user.id}`}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(user.id)}
            className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
      </div>

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search users..."
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            keyExtractor={(user) => user.id}
            emptyMessage="No users found"
          />

          <div className="mt-4">
            <Pagination
              prevCursor={meta.prev_cursor}
              nextCursor={meta.next_cursor}
              onPrev={() => setCursor(meta.prev_cursor)}
              onNext={() => setCursor(meta.next_cursor)}
              isLoading={isLoading}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This will permanently remove their account and all associated data."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
