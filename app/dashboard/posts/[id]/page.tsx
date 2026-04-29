'use client'

import { useEffect, useState, useRef, ChangeEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react'
import api from '@/lib/axios'
import { StatusBadge } from '@/components/StatusBadge'
import { AvatarCircle } from '@/components/AvatarCircle'
import { FieldError } from '@/components/FieldError'
import { PageLoader } from '@/components/PageLoader'
import type { Post, Category, ContentBlock, ContentBlockUpdate } from '@/types'

type EditableBlock = {
  id: string
  type: 'heading' | 'text' | 'media'
  value: string
  existingMediaId?: number
  existingMediaUrl?: string
  newFile?: File
}

export default function PostDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<string>('')
  const [editStatus, setEditStatus] = useState('')
  const [editBlocks, setEditBlocks] = useState<EditableBlock[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [postRes, catRes] = await Promise.all([
          api.get<{ data: Post }>(`/admin/posts/${id}`),
          api.get<{ data: Category[] }>('/admin/categories'),
        ])
        const postData = postRes.data.data
        setPost(postData)
        setCategories(catRes.data.data)
        setEditTitle(postData.title)
        setEditCategoryId(postData.category?.id?.toString() || '')
        setEditStatus(postData.status)
        
        // Transform content blocks to editable format
        const blocks: EditableBlock[] = postData.content.map((block, index) => ({
          id: `block-${index}`,
          type: block.type,
          value: block.value || '',
          existingMediaId: block.media?.id,
          existingMediaUrl: block.media?.url,
        }))
        setEditBlocks(blocks.length > 0 ? blocks : [{ id: 'block-0', type: 'text', value: '' }])
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number } }
          if (axiosErr.response?.status === 404) {
            setNotFound(true)
            return
          }
        }
        setError('Failed to load post')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const addBlock = (type: 'heading' | 'text' | 'media') => {
    const newBlock: EditableBlock = {
      id: `block-${Date.now()}`,
      type,
      value: '',
    }
    setEditBlocks([...editBlocks, newBlock])
  }

  const removeBlock = (blockId: string) => {
    setEditBlocks(editBlocks.filter((b) => b.id !== blockId))
  }

  const updateBlockValue = (blockId: string, value: string) => {
    setEditBlocks(editBlocks.map((b) => (b.id === blockId ? { ...b, value } : b)))
  }

  const updateBlockType = (blockId: string, type: 'heading' | 'text' | 'media') => {
    setEditBlocks(editBlocks.map((b) => {
      if (b.id === blockId) {
        return { 
          ...b, 
          type, 
          value: type === 'media' ? '' : b.value,
          existingMediaId: undefined,
          existingMediaUrl: undefined,
          newFile: undefined,
        }
      }
      return b
    }))
  }

  const handleFileSelect = (blockId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditBlocks(editBlocks.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            newFile: file,
            existingMediaId: undefined,
            existingMediaUrl: undefined,
          }
        }
        return b
      }))
    }
  }

  const triggerFileInput = (blockId: string) => {
    fileInputRefs.current[blockId]?.click()
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveErrors({})
    setSaveSuccess(false)

    try {
      // Build content array for PUT request
      const content: ContentBlockUpdate[] = editBlocks.map((block, index) => {
        const base = {
          type: block.type,
          order: String(index + 1),
        }

        if (block.type === 'media') {
          if (block.newFile) {
            return {
              ...base,
              media: {
                newMedia: {
                  name: block.newFile.name,
                  size: String(block.newFile.size),
                },
              },
            }
          } else if (block.existingMediaId) {
            return {
              ...base,
              media: {
                existingMediaId: block.existingMediaId,
              },
            }
          }
          return base
        }

        return {
          ...base,
          value: block.value,
        }
      })

      const payload = {
        title: editTitle,
        categoryId: editCategoryId,
        status: editStatus,
        content,
      }

      await api.put(`/admin/posts/${id}`, payload)
      setSaveSuccess(true)
      
      // Refresh post data
      const postRes = await api.get<{ data: Post }>(`/admin/posts/${id}`)
      const postData = postRes.data.data
      setPost(postData)
      
      // Update editable blocks with new data
      const blocks: EditableBlock[] = postData.content.map((block, index) => ({
        id: `block-${index}`,
        type: block.type,
        value: block.value || '',
        existingMediaId: block.media?.id,
        existingMediaUrl: block.media?.url,
      }))
      setEditBlocks(blocks.length > 0 ? blocks : [{ id: 'block-0', type: 'text', value: '' }])
    } catch {
      setSaveErrors({ general: 'Failed to save changes' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <PageLoader />

  if (notFound) {
    return (
      <div className="p-6">
        <Link
          href="/dashboard/posts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Post not found</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Link
          href="/dashboard/posts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!post) return null

  // Calculate total interactions
  const totalInteractions = Object.values(post.interaction_counts).reduce((a, b) => a + b, 0)

  return (
    <div className="p-6">
      <Link
        href="/dashboard/posts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Posts
      </Link>

      {/* Post Metadata */}
      <div className="mb-6 rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">{post.title}</h1>
            <div className="mt-2 flex items-center gap-4">
              <StatusBadge status={post.status} />
              {post.category && (
                <span className="text-sm text-muted-foreground">
                  Category: {post.category.name}
                </span>
              )}
            </div>
          </div>
          {post.thumbnail && (
            <img
              src={post.thumbnail}
              alt={post.title}
              className="h-24 w-32 rounded-lg object-cover"
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <AvatarCircle src={post.user?.avatar || null} name={post.user?.name || 'Unknown'} size="sm" />
          <div>
            <p className="text-sm font-medium text-card-foreground">{post.user?.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">
              Created {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 border-t border-border pt-4 text-sm text-muted-foreground">
          <span>{totalInteractions} interactions</span>
          <span>{post.comments_count} comments</span>
        </div>
      </div>

      {/* Post Content Display */}
      <div className="mb-6 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">Current Content</h2>
        <div className="space-y-4">
          {post.content.length > 0 ? (
            post.content
              .sort((a, b) => a.order - b.order)
              .map((block, index) => (
                <div key={index} className="rounded border border-border p-3">
                  <span className="mb-1 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {block.type} (order: {block.order})
                  </span>
                  {block.type === 'media' && block.media ? (
                    <div className="mt-2">
                      <img
                        src={block.media.url}
                        alt="Media content"
                        className="max-h-48 rounded object-contain"
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-card-foreground">{block.value || '(empty)'}</p>
                  )}
                </div>
              ))
          ) : (
            <p className="text-muted-foreground">No content available</p>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">Edit Post</h2>

        {saveSuccess && (
          <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-600">
            Changes saved successfully
          </div>
        )}

        {saveErrors.general && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {saveErrors.general}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-card-foreground"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <FieldError error={saveErrors.title} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-card-foreground"
              >
                Category
              </label>
              <select
                id="category"
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <FieldError error={saveErrors.categoryId} />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-card-foreground"
              >
                Status
              </label>
              <select
                id="status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
              </select>
              <FieldError error={saveErrors.status} />
            </div>
          </div>

          {/* Content Blocks Editor */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Content Blocks
            </label>
            <div className="space-y-3">
              {editBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3"
                >
                  <div className="flex items-center pt-2 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <span className="ml-1 text-xs">{index + 1}</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <select
                      value={block.type}
                      onChange={(e) => updateBlockType(block.id, e.target.value as 'heading' | 'text' | 'media')}
                      className="w-32 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
                    >
                      <option value="heading">Heading</option>
                      <option value="text">Text</option>
                      <option value="media">Media</option>
                    </select>

                    {block.type === 'media' ? (
                      <div className="space-y-2">
                        {block.existingMediaUrl && !block.newFile && (
                          <div className="flex items-center gap-2">
                            <img
                              src={block.existingMediaUrl}
                              alt="Current media"
                              className="h-16 w-24 rounded object-cover"
                            />
                            <span className="text-xs text-muted-foreground">
                              Current media (ID: {block.existingMediaId})
                            </span>
                          </div>
                        )}
                        {block.newFile && (
                          <div className="flex items-center gap-2 rounded bg-primary/10 px-2 py-1">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <span className="text-xs text-primary">
                              New: {block.newFile.name}
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => { fileInputRefs.current[block.id] = el }}
                          onChange={(e) => handleFileSelect(block.id, e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => triggerFileInput(block.id)}
                          className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
                        >
                          <ImageIcon className="h-3 w-3" />
                          {block.existingMediaUrl || block.newFile ? 'Change' : 'Select'} Image
                        </button>
                      </div>
                    ) : (
                      <textarea
                        value={block.value}
                        onChange={(e) => updateBlockValue(block.id, e.target.value)}
                        placeholder={block.type === 'heading' ? 'Heading text...' : 'Paragraph text...'}
                        rows={block.type === 'heading' ? 1 : 3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600"
                    title="Remove block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => addBlock('heading')}
                className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
              >
                <Plus className="h-3 w-3" /> Heading
              </button>
              <button
                type="button"
                onClick={() => addBlock('text')}
                className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
              >
                <Plus className="h-3 w-3" /> Text
              </button>
              <button
                type="button"
                onClick={() => addBlock('media')}
                className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
              >
                <Plus className="h-3 w-3" /> Media
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
