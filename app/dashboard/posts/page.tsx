'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Eye, Trash2 } from 'lucide-react'
import api from '@/lib/axios'
import { SearchInput } from '@/components/SearchInput'
import { DataTable, Column } from '@/components/DataTable'
import { Pagination } from '@/components/Pagination'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageLoader } from '@/components/PageLoader'
import type { Post, PaginatedResponse } from '@/types'

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
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

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (cursor) params.cursor = cursor
      if (search) params.search = search

      const response = await api.get<PaginatedResponse<Post>>('/admin/posts', { params })
      setPosts(response.data.data)
      setMeta({
        next_cursor: response.data.meta.next_cursor,
        prev_cursor: response.data.meta.prev_cursor,
      })
    } catch {
      setError('Failed to load posts')
    } finally {
      setIsLoading(false)
    }
  }, [search, cursor])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleSearch = (value: string) => {
    setSearch(value)
    setCursor(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await api.delete(`/admin/posts/${deleteId}`)
      setDeleteId(null)
      fetchPosts()
    } catch {
      setError('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<Post>[] = [
    { key: 'id', header: 'ID', className: 'w-16' },
    { key: 'title', header: 'Title' },
    {
      key: 'status',
      header: 'Status',
      render: (post) => <StatusBadge status={post.status} />,
    },
    {
      key: 'category',
      header: 'Category',
      render: (post) => post.category?.name || '-',
    },
    {
      key: 'user',
      header: 'Author',
      render: (post) => post.user?.name || '-',
    },
    { key: 'comments_count', header: 'Comments' },
    {
      key: 'created_at',
      header: 'Created',
      render: (post) => new Date(post.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (post) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/posts/${post.id}`}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(post.id)}
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
        <h1 className="text-2xl font-bold text-foreground">Posts</h1>
      </div>

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search posts..."
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
            data={posts}
            keyExtractor={(post) => post.id}
            emptyMessage="No posts found"
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
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
