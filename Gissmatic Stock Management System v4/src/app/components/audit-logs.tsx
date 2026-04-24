import React, { useState } from "react";
import { FileText, Search, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAuth } from "./auth-context";
import { AuditLog } from "../../lib/types";

export function AuditLogs() {
  const { auditLogs } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditLog["action"]) => {
    const variants: Record<AuditLog["action"], { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning", color: string }> = {
      "Stock-In": { variant: "success", color: "text-green-600" },
      "Stock-Out": { variant: "warning", color: "text-amber-600" },
      "Adjustment": { variant: "default", color: "text-indigo-600" },
      "Created": { variant: "secondary", color: "text-slate-600" },
      "Updated": { variant: "outline", color: "text-blue-600" },
      "Deleted": { variant: "destructive", color: "text-red-600" },
    };

    const config = variants[action];
    return <Badge variant={config.variant}>{action}</Badge>;
  };

  const getChangeBadge = (detail: string) => {
    if (detail.startsWith("+")) {
      return (
        <Badge variant="success" className="font-mono">
          {detail}
        </Badge>
      );
    } else if (detail.startsWith("-")) {
      return (
        <Badge variant="warning" className="font-mono">
          {detail}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="font-mono text-xs">
          {detail}
        </Badge>
      );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-indigo-600" />
            Activity Log
          </h1>
          <p className="text-slate-500 mt-1">
            Complete audit trail of all inventory changes
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
          <span className="font-medium">Total Entries:</span>
          <span className="font-semibold text-indigo-600">{auditLogs.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by user, item, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="Stock-In">Stock-In</SelectItem>
              <SelectItem value="Stock-Out">Stock-Out</SelectItem>
              <SelectItem value="Adjustment">Adjustment</SelectItem>
              <SelectItem value="Created">Created</SelectItem>
              <SelectItem value="Updated">Updated</SelectItem>
              <SelectItem value="Deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Timestamp</TableHead>
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Action Type</TableHead>
              <TableHead className="font-semibold">Item Name</TableHead>
              <TableHead className="font-semibold">Change Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const { date, time } = formatTimestamp(log.timestamp);
                return (
                  <TableRow key={log.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{date}</span>
                        <span className="text-xs text-slate-500">{time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {log.userName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {log.userEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {log.itemName}
                    </TableCell>
                    <TableCell>{getChangeBadge(log.changeDetail)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium mb-1">Stock-In Events</p>
          <p className="text-2xl font-bold text-green-600">
            {auditLogs.filter((log) => log.action === "Stock-In").length}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-700 font-medium mb-1">Stock-Out Events</p>
          <p className="text-2xl font-bold text-amber-600">
            {auditLogs.filter((log) => log.action === "Stock-Out").length}
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-700 font-medium mb-1">Adjustments</p>
          <p className="text-2xl font-bold text-indigo-600">
            {auditLogs.filter((log) => log.action === "Adjustment").length}
          </p>
        </div>
      </div>
    </div>
  );
}
