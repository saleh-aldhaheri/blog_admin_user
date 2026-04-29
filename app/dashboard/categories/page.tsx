'use client'

import { useEffect, useState, useCallback, FormEvent } from 'react'
import { Pencil, Trash2, X, Check, Loader2, Plus } from 'lucide-react'
import api from '@/lib/axios'
import { DataTable, Column } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FieldError } from '@/components/FieldError'
import { PageLoader } from '@/components/PageLoader'
import type { Category } from '@/types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // New category form state
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.get<{ data: Category[] }>('/admin/categories')
      setCategories(response.data.data)
    } catch {
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setIsCreating(true)
    setCreateError('')

    try {
      await api.post('/admin/categories', { name: newName })
      setNewName('')
      fetchCategories()
    } catch {
      setCreateError('Failed to create category')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await api.delete(`/admin/categories/${deleteId}`)
      setDeleteId(null)
      fetchCategories()
    } catch {
      setError('Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditError('')
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    setIsSaving(true)
    setEditError('')

    try {
      await api.put(`/admin/categories/${editingId}`, { name: editName })
      setEditingId(null)
      setEditName('')
      fetchCategories()
    } catch {
      setEditError('Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const columns: Column<Category>[] = [
    { key: 'id', header: 'ID', className: 'w-20' },
    {
      key: 'name',
      header: 'Name',
      render: (category) => {
        if (editingId === category.id) {
          return (
            <div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <FieldError error={editError} />
            </div>
          )
        }
        return category.name
      },
    },
    { key: 'slug', header: 'Slug' },
    { key: 'posts_count', header: 'Posts' },
    {
      key: 'created_at',
      header: 'Created',
      render: (category) => category.created_at ? new Date(category.created_at).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-32',
      render: (category) => {
        if (editingId === category.id) {
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
              onClick={() => startEdit(category)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteId(category.id)}
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
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
      </div>

      {/* New Category Form */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-card-foreground">Add New Category</h2>
        <form onSubmit={handleCreate} className="flex items-start gap-3">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <FieldError error={createError} />
          </div>
          <button
            type="submit"
            disabled={isCreating || !newName.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          keyExtractor={(category) => category.id}
          emptyMessage="No categories found"
        />
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
