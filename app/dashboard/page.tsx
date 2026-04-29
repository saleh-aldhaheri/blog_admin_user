'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, FileText, MessageSquare, Heart } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '@/lib/axios'
import type { DashboardResponse, Post, Category } from '@/types'

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] ?? styles.archived}`}
    >
      {status}
    </span>
  )
}

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>
  )
}

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data',
}: {
  columns: { key: string; header: string; render?: (row: T) => React.ReactNode }[]
  data: T[]
  keyExtractor: (row: T) => string | number
  emptyMessage?: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-card-foreground">
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get<{ data: DashboardResponse }>('/admin/dashboard')
        setDashboard(response.data)
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (isLoading) return <PageLoader />

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!dashboard) return null

  const userGrowthData = dashboard.analytics.user_growth.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: point.total,
  }))

  const postGrowthData = dashboard.analytics.post_growth.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: point.total,
  }))

  const engagementsByDate = dashboard.engagements.reduce(
    (acc, curr) => {
      const date = new Date(curr.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      if (!acc[date]) acc[date] = { date, total: 0 }
      acc[date].total += curr.total
      return acc
    },
    {} as Record<string, { date: string; total: number }>,
  )
  const engagementData = Object.values(engagementsByDate)

  const postColumns = [
    {
      key: 'title',
      header: 'Title',
      render: (post: Post) => (
        <Link
          href={`/dashboard/posts/${post.id}`}
          className="hover:text-primary hover:underline line-clamp-1"
        >
          {post.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (post: Post) => <StatusBadge status={post.status} />,
    },
    { key: 'comments_count', header: 'Comments' },
    {
      key: 'user',
      header: 'Author',
      render: (post: Post) => post.user?.name || '-',
    },
  ]

  const categoryColumns = [
    { key: 'name', header: 'Category' },
    { key: 'posts_count', header: 'Posts' },
  ]

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      color: 'var(--card-foreground)',
    },
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Users"
          value={dashboard.stats.users.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Total Posts"
          value={dashboard.stats.posts.toLocaleString()}
          icon={<FileText className="h-5 w-5" />}
        />
        <MetricCard
          label="Total Comments"
          value={dashboard.stats.comments.toLocaleString()}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <MetricCard
          label="Total Interactions"
          value={dashboard.stats.interactions.toLocaleString()}
          icon={<Heart className="h-5 w-5" />}
        />
      </div>

      {/* Growth charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold text-card-foreground">User Growth</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--primary)', r: 3 }}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold text-card-foreground">Post Growth</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={postGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ fill: 'var(--chart-2)', r: 3 }}
                name="Posts"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagements chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold text-card-foreground">Daily Engagement</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Interactions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Recent Posts</h2>
          <DataTable
            columns={postColumns}
            data={dashboard.contents.recent_posts}
            keyExtractor={(post: Post) => post.id}
            emptyMessage="No recent posts"
          />
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Top Liked Posts</h2>
          <DataTable
            columns={postColumns}
            data={dashboard.contents.top_liked_posts}
            keyExtractor={(post: Post) => post.id}
            emptyMessage="No posts"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-foreground">Posts per Category</h2>
        <DataTable
          columns={categoryColumns}
          data={dashboard.contents.post_per_category}
          keyExtractor={(cat: Category) => cat.id}
          emptyMessage="No categories"
        />
      </div>
    </div>
  )
}