export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground text-sm">
          Welcome to the DocIntel API documentation. This page is currently being generated 
          from our OpenAPI schema and will be available shortly.
        </p>
        <div className="p-4 bg-secondary rounded-lg border border-border inline-block text-left mt-8 w-full max-w-md">
          <pre className="text-[10px] font-mono text-muted-foreground overflow-auto">
{`GET /api/v1/documents
POST /api/v1/query
GET /api/v1/analytics/metrics`}
          </pre>
        </div>
        <div className="mt-8">
          <a href="/" className="btn-secondary">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}
