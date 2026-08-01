import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">
        You don't have permission to view this page.
      </p>
      <Link
        href="/redirect"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Go to my dashboard
      </Link>
    </div>
  );
}
