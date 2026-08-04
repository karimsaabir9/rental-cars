"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { matchesQuery } from "@/lib/search";
import { paginate } from "@/lib/paginate";
import { auditActionLabel, auditDetails, auditEntityLabel } from "@/lib/audit-log-format";
import type { RouterOutputs } from "@/trpc/routers/_app";

const PAGE_SIZE = 15;

function entryMatches(entry: RouterOutputs["auditLog"]["listAll"][number], query: string) {
  return matchesQuery(
    [entry.actor.name, entry.actor.email, entry.entityType, entry.action],
    query,
  );
}

export function AdminAuditLogTable() {
  const { data: entries, isLoading } = trpc.auditLog.listAll.useQuery();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
        No audit log entries yet.
      </div>
    );
  }

  const filtered = entries.filter((e) => entryMatches(e, query));
  const { items: pageItems, page: currentPage, pageCount } = paginate(filtered, page, PAGE_SIZE);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            className="w-64 pl-8"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search actor or action"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No entries match your search.
              </TableCell>
            </TableRow>
          )}
          {pageItems.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
              </TableCell>
              <TableCell>
                {entry.actor.name}
                <div className="text-xs text-muted-foreground">{entry.actor.email}</div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{auditEntityLabel(entry.entityType)}</Badge>
              </TableCell>
              <TableCell>{auditActionLabel(entry.action)}</TableCell>
              <TableCell className="font-mono text-sm tabular-nums">
                {auditDetails(entry.action, entry.metadata)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
    </>
  );
}
