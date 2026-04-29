'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'
import api from '@/lib/axios'
import { DataTable, Column } from '@/components/DataTable'
import { Pagination } from '@/components/Pagination'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FieldError } from '@/components/FieldError'
import { PageLoader } from '@/components/PageLoader'
import { AvatarCircle } from '@/components/AvatarCircle'
import type { Comment, PaginatedResponse } from '@/types'

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [meta, setMeta] = useState<{ next_cursor: string | null; prev_cursor: string | null }>({
    next_cursor: null,
    prev_cursor: null,
  })
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (cursor) params.cursor = cursor

      const response = await api.get<PaginatedResponse<Comment>>('/admin/comments', { params })
      setComments(response.data.data)
      setMeta({
        next_cursor: response.data.meta.next_cursor,
        prev_cursor: response.data.meta.prev_cursor,
      })
    } catch {
      setError('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }, [cursor])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await api.delete(`/admin/comments/${deleteId}`)
      setDeleteId(null)
      fetchComments()
    } catch {
      setError('Failed to delete comment')
    } finally {
      setIsDeleting(false)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
    setEditError('')
  }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    setEditError('')

    try {
      await api.put(`/admin/comments/${editingId}`, {
        content: editContent,
      })
      setEditingId(null)
      setEditContent('')
      fetchComments()
    } catch {
      setEditError('Failed to save comment')
    } finally {
      setIsSaving(false)
    }
  }

  const truncateContent = (content: string, maxLength = 80) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  const columns: Column<Comment>[] = [
    { key: 'id', header: 'ID', className: 'w-16' },
    {
      key: 'content',
      header: 'Content',
      render: (comment) => {
        if (editingId === comment.id) {
          return (
            <div className="min-w-[300px] space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
              />
              <FieldError error={editError} />
            </div>
          )
        }
        return truncateContent(comment.content)
      },
    },
    {
      key: 'post',
      header: 'Post',
      render: (comment) => comment.post ? (
        <Link 
          href={`/dashboard/posts/${comment.post.id}`}
          className="text-primary hover:underline"
        >
          {truncateContent(comment.post.title, 30)}
        </Link>
      ) : '-',
    },
    {
      key: 'user',
      header: 'Author',
      render: (comment) => (
        <div className="flex items-center gap-2">
          <AvatarCircle src={comment.user?.avatar || null} name={comment.user?.name || 'Unknown'} size="sm" />
          <span>{comment.user?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (comment) => new Date(comment.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (comment) => {
        if (editingId === comment.id) {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={saveEdit}
                disabled={isSaving}
                className="rounded p-1 text-emerald-600 hover:bg-emerald-100"
                title="Save"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(comment)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteId(comment.id)}
              className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Comments</h1>
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
            data={comments}
            keyExtractor={(comment) => comment.id}
            emptyMessage="No comments found"
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
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
